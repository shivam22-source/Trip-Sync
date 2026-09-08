const Joi = require("joi");

const receiptSchema = Joi.object({
  description: Joi.string().trim().min(1).required(),
  amount: Joi.number().positive().required(),
  category: Joi.string()
    .valid("Flights", "Food", "Hotel", "Misc")
    .required(),
  date: Joi.string().allow("").required(),
  confidence: Joi.string()
    .valid("low", "medium", "high")
    .required(),
}).required();

const compatibilitySchema = Joi.object({
  score: Joi.number().min(0).max(100).required(),
  label: Joi.string()
    .valid("low", "medium", "high")
    .required(),
  reason: Joi.string().trim().min(1).required(),
}).required();

const itineraryDaySchema = Joi.object({
  day: Joi.number().integer().min(1).required(),
  title: Joi.string().trim().min(1).required(),
  activities: Joi.array().items(Joi.string()).required(),
  foodSuggestions: Joi.array().items(Joi.string()).required(),
  estimatedDailyBudget: Joi.string().trim().required(),
});

const itinerarySchema = Joi.object({
  tripName: Joi.string().trim().min(1).required(),
  estimatedBudget: Joi.string().trim().required(),
  bestTimeToVisit: Joi.string().trim().required(),
  tips: Joi.array().items(Joi.string()).required(),
  days: Joi.array().items(itineraryDaySchema).min(1).required(),
}).required();

function validateAiOutput(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const validationError = new Error("AI returned an invalid response");
    validationError.status = 502;
    validationError.code = "AI_OUTPUT_INVALID";

    throw validationError;
  }

  return value;
}

function validateReceiptData(data) {
  return validateAiOutput(receiptSchema, data);
}

function validateCompatibilityData(data) {
  return validateAiOutput(compatibilitySchema, data);
}

function validateItineraryData(data) {
  return validateAiOutput(itinerarySchema, data);
}

module.exports = {
  validateReceiptData,
  validateCompatibilityData,
  validateItineraryData,
};