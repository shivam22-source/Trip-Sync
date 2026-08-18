const { publisher } = require("../config/realtime.redis");

const NOTIFICATION_CHANNEL = "tripsync:notifications";

async function publishNotificationEvent(receiverId) {
  try {
    await publisher.publish(
      NOTIFICATION_CHANNEL,
      JSON.stringify({
        receiverId: receiverId.toString(),
      })
    );
  } catch (error) {
    console.warn("Realtime notification publish skipped:", error.message);
  }
}

module.exports = {
  NOTIFICATION_CHANNEL,
  publishNotificationEvent,
};
