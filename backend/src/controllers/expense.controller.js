const Expense = require("../models/Expense");
const Member = require("../models/Member");
const Notification = require("../models/Notification");
const Settlement = require("../models/Settlement");
const Trip = require("../models/Trip");
const User = require("../models/User");
const mongoose = require("mongoose");

const cloudinary =require("../config/cloudinary");
const streamifier =require("streamifier");

async function canAccessTripExpenses(tripId, userId) {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return { allowed: false, reason: "Invalid trip id" };
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { allowed: false, reason: "Trip not found" };
  }

  if (trip.admin.toString() === userId) {
    return { allowed: true, trip };
  }

  const member = await Member.findOne({
    tripId,
    userId,
    status: "accepted",
  });

  return member
    ? { allowed: true, trip }
    : { allowed: false, reason: "Access denied" };
}

function emitNotification(req, receiverId) {
  req.app.get("io")?.to(receiverId.toString()).emit("notification:new");
}

// First calculate every member's raw money position from expenses only.
// Positive balance means the member should receive money; negative means pay.
function calculateRawBalances(expenses, members) {
  const balances = new Map(
    members.map((member) => [
      member._id.toString(),
      {
        userId: member._id,
        name: member.name || "Traveler",
        balance: 0,
      },
    ])
  );

  expenses.forEach((expense) => {
    if (!expense.splitEqually || members.length === 0) {
      return;
    }

    const paidById = expense.paidBy._id.toString();
    const share = expense.amount / members.length;

    members.forEach((member) => {
      const memberBalance = balances.get(member._id.toString());
      memberBalance.balance -= share;
    });

    const payerBalance = balances.get(paidById);
    if (payerBalance) {
      payerBalance.balance += expense.amount;
    }
  });

  return balances;
}

function applySettlementsToBalances(balances, settlements) {
  // Settlements are stored separately from expenses, so original expense history
  // stays immutable while paid amounts reduce the remaining balances.
  settlements.forEach((settlement) => {
    const fromBalance = balances.get(settlement.from.toString());
    const toBalance = balances.get(settlement.to.toString());

    if (fromBalance) {
      fromBalance.balance += settlement.amount;
    }

    if (toBalance) {
      toBalance.balance -= settlement.amount;
    }
  });
}

function calculateBalance(expenses, members, settlements, userId) {
  const balances = calculateRawBalances(expenses, members);
  applySettlementsToBalances(balances, settlements);
  const userBalance = Math.round(balances.get(userId)?.balance || 0);

  return {
    owe: userBalance < 0 ? Math.abs(userBalance) : 0,
    owed: userBalance > 0 ? userBalance : 0,
  };
}

