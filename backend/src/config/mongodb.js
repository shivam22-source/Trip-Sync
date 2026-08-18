const mongoose = require("mongoose");

async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker MongoDB connected");
  } catch (error) {
    console.error("Worker MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectMongoDB;