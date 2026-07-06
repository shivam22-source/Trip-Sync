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

function redirectGoogleFailure(res) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return res.redirect(`${frontendUrl}/login?error=google-auth-failed`);
}

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
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (error, user) => {
      if (error || !user) {
        return redirectGoogleFailure(res);
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
