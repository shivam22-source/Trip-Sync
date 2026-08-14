// ===============================
// Required Models & Utilities
// ===============================

//Redis config
const redis =require("../config/redis")

// Trip collection (main trip data)
const Trip = require("../models/Trip");

// Stores join requests and member status
const Member = require("../models/Member");

// Stores chat messages of every trip
const Message = require("../models/Message");

// Stores notifications like join request,
// accepted request, rejected request, etc.
const Notification = require("../models/Notification");

// User collection
const User = require("../models/User");

// Cloudinary configuration used to upload images
const cloudinary = require("../config/cloudinary");

// AI function that calculates compatibility
// between a traveler and a trip
const { getAiCompatibilityScore } = require("./ai.controller");


// =====================================================
// Predefined Budget Ranges
// =====================================================
//
// When frontend sends:
//
// budget = "low"
//
// we convert it into:
//
// { min:100,max:800 }
//
// so later our database always stores an actual range.
//
const budgetRanges = {
  low: {
    min: 100,
    max: 800,
  },

  medium: {
    min: 800,
    max: 3000,
  },

  high: {
    min: 3000,
    max: 10000,
  },
};


// =====================================================
// Emit Socket Notification
// =====================================================
//
// This DOES NOT create a notification.
//
// Notification is already stored in MongoDB.
//
// Socket.IO only tells the frontend:
//
// "Hey...new notification arrived,
// refresh your notification list."
//
function emitNotification(req, receiverId) {
  // Get socket.io instance stored inside Express app
  const io = req.app.get("io");

  // If socket server exists
  if (io) {
    // Every user joins a room using their userId.
    // Send event only to that user's room.
    io.to(receiverId.toString()).emit("notification:new");
  }
}


// =====================================================
// Parse JSON Fields
// =====================================================
//
// Why this function?
//
// FormData cannot send objects directly.
//
// Example:
//
// filters = {
//    smokingAllowed:true
// }
//
// becomes
//
// '{"smokingAllowed":true}'
//
// (a string)
//
// This helper converts that string back into an object.
//
// If frontend already sends JSON,
// nothing changes.
//
function parseJsonField(value, fallback) {

  // Nothing received
  if (!value) {
    return fallback;
  }

  // Already an object
  if (typeof value !== "string") {
    return value;
  }

  try {
    // Convert JSON string into object
    return JSON.parse(value);
  } catch {

    // Invalid JSON
    return fallback;
  }
}


// =====================================================
// Upload Image To Cloudinary
// =====================================================
//
// Multer stores uploaded image inside RAM.
//
// Cloudinary cannot directly use that buffer.
//
// So we stream that buffer to Cloudinary
// and return uploaded image information.
//
function uploadBufferToCloudinary(file, folder) {

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

    // Send image buffer to Cloudinary
    stream.end(file.buffer);
  });
}



