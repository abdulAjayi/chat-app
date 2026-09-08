const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Filter = require("bad-words");
const { addUser, removeUser, getUsers, getInRoom } = require("./utils/user");
const { generateMessage, generateLocationMessage } = require("./utils/message");

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: clientOrigins }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", (options = {}, callback = () => {}) => {
    const { error, userData } = addUser({ id: socket.id, ...options });
    if (error) return callback(error);

    socket.join(userData.group);
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(userData.group)
      .emit("message", generateMessage("Admin", `${userData.user} has just joined the chat`));
    io.to(userData.group).emit("showSidebar", {
      room: userData.group,
      users: getInRoom(userData.group),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback = () => {}) => {
    const user = getUsers(socket.id);
    if (!user) return callback("Join a room before sending a message");
    if (typeof message !== "string" || !message.trim()) return callback("Message cannot be empty");
    if (new Filter().isProfane(message)) return callback("Please remove bad words");

    // Deliberately target only the sender's Socket.io room; io.emit leaked messages globally.
    io.to(user.group).emit("message", generateMessage(user.user, message.trim()));
    callback();
  });

  socket.on("location", ({ latitude, longitude } = {}, callback = () => {}) => {
    const user = getUsers(socket.id);
    const validCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    if (!user) return callback("Join a room before sharing a location");
    if (!validCoordinates) return callback("Location coordinates are invalid");

    // Same room-scoping fix as messages: a location is never visible outside its room.
    io.to(user.group).emit(
      "location-message-template",
      generateLocationMessage(user.user, `https://www.google.com/maps?q=${latitude},${longitude}`),
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (!user) return;

    io.to(user.group).emit(
      "message",
      generateMessage("Admin", `${user.user} has just left the chat`),
    );
    io.to(user.group).emit("showSidebar", {
      room: user.group,
      users: getInRoom(user.group),
    });
  });
});

module.exports = server;
