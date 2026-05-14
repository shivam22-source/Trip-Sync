const Message = require("../models/Message");

const getTripMessages = async (req, res) => {
  try {

    const messages = await Message.find({
      tripId: req.params.tripId,
    })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

module.exports = {
  getTripMessages,
};