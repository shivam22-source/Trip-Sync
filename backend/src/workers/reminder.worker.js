require("dotenv").config();
const { Worker } = require("bullmq");
const redis = require("../config/bullmq.redis");
const connectMongoDB = require("../config/mongodb");
const Trip = require("../models/Trip");
const Notification = require("../models/Notification");
const {
  publishNotificationEvent,
} = require("../services/realtime.service");


async function startWorker() {
  await connectMongoDB();

  const worker = new Worker(
    "trip-reminders",
    async (job) => {
      const { tripId } = job.data;

      console.log(`Processing reminder for trip ${tripId}`);

      const trip = await Trip.findById(tripId);

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      if (!trip.currentMembers.length) {
        console.log(`No members in trip ${tripId}`);
        return;
      }

      const existingNotifications = await Notification.find({
        tripId: trip._id,
        type: "trip-start-reminder",
        receiver: { $in: trip.currentMembers },
      }).select("receiver");

      const alreadyNotified = new Set(
        existingNotifications.map((notification) =>
          notification.receiver.toString()
        )
      );

      const receivers = trip.currentMembers.filter(
        (memberId) => !alreadyNotified.has(memberId.toString())
      );

      if (!receivers.length) {
        console.log(`Reminder already sent for trip ${tripId}`);
        return;
      }

      await Notification.insertMany(
        receivers.map((receiver) => ({
          receiver,
          tripId: trip._id,
          type: "trip-start-reminder",
          message: `Your trip "${trip.title}" starts tomorrow. Get ready!`,
        }))
      );

      for (const receiver of receivers) {
  await publishNotificationEvent(receiver);
}

      console.log(
        `Reminder created for ${receivers.length} members`
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
    console.error(
      `Job ${job?.id} failed:`,
      error.message
    );
  });
}

startWorker();
