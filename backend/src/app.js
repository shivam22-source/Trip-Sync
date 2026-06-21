const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { allowedOrigins } = require("./config/cors");
const passport = require("./config/passport");

const app = express();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user.routes");
const tripRoutes = require("./routes/trip.routes");
const messageRoutes = require("./routes/message.routes");
const expenseRoutes = require("./routes/expense.routes");
const notificationRoutes = require("./routes/notification.routes");
const aiRoutes = require("./routes/ai.routes");

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json({ limit: "5mb" }));

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.get("/", (req, res) => {
    res.send("API Running");
});



module.exports = app;
