const Redis = require("ioredis");

const redisOptions = {
  maxRetriesPerRequest: null,
};

const publisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  redisOptions
);

const subscriber = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  redisOptions
);

publisher.on("connect", () => {
  console.log("Realtime Redis publisher connected");
});

subscriber.on("connect", () => {
  console.log("Realtime Redis subscriber connected");
});

publisher.on("error", (error) => {
  console.error("Realtime Redis publisher error:", error.message);
});

subscriber.on("error", (error) => {
  console.error("Realtime Redis subscriber error:", error.message);
});

module.exports = {
  publisher,
  subscriber,
};
