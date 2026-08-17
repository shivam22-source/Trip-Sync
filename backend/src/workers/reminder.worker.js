const { Worker } = require("bullmq");
const redis = require("../config/bullmq.redis");

const Trip = require("../models/Trip");
const Notification = require("../models/Notification");

const worker = new Worker(
  "trip-reminders",
  async (job) => {
    console.log(`Processing job: ${job.id}`);

    const { tripId } = job.data;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const receivers = trip.currentMembers;

    if (!receivers.length) {
      console.log(`No members to notify for trip ${tripId}`);
      return;
    }

    const message = `Your trip "${trip.title}" starts tomorrow. Get ready!`;

    const existingNotifications = await Notification.find({
      tripId: trip._id,
      type: "trip-start-reminder",
      receiver: { $in: receivers },
    }).select("receiver");

    const alreadyNotified = new Set(
      existingNotifications.map((notification) =>
        notification.receiver.toString()
      )
    );

    const pendingReceivers = receivers.filter(
      (receiver) => !alreadyNotified.has(receiver.toString())
    );

    if (pendingReceivers.length) {
      await Notification.insertMany(
        pendingReceivers.map((receiver) => ({
          receiver,
          tripId: trip._id,
          type: "trip-start-reminder",
          message,
        }))
      );
    }

    console.log(
      `Reminder processed for trip ${tripId}. Notifications created: ${pendingReceivers.length}`
    );
  },
  {
    connection: redis,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

module.exports = worker;