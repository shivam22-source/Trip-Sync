const express = require("express");
const protect = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { generateTripPlan } = require("../controllers/ai.controller");
const { aiTripPlanSchema } = require("../validations/request.schemas");

const router = express.Router();

router.post("/plan-trip", protect, validate(aiTripPlanSchema), generateTripPlan);

module.exports = router;
