const express = require("express");

const protect = require("../middleware/auth.middleware");

const {
  getTripMessages,
  markMessagesAsRead
} = require("../controllers/message.controller");

const router = express.Router();

router.get(
  "/:tripId",
  protect,
  getTripMessages
);
router.patch(
  "/read/:tripId",
  protect,
  markMessagesAsRead
);

module.exports = router;