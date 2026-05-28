const Message = require("../models/Message");
const Member = require("../models/Member");
const Trip = require("../models/Trip");

const onlineUsers = new Map();
const tripPresence = new Map();

async function canUseTripRoom(tripId, userId) {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    return { allowed: false, reason: "Trip not found" };
  }

  if (trip.admin.toString() === userId) {
    return { allowed: true, trip };
  }

  const member = await Member.findOne({
    tripId,
    userId,
    status: "accepted",
  });

  if (member) {
    return { allowed: true, trip };
  }

  return { allowed: false, reason: "Access denied" };
}

async function emitTripPresence(io, tripId) {
  // Presence is in memory for the MVP. With multiple servers, move this to Redis.
  let userIds = [];

  if (tripPresence.has(tripId)) {
    userIds = Array.from(tripPresence.get(tripId));
  }

  const trip = await Trip.findById(tripId).populate("admin", "name email");

  if (!trip) {
    return;
  }

  const members = await Member.find({
    tripId,
    userId: { $in: userIds },
    status: "accepted",
  }).populate("userId", "name email");

  const onlineMembers = members.map((member) => ({
    _id: member.userId._id,
    name: member.userId.name,
    email: member.userId.email,
  }));

  const adminId = trip.admin._id.toString();
  const adminIsOnline = userIds.includes(adminId);
  const adminAlreadyListed = onlineMembers.some(
    (member) => member._id.toString() === adminId
  );

  if (adminIsOnline && !adminAlreadyListed) {
    onlineMembers.push({
      _id: trip.admin._id,
      name: trip.admin.name,
      email: trip.admin.email,
    });
  }

  io.to(tripId).emit("trip-presence", onlineMembers);
}

function rememberTripPresence(socket, tripId, userId) {
  if (!tripPresence.has(tripId)) {
    tripPresence.set(tripId, new Set());
  }

  tripPresence.get(tripId).add(userId);
  socket.currentTripId = tripId;
}

function removeTripPresence(socket, io) {
  if (!socket.currentTripId) {
    return;
  }

  if (!tripPresence.has(socket.currentTripId)) {
    return;
  }

  const users = tripPresence.get(socket.currentTripId);
  users.delete(socket.userId);

  if (users.size === 0) {
    tripPresence.delete(socket.currentTripId);
    return;
  }

  emitTripPresence(io, socket.currentTripId).catch(() => {});
}

const registerChatHandlers = (io, socket) => {
  onlineUsers.set(socket.userId, socket.id);

  // Each user has a private room for notification refresh events.
  socket.join(socket.userId);

  socket.on("join-trip", async ({ tripId, userId }) => {
    try {
      const access = await canUseTripRoom(tripId, userId);

      if (!access.allowed) {
        return socket.emit("error-message", access.reason);
      }

      socket.join(tripId);
      rememberTripPresence(socket, tripId, userId);
      await emitTripPresence(io, tripId);

      return socket.emit("joined-trip", "Joined successfully");
    } catch {
      return socket.emit("error-message", "Could not join trip chat");
    }
  });

  socket.on("send-message", async ({ tripId, content, type }) => {
    try {
      if (!content) {
        return socket.emit("error-message", "Message cannot be empty");
      }

      if (!content.trim()) {
        return socket.emit("error-message", "Message cannot be empty");
      }

      const access = await canUseTripRoom(tripId, socket.userId);

      if (!access.allowed) {
        return socket.emit("error-message", access.reason);
      }

      let messageType = "text";

      if (type) {
        messageType = type;
      }

      const message = await Message.create({
        tripId,
        sender: socket.userId,
        content,
        type: messageType,
      });

      await message.populate("sender", "name email profilePhoto");
      return io.to(tripId).emit("receive-message", message);
    } catch {
      return socket.emit("error-message", "Could not send message");
    }
  });

  socket.on("typing", ({ tripId }) => {
    socket.to(tripId).emit("user-typing", {
      userId: socket.userId,
    });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    removeTripPresence(socket, io);
  });
};

module.exports = registerChatHandlers;
