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
      .populate("admin", "name email")
      .select("-currentMembers");

    res.status(200).json(trips);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSingleTrip = async (req, res) => {
  try {

    const trip = await Trip.findById(req.params.id)
      .populate("admin", "name email")
      .populate(
        "currentMembers",
        "name email"
      );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }
      let isAllowedToSeeMembers = false;

       // ADMIN CHECK
    if (
      req.user &&
      trip.admin._id.toString() === req.user.id
    ) {
      isAllowedToSeeMembers = true;
    }

      // MEMBER CHECK
    const member = await Member.findOne({
      tripId: trip._id,
      userId: req.user?.id,
      status: "accepted",
    });

     if (member) {
      isAllowedToSeeMembers = true;
    }

     // HIDE MEMBERS IF NOT ALLOWED
    let responseTrip = trip.toObject();  //trip ki id

    if (!isAllowedToSeeMembers) {
      responseTrip.currentMembers = [];
    }


    res.status(200).json(responseTrip);

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

    const trip = await Trip.findById(tripId);

//Improve joinTrip Validation like if not trip present then not found trip
if (!trip) {
  return res.status(404).json({
    message: "Trip not found",
  });
}

///Prevent Admin Joining Own Trip
if (trip.admin.toString() === userId) {
  return res.status(400).json({
    message: "Admin already belongs to trip",
  });
}

    const existingMember = await Member.findOne({
      tripId,
      userId,
    });

    if (existingMember) {
      return res.status(400).json({
        message: "Already requested or joined",
      });
    }
//Capicity check
    if (
  trip.currentMembers.length >= trip.maxMembers
) {
  return res.status(400).json({
    message: "Trip is full",
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


const getPendingRequests = async (req, res) => {
  try {

    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // ONLY ADMIN CAN VIEW REQUESTS
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const requests = await Member.find({
      tripId,
      status: "pending",
    }).populate("userId", "name email");

    res.status(200).json({
      requests,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const acceptMember = async (req, res) => {
  try {

    const { tripId, memberId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // AUTHORIZATION CHECK
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only admin can accept members",
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        message: "Member request not found",
      });
    }

    member.status = "accepted";

    await member.save();

    trip.currentMembers.push(member.userId);

    await trip.save();

    res.status(200).json({
      message: "Member accepted",
      member,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const rejectMember = async (req, res) => {
  try {

    const { tripId, memberId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // AUTHORIZATION CHECK
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only admin can reject members",
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        message: "Member request not found",
      });
    }

    member.status = "rejected";

    await member.save();

    res.status(200).json({
      message: "Member rejected",
      member,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



const deleteTrip = async (req, res) => {
  try {

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // ONLY ADMIN CAN DELETE
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await trip.deleteOne();

    res.status(200).json({
      message: "Trip deleted successfully",
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
  getPendingRequests,
  getSingleTrip,
  getSingleTrip,
  deleteTrip
};