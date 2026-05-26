const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    category: {
      type: String,
      enum: ["adventure", "party", "trek", "luxury", "peaceful"],
      default: "peaceful",
    },

    budget: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    budgetPerDay: {
      min: {
        type: Number,
        default: 800,
      },
      max: {
        type: Number,
        default: 3000,
      },
    },

    maxMembers: {
      type: Number,
      required: true,
    },

    currentMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    filters: {
      smokingAllowed: {
        type: Boolean,
        default: false,
      },

      drinkingAllowed: {
        type: Boolean,
        default: false,
      },

      genderPreference: {
        type: String,
        enum: ["any", "male", "female"],
        default: "any",
      },
    },

    status: {
      type: String,
      enum: ["open", "full", "completed", "cancelled"],
      default: "open",
    },

    coverImage: {
      type: String,
      default: "",
    },

    aiItinerary: {
      plan: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      style: {
        type: String,
        default: "",
      },
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", tripSchema);
