const express = require("express");

const protect = require("../middleware/auth.middleware");
const User = require("../models/User");

const router = express.Router();

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

router.patch("/profile", protect, async (req, res) => {
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

    const updateData = {
      ...(name ? { name } : {}),
      ...(typeof bio === "string" ? { bio } : {}),
      ...(age ? { age: Number(age) } : {}),
      ...(typeof gender === "string" ? { gender } : {}),
      ...(typeof city === "string" ? { city } : {}),
      ...(typeof occupation === "string" ? { occupation } : {}),
      ...(typeof languages === "string" ? { languages } : {}),
      ...(preferences.vibe ? { "preferences.vibe": preferences.vibe } : {}),
      ...(preferences.budget ? { "preferences.budget": preferences.budget } : {}),
      ...(typeof preferences.smoking === "boolean"
        ? { "preferences.smoking": preferences.smoking }
        : {}),
      ...(typeof preferences.drinking === "boolean"
        ? { "preferences.drinking": preferences.drinking }
        : {}),
      ...(typeof travelProfile.travelStyle === "string"
        ? { "travelProfile.travelStyle": travelProfile.travelStyle }
        : {}),
      ...(typeof travelProfile.groupRole === "string"
        ? { "travelProfile.groupRole": travelProfile.groupRole }
        : {}),
      ...(typeof travelProfile.pastTravel === "string"
        ? { "travelProfile.pastTravel": travelProfile.pastTravel }
        : {}),
      ...(typeof travelProfile.currentLife === "string"
        ? { "travelProfile.currentLife": travelProfile.currentLife }
        : {}),
      ...(typeof travelProfile.whyTravel === "string"
        ? { "travelProfile.whyTravel": travelProfile.whyTravel }
        : {}),
      ...(typeof travelProfile.favoriteThings === "string"
        ? { "travelProfile.favoriteThings": travelProfile.favoriteThings }
        : {}),
      ...(typeof travelProfile.boundaries === "string"
        ? { "travelProfile.boundaries": travelProfile.boundaries }
        : {}),
      ...(typeof compatibility.spendingBehavior === "string"
        ? { "compatibility.spendingBehavior": compatibility.spendingBehavior }
        : {}),
      ...(typeof compatibility.expenseSplit === "string"
        ? { "compatibility.expenseSplit": compatibility.expenseSplit }
        : {}),
      ...(typeof compatibility.sleepSchedule === "string"
        ? { "compatibility.sleepSchedule": compatibility.sleepSchedule }
        : {}),
      ...(typeof compatibility.morningStyle === "string"
        ? { "compatibility.morningStyle": compatibility.morningStyle }
        : {}),
      ...(typeof compatibility.cleanliness === "string"
        ? { "compatibility.cleanliness": compatibility.cleanliness }
        : {}),
      ...(typeof compatibility.socialEnergy === "string"
        ? { "compatibility.socialEnergy": compatibility.socialEnergy }
        : {}),
      ...(typeof compatibility.foodPreference === "string"
        ? { "compatibility.foodPreference": compatibility.foodPreference }
        : {}),
      ...(typeof compatibility.activityPreference === "string"
        ? { "compatibility.activityPreference": compatibility.activityPreference }
        : {}),
      ...(typeof compatibility.travelPace === "string"
        ? { "compatibility.travelPace": compatibility.travelPace }
        : {}),
      ...(typeof compatibility.communicationStyle === "string"
        ? { "compatibility.communicationStyle": compatibility.communicationStyle }
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
