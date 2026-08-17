const Redis = require("ioredis");

const bullmqRedis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

bullmqRedis.on("connect", () => {
  console.log("BullMQ Redis connected");
});

bullmqRedis.on("error", (err) => {
  console.error("BullMQ Redis error:", err);
});

module.exports = bullmqRedis;