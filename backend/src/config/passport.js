const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

function getGoogleName(profile, email) {
  if (profile.displayName) {
    return profile.displayName;
  }

  if (profile.name && profile.name.givenName) {
    return profile.name.givenName;
  }

  return email.split("@")[0] || "Google User";
}

function getGooglePhoto(profile) {
  if (profile.photos && profile.photos[0]) {
    return profile.photos[0].value;
  }

  return "";
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;

        if (!email) {
          return done(null, false);
        }

        const googleName = getGoogleName(profile, email);
        const googlePhoto = getGooglePhoto(profile);
        let user = await User.findOne({ email });

        if (user) {
          if (!user.name) {
            user.name = googleName;
          }

          if (!user.googleId) {
            user.googleId = profile.id;
          }

          if (!user.profilePhoto && googlePhoto) {
            user.profilePhoto = googlePhoto;
          }

          await user.save();

          return done(null, user);
        }

        user = await User.create({
          name: googleName,
          email,
          googleId: profile.id,
          profilePhoto: googlePhoto,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
