import { Server } from "socket.io";

let io;

export function configureSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (room) => {
      socket.join(room);
    });
  });

  return io;
}

export function emitOrderUpdate(order) {
  if (!io) return;
  io.emit("order:update", order);
}

export function emitNotification(userId, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification", payload);
}
