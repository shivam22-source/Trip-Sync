const Message = require("../models/Message");
const Member = require("../models/Member");
const Trip = require("../models/Trip");

const onlineUsers = new Map();
const tripPresence = new Map();

async function emitTripPresence(io, tripId) {
    // Presence is kept in memory for MVP. For multi-server deployment, move
    // this data to Redis and use the Socket.io Redis adapter.
    const userIds = Array.from(tripPresence.get(tripId) || []);
    const members = await Member.find({
        tripId,
        userId: { $in: userIds },
        status: "accepted",
    }).populate("userId", "name email");
    const trip = await Trip.findById(tripId).populate("admin", "name email");
    const onlineMembers = members.map((member) => ({
        _id: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
    }));

    if (
        trip &&
        userIds.includes(trip.admin._id.toString()) &&
        !onlineMembers.some((member) => member._id.toString() === trip.admin._id.toString())
    ) {
        onlineMembers.push({
            _id: trip.admin._id,
            name: trip.admin.name,
            email: trip.admin.email,
        });
    }

    io.to(tripId).emit("trip-presence", onlineMembers);
}

const registerChatHandlers = (io, socket) => {
    onlineUsers.set(
  socket.userId,
  socket.id
);

console.log(onlineUsers);

    console.log("Socket connected:", socket.id);

    socket.join(socket.userId);
    // Private room for realtime notification refresh events.

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
                socket.currentTripId = tripId;

                // Track online members per trip room so the UI can show who is online.
                if (!tripPresence.has(tripId)) {
                    tripPresence.set(tripId, new Set());
                }

                tripPresence.get(tripId).add(userId);
                await emitTripPresence(io, tripId);

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
                "name email profilePhoto"
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

        if (socket.currentTripId && tripPresence.has(socket.currentTripId)) {
            const users = tripPresence.get(socket.currentTripId);
            users.delete(socket.userId);

            if (!users.size) {
                tripPresence.delete(socket.currentTripId);
            } else {
                emitTripPresence(io, socket.currentTripId).catch(console.log);
            }
        }

        console.log("User disconnected");

    });

};

module.exports = registerChatHandlers;
