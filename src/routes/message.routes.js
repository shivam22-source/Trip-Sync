const express = require("express");

const protect = require("../middleware/auth.middleware");

const {
  getTripMessages,
} = require("../controllers/message.controller");

const router = express.Router();

router.get(
  "/:tripId",
  protect,
  getTripMessages
);

module.exports = router;