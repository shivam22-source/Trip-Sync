const mongoose = require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {

      receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
      },

      type: {
        type: String,
        enum: [
          "join-request",
          "request-accepted",
          "request-rejected",
          "expense-added",
          "payment-settled",
          "trip-start-reminder",
        ],
      },

      message: {
        type: String,
        required: true,
      },

      isRead: {
        type: Boolean,
        default: false,
      },
    },

  {
    timestamps: true,
  }
  );

notificationSchema.index({ receiver: 1, createdAt: -1 });

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );
