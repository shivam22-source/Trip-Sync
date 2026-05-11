const express = require("express");

const protect = require("../middleware/auth.middleware");

const {
  createTrip,
  getTrips,
   joinTrip,
     acceptMember,
  rejectMember,
} = require("../controllers/trip.controller");

const router = express.Router();

router.post("/", protect, createTrip);

router.get("/", getTrips);

router.post("/:id/join", protect, joinTrip);

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

module.exports = router;