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
    const { name, bio, preferences = {} } = req.body;

    const updateData = {
      ...(name ? { name } : {}),
      ...(typeof bio === "string" ? { bio } : {}),
      ...(preferences.vibe ? { "preferences.vibe": preferences.vibe } : {}),
      ...(preferences.budget ? { "preferences.budget": preferences.budget } : {}),
      ...(typeof preferences.smoking === "boolean"
        ? { "preferences.smoking": preferences.smoking }
        : {}),
      ...(typeof preferences.drinking === "boolean"
        ? { "preferences.drinking": preferences.drinking }
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
