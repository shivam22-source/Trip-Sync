require("dotenv").config();

const { Worker } = require("bullmq");

const { sendMail } = require("../services/mail.service");
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

      const trip = await Trip.findById(tripId).populate(
        "currentMembers",
        "name email"
      );

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      if (!trip.currentMembers.length) {
        console.log(`No members in trip ${tripId}`);
        return;
      }

      const memberIds = trip.currentMembers.map(
        (member) => member._id
      );

      const existingNotifications = await Notification.find({
        tripId: trip._id,
        type: "trip-start-reminder",
        receiver: { $in: memberIds },
      }).select("receiver emailSent");

      const notificationMap = new Map(
        existingNotifications.map((notification) => [
          notification.receiver.toString(),
          notification,
        ])
      );

      for (const member of trip.currentMembers) {
        const memberId = member._id.toString();

        const existingNotification =
          notificationMap.get(memberId);

        // Notification does not exist yet
        if (!existingNotification) {
          const notification = await Notification.create({
            receiver: member._id,
            tripId: trip._id,
            type: "trip-start-reminder",
            message: `Your trip "${trip.title}" starts tomorrow. Get ready!`,
            emailSent: false,
          });

          await publishNotificationEvent(member._id);

          await sendMail({
            to: member.email,
            subject: `Trip reminder: ${trip.title}`,
            text: `Your trip "${trip.title}" starts tomorrow. Get ready!`,
          });

          await Notification.findByIdAndUpdate(
            notification._id,
            { emailSent: true }
          );

          console.log(
            `Reminder and email sent to ${member.email}`
          );
        }

        // Notification exists but email was not sent
        else if (!existingNotification.emailSent) {
          await sendMail({
            to: member.email,
            subject: `Trip reminder: ${trip.title}`,
            text: `Your trip "${trip.title}" starts tomorrow. Get ready!`,
          });

          await Notification.findByIdAndUpdate(
            existingNotification._id,
            { emailSent: true }
          );

          console.log(
            `Email retry successful for ${member.email}`
          );
        }

        // Notification and email already sent
        else {
          console.log(
            `Reminder already completed for ${member.email}`
          );
        }
      }

      console.log(
        `Reminder processing completed for trip ${tripId}`
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