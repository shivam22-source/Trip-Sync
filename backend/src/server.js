require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = require("./app");
const { allowedOrigins } = require("./config/cors");
const socketAuthMiddleware = require("./middleware/socket.middleware");
const registerChatHandlers = require("./sockets/chat.socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

io.use(socketAuthMiddleware);
io.on("connection", (socket) => {
  registerChatHandlers(io, socket);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
