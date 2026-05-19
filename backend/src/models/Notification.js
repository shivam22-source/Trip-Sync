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

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );
