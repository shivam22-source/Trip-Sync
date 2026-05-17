require("dotenv").config();

const mongoose = require("mongoose");

const http = require("http");

const { Server } = require("socket.io");

const app = require("./app");

const PORT = process.env.PORT || 5000;



const server = http.createServer(app);

const registerChatHandlers =require("./sockets/chat.socket");

const socketAuthMiddleware = require("./middleware/socket.middleware");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {

   registerChatHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

});

mongoose.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

    server.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });

})
.catch((err) => {
    console.log(err);
});