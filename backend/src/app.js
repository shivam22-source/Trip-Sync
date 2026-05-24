const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { corsOptions } = require("./config/cors");

const app = express();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user.routes");
const tripRoutes = require("./routes/trip.routes");
const messageRoutes = require("./routes/message.routes");
const expenseRoutes = require("./routes/expense.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use(cors(corsOptions));

app.use(express.json({ limit: "5mb" }));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
    res.send("API Running");
});



module.exports = app;
