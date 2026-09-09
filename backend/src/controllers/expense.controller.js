const Expense = require("../models/Expense");
const Member = require("../models/Member");
const Notification = require("../models/Notification");
const Settlement = require("../models/Settlement");
const Trip = require("../models/Trip");
const User = require("../models/User");
const mongoose = require("mongoose");

const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { extractReceiptDataFromUrl } = require("./ai.controller");

const {
  generateEqualSplits,
  calculateRawBalances,
  applySettlementsToBalances,
  calculateBalance,
  calculateSettlementPlan,
} = require("../utils/settlement");

async function canAccessTripExpenses(tripId, userId) {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return { allowed: false, reason: "Invalid trip id" };
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { allowed: false, reason: "Trip not found" };
  }

  if (trip.admin.toString() === userId) {
    return { allowed: true, trip, isAdmin: true };
  }

  const member = await Member.findOne({
    tripId,
    userId,
    status: "accepted",
  });

  return member
    ? { allowed: true, trip, isAdmin: false }
    : { allowed: false, reason: "Access denied" };
}

function emitNotification(req, receiverId) {
  req.app.get("io")?.to(receiverId.toString()).emit("notification:new");
}

function normalizeExpenseCategory(category) {
  return ["Flights", "Food", "Hotel", "Misc"].includes(category)
    ? category
    : "Misc";
}

function getStatusCode(reason) {
  return reason === "Trip not found" || reason === "Invalid trip id" ? 404 : 403;
}

function getMemberIds(trip) {
  return trip.currentMembers.map((memberId) => memberId.toString());
}

async function getTripMembers(trip) {
  return User.find({ _id: { $in: trip.currentMembers } }).select("name email");
}

const getTripExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      return res.status(getStatusCode(access.reason)).json({
        message: access.reason,
      });
    }

    const tripMembers = await getTripMembers(access.trip);
    const expenses = await Expense.find({ tripId })
      .populate("paidBy", "name email")
      .populate("splits.userId", "name email")
      .sort({ createdAt: -1 });

    const visibleExpenses = access.isAdmin
      ? expenses
      : expenses.filter((expense) => {
          const isPayer = expense.paidBy?._id?.toString() === userId;
          const isParticipant = expense.splits.some(
            (split) => split.userId?._id?.toString() === userId
          );
          return isPayer || isParticipant;
        });

    const paidSettlements = await Settlement.find({ tripId });
    const balance = calculateBalance(
      expenses,
      tripMembers,
      paidSettlements,
      userId
    );
    const settlements = calculateSettlementPlan(
      expenses,
      tripMembers,
      paidSettlements
    ).filter(
      (settlement) =>
        settlement.from.userId.toString() === userId ||
        settlement.to.userId.toString() === userId
    );

    res.status(200).json({
      balance: {
        owe: balance.owe,
        owed: balance.owed,
      },
      settlements,
      expenses: visibleExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTripExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    let {
      amount,
      description,
      category = "Misc",
      paidBy = userId,
      splitType = "equal",
    } = req.body;
    let splitWith = req.body.splitWith;
    let receiptName = req.body.receiptName || "";
    let receiptImage = req.body.receiptImage || "";

    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      return res.status(getStatusCode(access.reason)).json({
        message: access.reason,
      });
    }

    if (!req.file && (!amount || Number(amount) <= 0 || !description?.trim())) {
      return res.status(400).json({
        message: "Amount and description are required when no receipt is uploaded",
      });
    }

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "tripsync/expense-receipts",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      receiptImage = result.secure_url;
      receiptName = req.file.originalname;

      if (!amount || !description?.trim()) {
        const extractedExpense = await extractReceiptDataFromUrl(receiptImage);
        amount = amount || extractedExpense.amount;
        description = description?.trim() || extractedExpense.description;
        category = normalizeExpenseCategory(extractedExpense.category || category);
      }
    }

    if (!amount || Number(amount) <= 0 || !description?.trim()) {
      return res.status(400).json({
        message: "Could not read amount and description from receipt",
      });
    }

    if (splitType !== "equal") {
      return res.status(400).json({
        message: "Only equal splits are supported right now",
      });
    }

    const memberIds = getMemberIds(access.trip);
    if (!memberIds.includes(paidBy.toString())) {
      return res.status(400).json({ message: "Payer must be a trip member" });
    }

    if (typeof splitWith === "string") {
      try {
        splitWith = JSON.parse(splitWith);
      } catch {
        splitWith = splitWith.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(splitWith)) {
      splitWith = access.trip.currentMembers.map((memberId) => memberId.toString());
    }

    const uniqueParticipants = [...new Set(splitWith.map((id) => id.toString()))];

    if (!uniqueParticipants.length) {
      return res.status(400).json({ message: "Select at least one participant" });
    }

    const hasInvalidParticipant = uniqueParticipants.some(
      (participantId) => !memberIds.includes(participantId)
    );

    if (hasInvalidParticipant) {
      return res.status(400).json({
        message: "All expense participants must be trip members",
      });
    }

    const splits = generateEqualSplits(Number(amount), uniqueParticipants);

    const expense = await Expense.create({
      tripId,
      paidBy,
      amount: Number(amount),
      description: description.trim(),
      category: normalizeExpenseCategory(category),
      splitType,
      splits,
      receiptName,
      receiptImage,
    });

    const populatedExpense = await expense.populate([
      { path: "paidBy", select: "name email" },
      { path: "splits.userId", select: "name email" },
    ]);

    const sender = await User.findById(userId).select("name");
    const involvedMembers = new Set([
      paidBy.toString(),
      ...uniqueParticipants,
    ]);
    involvedMembers.delete(userId.toString());

    const receivers = [...involvedMembers];
    if (receivers.length) {
      await Notification.insertMany(
        receivers.map((receiver) => ({
          receiver,
          sender: userId,
          tripId,
          type: "expense-added",
          message: `${sender?.name || "A traveler"} added Rs ${Number(amount)} expense`,
        }))
      );
      receivers.forEach((receiver) => emitNotification(req, receiver));
    }

    res.status(201).json({
      message: "Expense added",
      expense: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const settleTripPayment = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { from, to, amount } = req.body;
    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      return res.status(getStatusCode(access.reason)).json({
        message: access.reason,
      });
    }

    if (!from || !to || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Settlement details are required" });
    }

    if (from !== userId && to !== userId) {
      return res.status(403).json({
        message: "You can only settle payments involving you",
      });
    }

    const memberIds = getMemberIds(access.trip);
    if (!memberIds.includes(from) || !memberIds.includes(to)) {
      return res.status(400).json({
        message: "Settlement users must be trip members",
      });
    }

    await Settlement.create({
      tripId,
      from,
      to,
      amount: Number(amount),
      markedPaidBy: userId,
    });

    const sender = await User.findById(userId).select("name");
    const receiver = from === userId ? to : from;

    await Notification.create({
      receiver,
      sender: userId,
      tripId,
      type: "payment-settled",
      message: `${sender?.name || "A traveler"} settled Rs ${Number(amount)}`,
    });
    emitNotification(req, receiver);

    res.status(200).json({ message: "Payment marked as paid" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTripExpense,
  getTripExpenses,
  settleTripPayment,
  calculateRawBalances,
  applySettlementsToBalances,
  calculateBalance,
  calculateSettlementPlan,
  canAccessTripExpenses,
};
