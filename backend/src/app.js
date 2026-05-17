const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user.routes");
const tripRoutes = require("./routes/trip.routes");
const messageRoutes = require("./routes/message.routes");

app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/messages", messageRoutes);
app.get("/", (req, res) => {
    res.send("API Running");
});



module.exports = app;