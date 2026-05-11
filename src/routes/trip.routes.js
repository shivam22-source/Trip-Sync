const express = require("express");

const protect = require("../middleware/auth.middleware");

const {
  createTrip,
  getTrips,
   joinTrip,
     acceptMember,
  rejectMember,
  getPendingRequests,
  getSingleTrip,
  deleteTrip,

} = require("../controllers/trip.controller");

const router = express.Router();

router.post("/", protect, createTrip);

router.get("/", getTrips);

router.post("/:id/join", protect, joinTrip);

router.get(
  "/:tripId/requests",
  protect,
  getPendingRequests
);

router.patch(
  "/:tripId/accept/:memberId",
  protect,
  acceptMember
);

router.patch(
  "/:tripId/reject/:memberId",
  protect,
  rejectMember
);

router.get("/:id", getSingleTrip);


router.delete("/:id", protect, deleteTrip);

module.exports = router;