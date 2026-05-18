const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240,
    },

    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["", "male", "female", "other", "prefer-not-to-say"],
      default: "",
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    occupation: {
      type: String,
      default: "",
      trim: true,
    },

    languages: {
      type: String,
      default: "",
      trim: true,
    },

    travelProfile: {
      travelStyle: {
        type: String,
        enum: ["", "planner", "flexible", "slow-travel", "social", "quiet"],
        default: "",
      },

      groupRole: {
        type: String,
        enum: ["", "organizer", "photographer", "navigator", "food-explorer", "easy-going"],
        default: "",
      },

      pastTravel: {
        type: String,
        default: "",
        trim: true,
        maxlength: 400,
      },

      currentLife: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
      },

      whyTravel: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
      },

      favoriteThings: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
      },

      boundaries: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
      },
    },

    compatibility: {
      spendingBehavior: {
        type: String,
        enum: ["", "strict", "flexible", "luxury"],
        default: "",
      },

      expenseSplit: {
        type: String,
        enum: ["", "equal", "actual", "flexible"],
        default: "",
      },

      sleepSchedule: {
        type: String,
        enum: ["", "early", "late-night", "flexible"],
        default: "",
      },

      morningStyle: {
        type: String,
        enum: ["", "relaxed", "packed"],
        default: "",
      },

      cleanliness: {
        type: String,
        enum: ["", "organized", "chill", "messy"],
        default: "",
      },

      socialEnergy: {
        type: String,
        enum: ["", "introvert", "balanced", "extrovert"],
        default: "",
      },

      foodPreference: {
        type: String,
        enum: ["", "vegetarian", "non-veg", "vegan", "flexible", "food-explorer"],
        default: "",
      },

      activityPreference: {
        type: String,
        enum: ["", "party", "cafes", "trekking", "photography", "relaxation", "adventure"],
        default: "",
      },

      travelPace: {
        type: String,
        enum: ["", "packed", "balanced", "slow"],
        default: "",
      },

      communicationStyle: {
        type: String,
        enum: ["", "direct", "quiet", "social", "planner"],
        default: "",
      },
    },

    preferences: {
      smoking: {
        type: Boolean,
        default: false,
      },

      drinking: {
        type: Boolean,
        default: false,
      },

      vibe: {
        type: String,
        enum: ["peaceful", "party", "adventure", "luxury"],
        default: "peaceful",
      },

      budget: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },

    refreshToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
