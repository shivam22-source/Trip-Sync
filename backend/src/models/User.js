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