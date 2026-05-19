const express = require("express");

const protect = require("../middleware/auth.middleware");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload.middleware");
const User = require("../models/User");

const router = express.Router();

function parseJsonField(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uploadBufferToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/profile", protect, upload.single("profilePhoto"), async (req, res) => {
  try {
    const {
      name,
      bio,
      age,
      gender,
      city,
      occupation,
      languages,
      preferences = {},
      travelProfile = {},
      compatibility = {},
    } = req.body;
    const parsedPreferences = parseJsonField(preferences, {});
    const parsedTravelProfile = parseJsonField(travelProfile, {});
    const parsedCompatibility = parseJsonField(compatibility, {});
    let profilePhoto = "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file,
        "travel-buddy/profile-photos"
      );
      profilePhoto = uploadResult.secure_url;
    }

    const updateData = {
      ...(name ? { name } : {}),
      ...(typeof bio === "string" ? { bio } : {}),
      ...(age ? { age: Number(age) } : {}),
      ...(typeof gender === "string" ? { gender } : {}),
      ...(typeof city === "string" ? { city } : {}),
      ...(typeof occupation === "string" ? { occupation } : {}),
      ...(typeof languages === "string" ? { languages } : {}),
      ...(profilePhoto ? { profilePhoto } : {}),
      ...(parsedPreferences.vibe ? { "preferences.vibe": parsedPreferences.vibe } : {}),
      ...(parsedPreferences.budget ? { "preferences.budget": parsedPreferences.budget } : {}),
      ...(typeof parsedPreferences.smoking === "boolean"
        ? { "preferences.smoking": parsedPreferences.smoking }
        : {}),
      ...(typeof parsedPreferences.drinking === "boolean"
        ? { "preferences.drinking": parsedPreferences.drinking }
        : {}),
      ...(typeof parsedTravelProfile.travelStyle === "string"
        ? { "travelProfile.travelStyle": parsedTravelProfile.travelStyle }
        : {}),
      ...(typeof parsedTravelProfile.groupRole === "string"
        ? { "travelProfile.groupRole": parsedTravelProfile.groupRole }
        : {}),
      ...(typeof parsedTravelProfile.pastTravel === "string"
        ? { "travelProfile.pastTravel": parsedTravelProfile.pastTravel }
        : {}),
      ...(typeof parsedTravelProfile.currentLife === "string"
        ? { "travelProfile.currentLife": parsedTravelProfile.currentLife }
        : {}),
      ...(typeof parsedTravelProfile.whyTravel === "string"
        ? { "travelProfile.whyTravel": parsedTravelProfile.whyTravel }
        : {}),
      ...(typeof parsedTravelProfile.favoriteThings === "string"
        ? { "travelProfile.favoriteThings": parsedTravelProfile.favoriteThings }
        : {}),
      ...(typeof parsedTravelProfile.boundaries === "string"
        ? { "travelProfile.boundaries": parsedTravelProfile.boundaries }
        : {}),
      ...(typeof parsedCompatibility.spendingBehavior === "string"
        ? { "compatibility.spendingBehavior": parsedCompatibility.spendingBehavior }
        : {}),
      ...(typeof parsedCompatibility.expenseSplit === "string"
        ? { "compatibility.expenseSplit": parsedCompatibility.expenseSplit }
        : {}),
      ...(typeof parsedCompatibility.sleepSchedule === "string"
        ? { "compatibility.sleepSchedule": parsedCompatibility.sleepSchedule }
        : {}),
      ...(typeof parsedCompatibility.morningStyle === "string"
        ? { "compatibility.morningStyle": parsedCompatibility.morningStyle }
        : {}),
      ...(typeof parsedCompatibility.cleanliness === "string"
        ? { "compatibility.cleanliness": parsedCompatibility.cleanliness }
        : {}),
      ...(typeof parsedCompatibility.socialEnergy === "string"
        ? { "compatibility.socialEnergy": parsedCompatibility.socialEnergy }
        : {}),
      ...(typeof parsedCompatibility.foodPreference === "string"
        ? { "compatibility.foodPreference": parsedCompatibility.foodPreference }
        : {}),
      ...(typeof parsedCompatibility.activityPreference === "string"
        ? { "compatibility.activityPreference": parsedCompatibility.activityPreference }
        : {}),
      ...(typeof parsedCompatibility.travelPace === "string"
        ? { "compatibility.travelPace": parsedCompatibility.travelPace }
        : {}),
      ...(typeof parsedCompatibility.communicationStyle === "string"
        ? { "compatibility.communicationStyle": parsedCompatibility.communicationStyle }
        : {}),
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
