const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const indexRouter = require("./server/index");
const adminRouter = require("./server/admin");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routen für API
app.use("/api", indexRouter);
app.use("/api/admin", adminRouter);

// Static Files
app.use(express.static(path.join(__dirname, "publick")));

// Socket.IO: Chat + Online-Status + Likes
let onlineUsers = {};
let messages = []; // {id, user, text, time, likes, dislikes, role, color, roleColor}

io.on("connection", (socket) => {
  console.log("Neuer User verbunden:", socket.id);

  socket.on("join", (user) => {
    onlineUsers[socket.id] = user;
    io.emit("onlineUsers", Object.values(onlineUsers));
    socket.emit("allMessages", messages); // Alte Nachrichten senden
  });

  socket.on("chatMessage", (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = {
      id: Date.now(),
      ...msg,
      time: timestamp,
      likes: 0,
      dislikes: 0,
    };
    messages.push(message);
    io.emit("chatMessage", message);
  });

  socket.on("likeMessage", (msgId) => {
    const message = messages.find((m) => m.id === msgId);
    if (message) {
      message.likes++;
      io.emit("updateLikes", { msgId, likes: message.likes, dislikes: message.dislikes });
    }
  });

  socket.on("dislikeMessage", (msgId) => {
    const message = messages.find((m) => m.id === msgId);
    if (message) {
      message.dislikes++;
      io.emit("updateLikes", { msgId, likes: message.likes, dislikes: message.dislikes });
    }
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("onlineUsers", Object.values(onlineUsers));
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
