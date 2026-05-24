const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(6).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(6).max(72).required(),
});

const createTripSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  destination: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().allow("").max(1000),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref("startDate")).required(),
  category: Joi.string()
    .valid("adventure", "party", "trek", "luxury", "peaceful")
    .default("peaceful"),
  budget: Joi.string().valid("low", "medium", "high").default("medium"),
  budgetPerDay: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
  maxMembers: Joi.number().integer().min(2).max(50).required(),
  filters: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
});

const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().trim().min(2).max(200).required(),
  category: Joi.string().valid("Flights", "Food", "Hotel", "Misc").default("Misc"),
  splitEqually: Joi.boolean().default(true),
  receiptName: Joi.string().trim().allow("").max(200),
  receiptImage: Joi.string().trim().allow(""),
});

const settlePaymentSchema = Joi.object({
  from: Joi.string().hex().length(24).required(),
  to: Joi.string().hex().length(24).required(),
  amount: Joi.number().positive().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTripSchema,
  createExpenseSchema,
  settlePaymentSchema,
};
