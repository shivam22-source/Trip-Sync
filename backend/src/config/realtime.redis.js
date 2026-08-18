const Redis = require("ioredis");

const redisOptions = {
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
};

const publisher = new Redis(redisOptions);
const subscriber = new Redis(redisOptions);

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