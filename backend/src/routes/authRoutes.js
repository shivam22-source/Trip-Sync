const express = require("express");
const passport = require("../config/passport");
const validate = require("../middleware/validate.middleware");
const {
  loginSchema,
  registerSchema,
} = require("../validations/request.schemas");

const {
  registerUser,
  loginUser,
  googleCallback,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), loginUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    session: false,
  }),
  googleCallback
);

module.exports = router;
