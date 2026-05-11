const Trip = require("../models/Trip");
const Member = require("../models/Member");
const createTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      description,
      startDate,
      endDate,
      category,
      budget,
      maxMembers,
    } = req.body;

    const trip = await Trip.create({
      admin: req.user.id,

      title,
      destination,
      description,
      startDate,
      endDate,
      category,
      budget,
      maxMembers,

      currentMembers: [req.user.id],
    });

    res.status(201).json({
      message: "Trip created successfully",
      trip,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("admin", "name email");

    res.status(200).json(trips);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const joinTrip = async (req, res) => {
  try {

    const tripId = req.params.id;

    const userId = req.user.id;

    const existingMember = await Member.findOne({
      tripId,
      userId,
    });

    if (existingMember) {
      return res.status(400).json({
        message: "Already requested or joined",
      });
    }

    const memberRequest = await Member.create({
      tripId,
      userId,
      status: "pending",
    });

    res.status(201).json({
      message: "Join request sent",
      memberRequest,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createTrip,
  getTrips,
  joinTrip,
   acceptMember,
  rejectMember,
};