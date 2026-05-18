const Message = require("../models/Message");
const Member = require("../models/Member");
const Trip = require("../models/Trip");

const onlineUsers = new Map();

const registerChatHandlers = (io, socket) => {
    onlineUsers.set(
  socket.userId,
  socket.id
);

console.log(onlineUsers);

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
            const userId = socket.userId;
            const { tripId, content, type } = data;
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
            // SAVE MESSAGE
            if (!content?.trim()) {
                return socket.emit(
                    "error-message",
                    "Message cannot be empty"
                );
}
            const message = await Message.create({
                tripId,
                sender: userId,
                content,
                type: type || "text",
            });

            await message.populate(
                "sender",
                "name email"
            );

            // SEND REALTIME
            io.to(tripId).emit(
                "receive-message",
                message
            );

        } catch (error) {

            console.log(error);

        }
    });

socket.on("typing", (data) => {

  socket.to(data.tripId).emit(
    "user-typing",
    {
      userId: socket.userId,
    }
  );

});

    // DISCONNECT
    socket.on("disconnect", () => {
        onlineUsers.delete(socket.userId);

        console.log("User disconnected");

    });

};

module.exports = registerChatHandlers;