function calculateSettlementPlan(expenses, members, paidSettlements) {
  const balances = calculateRawBalances(expenses, members);
  applySettlementsToBalances(balances, paidSettlements);

  const debtors = [];
  const creditors = [];

  balances.forEach((memberBalance) => {
    const roundedBalance = Math.round(memberBalance.balance);

    if (roundedBalance < 0) {
      debtors.push({
        ...memberBalance,
        balance: Math.abs(roundedBalance),
      });
    }

    if (roundedBalance > 0) {
      creditors.push({
        ...memberBalance,
        balance: roundedBalance,
      });
    }
  });

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  // Match debtors to creditors with the smallest needed transfers.
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0) {
      settlements.push({
        id: `${debtor.userId}-${creditor.userId}`,
        from: {
          userId: debtor.userId,
          name: debtor.name,
        },
        to: {
          userId: creditor.userId,
          name: creditor.name,
        },
        amount,
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance === 0) {
      debtorIndex += 1;
    }

    if (creditor.balance === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

function calculateLegacyBalance(expenses, memberCount, userId) {
  return expenses.reduce(
    (balance, expense) => {
      if (!expense.splitEqually || memberCount === 0) {
        return balance;
      }

      const share = expense.amount / memberCount;
      const paidById = expense.paidBy._id.toString();

      if (paidById === userId) {
        balance.owed += expense.amount - share;
      } else {
        balance.owe += share;
      }

      return balance;
    },
    { owe: 0, owed: 0 }
  );
}

const getTripExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      const statusCode =
        access.reason === "Trip not found" || access.reason === "Invalid trip id"
          ? 404
          : 403;
      return res.status(statusCode).json({
        message: access.reason,
      });
    }

    const expenses = await Expense.find({ tripId })
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });
    const tripMembers = await User.find({
      _id: { $in: access.trip.currentMembers },
    }).select("name email");

    const paidSettlements = await Settlement.find({ tripId });
    const balance = calculateBalance(expenses, tripMembers, paidSettlements, userId);
    const settlements = calculateSettlementPlan(
      expenses,
      tripMembers,
      paidSettlements
    ).filter(
      // Privacy rule: each user only sees payments involving them.
      (settlement) =>
        settlement.from.userId.toString() === userId ||
        settlement.to.userId.toString() === userId
    );

    res.status(200).json({
      balance: {
        owe: Math.round(balance.owe),
        owed: Math.round(balance.owed),
      },
      settlements,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createTripExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const {
      amount,
      description,
      category = "Misc",
      splitEqually = true,
      //both get data from cloudinary
      receiptName = "",
      receiptImage = "",
    } = req.body;

    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      const statusCode =
        access.reason === "Trip not found" || access.reason === "Invalid trip id"
          ? 404
          : 403;
      return res.status(statusCode).json({
        message: access.reason,
      });
    }

    if (!amount || Number(amount) <= 0 || !description?.trim()) {
      return res.status(400).json({
        message: "Amount and description are required",
      });
    }
 

// Receipt upload is optional. If present, store the image in Cloudinary and
// keep only the URL/name in MongoDB so future AI extraction can read it.
if (req.file) {

  const result =
    await new Promise(
      (resolve, reject) => {

        const stream =
          cloudinary.uploader.upload_stream(

            {
              folder:
                "travel-buddy-expenses",
            },

            (error, result) => {

              if (error) {

                reject(error);

              } else {

                resolve(result);
              }
            }
          );

        streamifier
          .createReadStream(
            req.file.buffer
          )
          .pipe(stream);
      }
    );

  receiptImage =
    result.secure_url;

  receiptName =
    req.file.originalname;
}

    const expense = await Expense.create({
      tripId,
      paidBy: userId,
      amount: Number(amount),
      description: description.trim(),
      category,
      splitEqually,
      receiptName,
      receiptImage,
    });

    const populatedExpense = await expense.populate("paidBy", "name email");
    const sender = await User.findById(userId).select("name");
    const receivers = access.trip.currentMembers.filter(
      (memberId) => memberId.toString() !== userId
    );

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
    res.status(500).json({
      message: error.message,
    });
  }
};

const settleTripPayment = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { from, to, amount } = req.body;

    const access = await canAccessTripExpenses(tripId, userId);

    if (!access.allowed) {
      const statusCode =
        access.reason === "Trip not found" || access.reason === "Invalid trip id"
          ? 404
          : 403;
      return res.status(statusCode).json({
        message: access.reason,
      });
    }

    if (!from || !to || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Settlement details are required",
      });
    }

    if (from !== userId && to !== userId) {
      return res.status(403).json({
        message: "You can only settle payments involving you",
      });
    }

    const fromIsMember = access.trip.currentMembers.some(
      (memberId) => memberId.toString() === from
    );
    const toIsMember = access.trip.currentMembers.some(
      (memberId) => memberId.toString() === to
    );

    if (!fromIsMember || !toIsMember) {
      return res.status(400).json({
        message: "Settlement users must be trip members",
      });
    }

    await Settlement.create({
      tripId,
      from,
      to,
      amount: Number(amount),
      settledBy: userId,
    });

    // Payment notification goes only to the other person in this transaction.
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

    res.status(200).json({
      message: "Payment settled",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createTripExpense,
  getTripExpenses,
  settleTripPayment,
};
