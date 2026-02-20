import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const dbUser = await User.findById(decoded.id).select("role isBlocked");
      if (!dbUser || dbUser.isBlocked) return next(new Error("Unauthorized"));
      socket.data.userId = decoded.id;
      socket.data.role = dbUser.role;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
  });

  return io;
};

export const getIO = () => io;
