const jwt = require("jsonwebtoken");

const socketAuthMiddleware = (
  socket,
  next
) => {

  try {

    const token =
      socket.handshake.auth.token;

    if (!token) {

      return next(
        new Error("Unauthorized")
      );

    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = decoded.id;

    next();

  } catch (error) {

    next(
      new Error("Invalid token")
    );

  }

};

module.exports = socketAuthMiddleware;