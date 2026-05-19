const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/auth.middleware");

const {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../controllers/notification.controller");

router.get(
  "/",
  authMiddleware,
  getNotifications
);

router.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsRead
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  markNotificationRead
);

module.exports = router;
