const Expense = require("../models/Expense");
const Member = require("../models/Member");
const Trip = require("../models/Trip");
const mongoose = require("mongoose");

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

function calculateBalance(expenses, memberCount, userId) {
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

    const memberCount = Math.max(access.trip.currentMembers.length, 1);
    const balance = calculateBalance(expenses, memberCount, userId);

    res.status(200).json({
      balance: {
        owe: Math.round(balance.owe),
        owed: Math.round(balance.owed),
      },
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

module.exports = {
  createTripExpense,
  getTripExpenses,
};
