const { Queue } = require("bullmq");
const redis = require("../config/bullmq.redis");

const reminderQueue = new Queue("trip-reminders", {
  connection: redis,
});

module.exports = reminderQueue;