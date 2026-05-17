const Message = require("../models/Message");

//markMessagesAsRead///

const markMessagesAsRead =
async (req, res) => {

  try {

    const tripId = req.params.tripId;

    const userId = req.user.id;

    // CHECK ACCESS
    const trip =
    await Trip.findById(tripId);

    if (!trip) {

      return res.status(404).json({
        message: "Trip not found",
      });

    }

    let allowed = false;

    // ADMIN
    if (
      trip.admin.toString() === userId
    ) {
      allowed = true;
    }

    // ACCEPTED MEMBER
    const member =
    await Member.findOne({
      tripId,
      userId,
      status: "accepted",
    });

    if (member) {
      allowed = true;
    }

    if (!allowed) {

      return res.status(403).json({
        message: "Access denied",
      });

    }

    // UPDATE MESSAGES
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
      message:
      "Messages marked as read",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

///getTripMessages///

const getTripMessages = async (req, res) => {
  try {

   const getTripMessages = async (
  req,
  res
) => {

  try {

    const { tripId } = req.params;

    const userId = req.user.id;

    // CHECK TRIP
    const trip =
    await Trip.findById(tripId);

    if (!trip) {

      return res.status(404).json({
        message: "Trip not found",
      });

    }

    let allowed = false;

    // ADMIN CHECK
    if (
      trip.admin.toString() === userId
    ) {
      allowed = true;
    }

    // MEMBER CHECK
    const member =
    await Member.findOne({
      tripId,
      userId,
      status: "accepted",
    });

    if (member) {
      allowed = true;
    }

    if (!allowed) {

      return res.status(403).json({
        message: "Access denied",
      });

    }

    // PAGINATION
    const page =
      Number(req.query.page) || 1;

    const limit = 20;

    const skip =
      (page - 1) * limit;

    // GET MESSAGES
    const messages =
    await Message.find({ tripId })

      .populate(
        "sender",
        "name email"
      )

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit);

    res.status(200).json({
      page,
      count: messages.length,
      messages,
    });

  } catch (error) {

   

  }

};

  } catch (error) {
 res.status(500).json({
      message: error.message,
    });
   

  }
};

module.exports = {
  getTripMessages,
  markMessagesAsRead
};