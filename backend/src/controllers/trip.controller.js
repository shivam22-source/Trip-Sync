const Trip = require("../models/Trip");
const Member = require("../models/Member");
const Message =require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { getAiCompatibilityScore } = require("./ai.controller");

const budgetRanges = {
  low: { min: 100, max: 800 },
  medium: { min: 800, max: 3000 },
  high: { min: 3000, max: 10000 },
};

function emitNotification(req, receiverId) {
  req.app.get("io")?.to(receiverId.toString()).emit("notification:new");
}

// Multipart form fields arrive as strings. JSON fields like filters and
// budgetPerDay are parsed here while plain JSON requests keep working too.
function parseJsonField(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uploadBufferToCloudinary(file, folder) {
  // Multer stores the file in memory; this streams that buffer to Cloudinary.
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

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
      budgetPerDay,
      maxMembers,
      filters,
    } = req.body;
    const parsedBudgetPerDay = parseJsonField(budgetPerDay, null);
    const parsedFilters = parseJsonField(filters, {});
    const memberLimit = Number(maxMembers);
    let coverImage = "";

    if (
      !title?.trim() ||
      !destination?.trim() ||
      !startDate ||
      !endDate ||
      !memberLimit ||
      memberLimit < 2
    ) {
      return res.status(400).json({
        message: "Please fill trip title, destination, dates, and at least 2 seats.",
      });
    }

    if (req.file) {
      // Trip cover image is stored in Cloudinary; MongoDB stores only the URL.
      const uploadResult = await uploadBufferToCloudinary(
        req.file,
        "tripsync/trip-covers"
      );
      coverImage = uploadResult.secure_url;
    }

    const trip = await Trip.create({
      admin: req.user.id,

      title,
      destination,
      description,
      startDate,
      endDate,
      category,
      budget,
      budgetPerDay:
        parsedBudgetPerDay?.min && parsedBudgetPerDay?.max
          ? parsedBudgetPerDay
          : budgetRanges[budget] || budgetRanges.medium,
      maxMembers: memberLimit,
      filters: {
        smokingAllowed: Boolean(parsedFilters?.smokingAllowed),
        drinkingAllowed: Boolean(parsedFilters?.drinkingAllowed),
        genderPreference: parsedFilters?.genderPreference || "any",
      },
      coverImage,

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

    const {
      category,
      budget,
      smokingAllowed,
      drinkingAllowed,
      genderPreference,
      q,
    } = req.query;

    const query = {
      ...(category && category !== "all" ? { category } : {}),
      ...(budget && budget !== "all" ? { budget } : {}),
      ...(smokingAllowed === "true"
        ? { "filters.smokingAllowed": true }
        : {}),
      ...(drinkingAllowed === "true"
        ? { "filters.drinkingAllowed": true }
        : {}),
      ...(genderPreference && genderPreference !== "any"
        ? { "filters.genderPreference": genderPreference }
        : {}),
      ...(q
        ? {
            $or: [
              { title: { $regex: q, $options: "i" } },
              { destination: { $regex: q, $options: "i" } },
            ],
          }
        : {}),
    };

    const trips = await Trip.find(query)
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
        "name email bio age gender city occupation languages preferences travelProfile compatibility profilePhoto"
      );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }
      let isAllowedToSeeMembers = false;

       // Only admins and accepted members can see the full member list.
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

     // Guests/pending users can see the trip, but not private member details.
    let responseTrip = trip.toObject();  //trip ki id

    if (!isAllowedToSeeMembers) {
      responseTrip.currentMembers = [];
      responseTrip.aiItinerary = null;
    }

    responseTrip.viewerRole = "guest";
    responseTrip.viewerRequestStatus = "none";

    if (req.user?.id) {
      if (trip.admin._id.toString() === req.user.id) {
        responseTrip.viewerRole = "admin";
        responseTrip.viewerRequestStatus = "accepted";
      } else {
        const viewerMember = await Member.findOne({
          tripId: trip._id,
          userId: req.user.id,
        });

        if (viewerMember) {
          responseTrip.viewerRole = "member";
          responseTrip.viewerRequestStatus = viewerMember.status;
        }
      }
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

    const sender = await User.findById(req.user.id).select("name");

    await Notification.create({
      receiver: trip.admin,
      sender: req.user.id,
      tripId: trip._id,
      type: "join-request",
      message: `${sender?.name || "A traveler"} requested to join ${trip.title}`,
    });
    // Socket only tells the admin to refresh notifications; REST stays source of truth.
    emitNotification(req, trip.admin);


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
    }).populate(
      "userId",
      "name email bio age gender city occupation languages preferences travelProfile compatibility profilePhoto"
    );

    const requestsWithScores = [];

    for (const request of requests) {
      const requestData = request.toObject();

      try {
        requestData.userId.aiCompatibility = await getAiCompatibilityScore(
          trip,
          requestData.userId
        );
      } catch {
        requestData.userId.aiCompatibility = null;
      }

      requestsWithScores.push(requestData);
    }

    res.status(200).json({
      requests: requestsWithScores,
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

  const alreadyExists =
  trip.currentMembers.some(
    (id) =>
      id.toString() ===
      member.userId.toString()
  );

if (!alreadyExists) {
  trip.currentMembers.push(
    member.userId
  );
}

    if (
  trip.currentMembers.length >=
  trip.maxMembers
) {
  trip.status = "full";
}

    await trip.save();

    await Notification.create({
      receiver: member.userId,
      sender: req.user.id,
      tripId: trip._id,
      type: "request-accepted",
      message: `Your request was accepted for ${trip.title}`,
    });
    emitNotification(req, member.userId);

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

    await Notification.create({
      receiver: member.userId,
      sender: req.user.id,
      tripId: trip._id,
      type: "request-rejected",
      message: `Your request was rejected for ${trip.title}`,
    });
    emitNotification(req, member.userId);

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

    await Member.deleteMany({
  tripId: trip._id,
});

await Message.deleteMany({
  tripId: trip._id,
});

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
