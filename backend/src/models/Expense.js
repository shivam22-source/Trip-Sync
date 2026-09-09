const mongoose = require("mongoose");

const splitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Flights", "Food", "Hotel", "Misc"],
      default: "Misc",
    },

    splitType: {
      type: String,
      enum: ["equal"],
      default: "equal",
    },

    splits: {
      type: [splitSchema],
      default: [],
    },

    receiptName: {
      type: String,
      default: "",
      trim: true,
    },

    receiptImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ tripId: 1, createdAt: -1 });
expenseSchema.index({ tripId: 1, paidBy: 1, createdAt: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