// =====================================================
// Create Trip
// =====================================================
//
// Flow:
//
// 1. Read data from frontend
// 2. Validate required fields
// 3. Upload cover image
// 4. Decide budget range
// 5. Prepare filters
// 6. Save trip
// 7. Return created trip
//
const createTrip = async (req, res) => {

  try {

    // ----------------------------------
    // Get all data from frontend
    // ----------------------------------

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


    // Convert JSON strings into objects
    const parsedBudgetPerDay = parseJsonField(
      budgetPerDay,
      null
    );

    const parsedFilters = parseJsonField(
      filters,
      {}
    );


    // FormData sends numbers as strings.
    // Convert it into Number.
    const memberLimit = Number(maxMembers);

    // Default image (empty)
    let coverImage = "";


    // ----------------------------------
    // Validate Required Fields
    // ----------------------------------

    if (
      !title ||
      !title.trim() ||

      !destination ||
      !destination.trim() ||

      !startDate ||
      !endDate ||

      !memberLimit ||

      memberLimit < 2
    ) {
      return res.status(400).json({
        message:
          "Please fill trip title, destination, dates, and at least 2 seats.",
      });
    }


    // ----------------------------------
    // Upload Cover Image
    // ----------------------------------

    if (req.file) {

      // Folder name inside Cloudinary
      const uploadFolder = "tripsync/trip-covers";

      // Upload image
      const uploadResult =
        await uploadBufferToCloudinary(
          req.file,
          uploadFolder
        );

      // Save image URL only
      coverImage = uploadResult.secure_url;
    }


    // ----------------------------------
    // Decide Budget Range
    // ----------------------------------

    // Default budget
    let finalBudgetPerDay =
      budgetRanges.medium;

    // If user selected low/medium/high
    if (budgetRanges[budget]) {
      finalBudgetPerDay =
        budgetRanges[budget];
    }

    // Custom budget has higher priority
    if (
      parsedBudgetPerDay &&
      parsedBudgetPerDay.min &&
      parsedBudgetPerDay.max
    ) {
      finalBudgetPerDay =
        parsedBudgetPerDay;
    }


    // ----------------------------------
    // Default Trip Filters
    // ----------------------------------

    let smokingAllowed = false;
    let drinkingAllowed = false;
    let genderPreference = "any";


    // Enable smoking
    if (
      parsedFilters &&
      parsedFilters.smokingAllowed
    ) {
      smokingAllowed = true;
    }

    // Enable drinking
    if (
      parsedFilters &&
      parsedFilters.drinkingAllowed
    ) {
      drinkingAllowed = true;
    }

    // Gender preference
    if (
      parsedFilters &&
      parsedFilters.genderPreference
    ) {
      genderPreference =
        parsedFilters.genderPreference;
    }


    // ----------------------------------
    // Save Trip
    // ----------------------------------

    const trip = await Trip.create({

      // Trip creator becomes admin
      admin: req.user.id,

      title,
      destination,
      description,
      startDate,
      endDate,
      category,
      budget,

      // Final calculated budget
      budgetPerDay: finalBudgetPerDay,

      // Maximum members allowed
      maxMembers: memberLimit,

      // Save all filters
      filters: {
        smokingAllowed,
        drinkingAllowed,
        genderPreference,
      },

      // Cover image URL
      coverImage,

      // Admin automatically becomes first member
      currentMembers: [req.user.id],
    });


    // ----------------------------------
    // Success Response
    // ----------------------------------

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



// =====================================================
// Get All Trips
// =====================================================
//
// Supports:
//
// • Category Filter
// • Budget Filter
// • Smoking Filter
// • Drinking Filter
// • Gender Filter
// • Search by title/destination
//
const getTrips = async (req, res) => {

  try {

    // Read filters from query string
    const {
      category,
      budget,
      smokingAllowed,
      drinkingAllowed,
      genderPreference,
      q,
    } = req.query;


    // MongoDB query object
    const query = {};


    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Budget filter
    if (budget && budget !== "all") {
      query.budget = budget;
    }

    // Smoking filter
    if (smokingAllowed === "true") {
      query["filters.smokingAllowed"] = true;
    }

    // Drinking filter
    if (drinkingAllowed === "true") {
      query["filters.drinkingAllowed"] = true;
    }

    // Gender preference
    if (
      genderPreference &&
      genderPreference !== "any"
    ) {
      query["filters.genderPreference"] =
        genderPreference;
    }

    // Search by title OR destination
    if (q) {
      query.$or = [
        {
          title: {
            $regex: q,
            $options: "i", // case insensitive
          },
        },
        {
          destination: {
            $regex: q,
            $options: "i",
          },
        },
      ];
    }


    // Fetch matching trips
    const trips = await Trip.find(query)

      // Replace admin id with admin details
      .populate("admin", "name email")

      // Hide members list
      .select("-currentMembers");


    // Return all trips
    res.status(200).json(trips);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =====================================================
// Get Single Trip Details
// =====================================================
//
// Flow:
//
// 1. Find trip using tripId
// 2. Load admin and member details
// 3. Check whether trip exists
// 4. Decide if current user can see private members
// 5. Hide sensitive data if needed
// 6. Tell frontend who the viewer is
// 7. Return trip
//


const getSingleTrip = async (req, res) => {
  try {

    // Find trip by id
    // populate() replaces ObjectId with actual document.

    const tripId = req.params.id;

    const cacheKey = `trip:${tripId}`;

    const cachedTrip = await redis.get(cacheKey);


    let trip;

    if (cachedTrip) {
      console.log("CACHE HIT");
      trip = JSON.parse(cachedTrip);
    } else {
      console.log("CACHE MISS");

      trip = await Trip.findById(tripId)
        .populate("admin", "name email");

      if (!trip) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }

      await redis.set(
        cacheKey,
        JSON.stringify(trip),
        "EX",
        300
      );
    }
    // Trip doesn't exist
    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // By default nobody can see
    // private member information.
    let isAllowedToSeeMembers = false;

    // If current user is trip admin,
    // allow access immediately.
    if (req.user && trip.admin._id.toString() === req.user.id) {
      isAllowedToSeeMembers = true;
    }

    if (isAllowedToSeeMembers) {
      await Trip.populate(trip, {
        path: "currentMembers",
        select:
          "name email bio age gender city occupation languages preferences travelProfile compatibility profilePhoto",
      });
    }

    let member = null;

    // If user is logged in,
    // check whether they are an accepted member.
    if (req.user) {
      member = await Member.findOne({
        tripId: trip._id,
        userId: req.user.id,
        status: "accepted",
      });
    }

    // Accepted members can also
    // see private trip information.
    if (member) {
      isAllowedToSeeMembers = true;
    }

    const responseTrip = trip.toObject();

    // Guest users should not see
    // member list or AI itinerary.
    if (!isAllowedToSeeMembers) {
      responseTrip.currentMembers = [];
      responseTrip.aiItinerary = null;
    }

    // Default viewer information.
    responseTrip.viewerRole = "guest";
    responseTrip.viewerRequestStatus = "none";

    // Logged in user
    if (req.user && req.user.id) {

      // Admin
      if (trip.admin._id.toString() === req.user.id) {

        responseTrip.viewerRole = "admin";
        responseTrip.viewerRequestStatus = "accepted";

      } else {

        // Check whether current user
        // has already requested to join.
        const viewerMember = await Member.findOne({
          tripId: trip._id,
          userId: req.user.id,
        });

        if (viewerMember) {

          // Frontend can now know
          // whether request is
          // pending / accepted / rejected.
          responseTrip.viewerRole = "member";
          responseTrip.viewerRequestStatus =
            viewerMember.status;
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



// =====================================================
// Send Join Request
// =====================================================
//
// Flow:
//
// 1. Find trip
// 2. Validate request
// 3. Create pending member request
// 4. Notify admin
// 5. Return success
//
const joinTrip = async (req, res) => {
  try {

    const tripId = req.params.id;
    const userId = req.user.id;

    // Find trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Admin is already part of trip.
    // They cannot send join request.
    if (trip.admin.toString() === userId) {
      return res.status(400).json({
        message: "Admin already belongs to trip",
      });
    }

    // Prevent duplicate requests.
    const existingMember = await Member.findOne({
      tripId,
      userId,
    });

    if (existingMember) {
      return res.status(400).json({
        message: "Already requested or joined",
      });
    }

    // Trip reached maximum capacity.
    if (trip.currentMembers.length >= trip.maxMembers) {
      return res.status(400).json({
        message: "Trip is full",
      });
    }

    // Save join request.
    const memberRequest = await Member.create({
      tripId,
      userId,
      status: "pending",
    });

    // Get sender name for notification.
    const sender = await User.findById(req.user.id)
      .select("name");

    // Default name
    let senderName = "A traveler";

    if (sender && sender.name) {
      senderName = sender.name;
    }

    // Store notification in MongoDB.
    await Notification.create({
      receiver: trip.admin,
      sender: req.user.id,
      tripId: trip._id,
      type: "join-request",
      message: `${senderName} requested to join ${trip.title}`,
    });

    // Tell admin in real-time
    // that a new notification exists.
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



// =====================================================
// Get Pending Join Requests
// =====================================================
//
// Only trip admin can access this API.
//
// For every pending request,
// AI generates a compatibility score.
//
const getPendingRequests = async (req, res) => {
  try {

    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Security check
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Fetch every pending request.
    const requests = await Member.find({
      tripId,
      status: "pending",
    }).populate(
      "userId",
      "name email bio age gender city occupation languages preferences travelProfile compatibility profilePhoto"
    );

    // Final response array.
    const requestsWithScores = [];

    // Calculate AI score one by one.
    for (const request of requests) {

      const requestData = request.toObject();

      try {

        // Gemini compares
        // user profile with trip.
        requestData.userId.aiCompatibility =
          await getAiCompatibilityScore(
            trip,
            requestData.userId
          );

      } catch {

        // If AI fails,
        // page should still work.
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



// =====================================================
// Accept Member Request
// =====================================================
//
// Flow:
//
// 1. Verify admin
// 2. Find member request
// 3. Mark request accepted
// 4. Add member into trip
// 5. Mark trip full if needed
// 6. Notify user
//
const acceptMember = async (req, res) => {
  try {

    const { tripId, memberId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Only trip creator
    // can accept requests.
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

    // Accept request.
    member.status = "accepted";
    await member.save();

    // Prevent duplicate member.
    const alreadyExists = trip.currentMembers.some(
      (id) => id.toString() === member.userId.toString()
    );

    if (!alreadyExists) {
      trip.currentMembers.push(member.userId);
    }

    // Auto close trip
    // when capacity is reached.
    if (trip.currentMembers.length >= trip.maxMembers) {
      trip.status = "full";
    }

    await trip.save();

    await redis.del(`trip:${tripId}`);

    // Notify accepted user.
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



// =====================================================
// Reject Member Request
// =====================================================
//
// Flow:
//
// 1. Verify admin
// 2. Find request
// 3. Mark rejected
// 4. Notify user
//
const rejectMember = async (req, res) => {
  try {

    const { tripId, memberId } = req.params;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Only admin can reject.
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

    // Reject request.
    member.status = "rejected";
    await member.save();

    // Notify user.
    await Notification.create({
      receiver: member.userId,
      sender: req.user.id,
      tripId: trip._id,
      type: "request-rejected",
      message: `Your request was rejected for ${trip.title}`,
    });

    // Send realtime notification.
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


//Just need to delete trip admin is main
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await Member.deleteMany({ tripId: trip._id });
    await Message.deleteMany({ tripId: trip._id });

    await trip.deleteOne();
    await redis.del(`trip:${req.params.id}`);

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
  deleteTrip,
};
