const express = require("express");

const upload =require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createExpenseSchema,
  settlePaymentSchema,
} = require("../validations/request.schemas");

const {
  createTripExpense,
  getTripExpenses,
  settleTripPayment,
} = require("../controllers/expense.controller");
//ai feature
const {extractReceiptExpense} = require("../controllers/ai.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:tripId", protect,  getTripExpenses);
router.post(
  "/:tripId",
  protect,
  upload.single("receipt"),
  validate(createExpenseSchema),
  createTripExpense
);
router.post(
  "/:tripId/settle",
  protect,
  validate(settlePaymentSchema),
  settleTripPayment
);

// AI receipt extraction(OCR)
router.post(
  "/:tripId/extract-receipt",
  protect,
  extractReceiptExpense
);

module.exports = router;
