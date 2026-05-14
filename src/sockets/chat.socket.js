const Message = require("../models/Message");
const Trip = require("../models/Trip");

const registerChatHandlers = (io, socket) => {

  console.log("Socket connected:", socket.id);

  // JOIN TRIP ROOM
 socket.on(
  "join-trip",
  async ({ tripId, userId }) => {

    try {

      const trip =
      await Trip.findById(tripId);

      if (!trip) {
        return socket.emit(
          "error-message",
          "Trip not found"
        );
      }

      let allowed = false;

      // ADMIN CHECK
      if (
        trip.admin.toString() === userId
      ) {
        allowed = true;
      }

      // MEMBER CHECK
      const member =
      await Member.findOne({
        tripId,
        userId,
        status: "accepted",
      });

      if (member) {
        allowed = true;
      }

      if (!allowed) {

        return socket.emit(
          "error-message",
          "Access denied"
        );

      }

      socket.join(tripId);

      socket.emit(
        "joined-trip",
        "Joined successfully"
      );

      console.log(
        `${userId} joined ${tripId}`
      );

    } catch (error) {

      console.log(error);

    }

  }
);

  // SEND MESSAGE
  socket.on("send-message", async (data) => {

      try {

    // SAVE MESSAGE
    const message = await Message.create({
      tripId: data.tripId,
  sender: data.sender,
  content: data.content,
  type: data.type || "text",
    });

    // SEND REALTIME
  io.to(data.tripId).emit(
  "receive-message",
  message
);

  } catch (error) {

    console.log(error);

  }
  });



  // DISCONNECT
  socket.on("disconnect", () => {

    console.log("User disconnected");

  });

};

module.exports = registerChatHandlers;