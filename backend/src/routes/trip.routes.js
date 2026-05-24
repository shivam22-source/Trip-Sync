const express = require("express");

const protect = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const { createTripSchema } = require("../validations/request.schemas");

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

router.post("/", protect, upload.single("coverImage"), validate(createTripSchema), createTrip);

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

router.get("/:id", protect, getSingleTrip);


router.delete("/:id", protect, deleteTrip);

module.exports = router;
