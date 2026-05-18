const express = require("express");

const {
  createTripExpense,
  getTripExpenses,
} = require("../controllers/expense.controller");
const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:tripId", protect, getTripExpenses);
router.post("/:tripId", protect, createTripExpense);

module.exports = router;
