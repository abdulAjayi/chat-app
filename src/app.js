const express = require("express");
const socketio = require("socket.io");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { addUser, removeUser, getUsers, getInRoom } = require("./utils/user");
const Filter = require("bad-words");
const path = require("path");
const { generateMessage, generateLocationMessage } = require("./utils/message");
const pathName = path.join(__dirname, "../public");
app.use(express.static(pathName));
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("join", (options, callback) => {
    const { error, userData } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(userData.group);
    socket.emit("message", generateMessage("Admin", "welcome!"));
    socket.broadcast
      .to(userData.group)
      .emit(
        "message",
        generateMessage(
          userData.user,
          `${userData.user} has just joined the chat`,
        ),
      );
    io.to(userData.group).emit("showSidebar", {
      room: userData.group,
      users: getInRoom(userData.group),
    });
    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const user = getUsers(socket.id);
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("please remove bad words");
    }
    io.emit("message", generateMessage(user.user, msg));
    callback();
  });
  socket.broadcast.emit("message", "a new user has signed in");

  socket.on("location", ({ latitude, longitude }, callback) => {
    const user = getUsers(socket.id);
    console.log(user);

    io.emit(
      "location-message-template",
      generateLocationMessage(
        user.user,
        `https://google.com/maps?q=${latitude},${longitude}`,
      ),
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.group).emit(
        "message",
        generateMessage("Admin", `${user.user} has just left the chat`),
      );
      io.to(user.group).emit("showSidebar", {
        room: user.group,
        users: getInRoom(user.group),
      });
    }
  });
});
module.exports = server;
