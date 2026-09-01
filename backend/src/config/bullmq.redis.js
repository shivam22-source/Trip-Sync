const Redis = require("ioredis");

const bullmqRedis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

bullmqRedis.on("connect", () => {
  console.log("BullMQ Redis connected");
});

bullmqRedis.on("error", (err) => {
  console.error("BullMQ Redis error:", err);
});

module.exports = bullmqRedis;
