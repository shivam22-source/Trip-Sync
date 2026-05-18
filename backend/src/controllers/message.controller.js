const Message = require("../models/Message");
const Member = require("../models/Member");
const Trip = require("../models/Trip");

async function canAccessTripChat(tripId, userId) {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { allowed: false, reason: "Trip not found" };
  }

  if (trip.admin.toString() === userId) {
    return { allowed: true, trip };
  }

  const member = await Member.findOne({
    tripId,
    userId,
    status: "accepted",
  });

  return member
    ? { allowed: true, trip }
    : { allowed: false, reason: "Access denied" };
}

const getTripMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const access = await canAccessTripChat(tripId, userId);

    if (!access.allowed) {
      const statusCode = access.reason === "Trip not found" ? 404 : 403;
      return res.status(statusCode).json({
        message: access.reason,
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ tripId })
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      page,
      count: messages.length,
      messages: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const access = await canAccessTripChat(tripId, userId);

    if (!access.allowed) {
      const statusCode = access.reason === "Trip not found" ? 404 : 403;
      return res.status(statusCode).json({
        message: access.reason,
      });
    }

    await Message.updateMany(
      {
        tripId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getTripMessages,
  markMessagesAsRead,
};
