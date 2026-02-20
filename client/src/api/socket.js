import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  if (!token) return null;
  if (!socket) {
    socket = io("/", {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connect_error", err?.message || err);
    });
  } else {
    socket.auth = { token };
    if (socket.disconnected) socket.connect();
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
