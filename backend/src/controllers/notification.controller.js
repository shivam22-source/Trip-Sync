const Notification =
require("../models/Notification");
const Member = require("../models/Member");
const Trip = require("../models/Trip");

async function syncPendingRequestNotifications(userId) {
  const adminTrips = await Trip.find({
    admin: userId,
  }).select("_id title admin");

  const tripIds = adminTrips.map((trip) => trip._id);

  if (!tripIds.length) {
    return;
  }

  const pendingRequests = await Member.find({
    tripId: { $in: tripIds },
    status: "pending",
  })
    .populate("userId", "name")
    .populate("tripId", "title admin");

  await Promise.all(
    pendingRequests.map(async (request) => {
      const existingNotification = await Notification.findOne({
        receiver: userId,
        sender: request.userId._id,
        tripId: request.tripId._id,
        type: "join-request",
      });

      if (existingNotification) {
        return;
      }

      await Notification.create({
        receiver: userId,
        sender: request.userId._id,
        tripId: request.tripId._id,
        type: "join-request",
        message: `${request.userId.name || "A traveler"} requested to join ${request.tripId.title}`,
      });
    })
  );
}

const getNotifications =
async (req, res) => {

  try {

    await syncPendingRequestNotifications(req.user.id);

    const notifications =
      await Notification.find({
        receiver: req.user.id,
      })
      .populate("sender", "name profilePhoto")
      .populate("tripId", "title")
      .sort({ createdAt: -1 })
      .lean();

    const notificationsWithRequestState = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.type !== "join-request") {
          return notification;
        }

        const request = await Member.findOne({
          tripId: notification.tripId?._id,
          userId: notification.sender?._id,
        }).select("_id status");

        return {
          ...notification,
          memberId: request?._id || null,
          requestStatus: request?.status || "missing",
        };
      })
    );

    res.status(200).json(
      notificationsWithRequestState
    );

  } catch (error) {

    res.status(500).json({
      message:
        "Failed to fetch notifications",
    });
  }
};

const markNotificationRead =
async (req, res) => {

  try {

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.notificationId,
          receiver: req.user.id,
        },
        {
          isRead: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json(notification);

  } catch (error) {

    res.status(500).json({
      message: "Failed to mark notification read",
    });
  }
};

const markAllNotificationsRead =
async (req, res) => {

  try {

    await Notification.updateMany(
      {
        receiver: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      message: "Notifications marked as read",
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to mark notifications read",
    });
  }
};

module.exports = {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
