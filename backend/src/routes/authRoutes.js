const express = require("express");
const validate = require("../middleware/validate.middleware");
const {
  loginSchema,
  registerSchema,
} = require("../validations/request.schemas");

const {
  registerUser,
  loginUser,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), loginUser);

module.exports = router;
