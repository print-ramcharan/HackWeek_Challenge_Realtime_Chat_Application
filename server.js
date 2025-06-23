const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = new Map();
const sockets = new Map();
const messages = []; //  store chat history
const unreadCounts = new Map(); // key: recipient, value: Map<sender, count>


io.on('connection', socket => {
  console.log(`${socket.id} connected`);

  socket.on('register', username => {
    users.set(username, socket.id);
    sockets.set(socket.id, username);
    
    // Send history and users
    socket.emit('history', messages);
    socket.broadcast.emit('users', Array.from(users.keys()));
    socket.emit('users', Array.from(users.keys()));
  
    // Send unread counts
    const counts = Object.fromEntries(
      (unreadCounts.get(username) || new Map()).entries()
    );
    socket.emit('unread counts', counts);
  });
  
  
  // event for handling private message.
  socket.on('private message', ({ text, to, from }) => {
    const msg = { text, from, to };
    messages.push(msg);
  
    const recipientId = users.get(to);
    if (recipientId) {
      io.to(recipientId).emit('private message', msg);
    } else {
      // track unread if user is offline
      if (!unreadCounts.has(to)) unreadCounts.set(to, new Map());
      const senderMap = unreadCounts.get(to);
      senderMap.set(from, (senderMap.get(from) || 0) + 1);
    }
  
    socket.emit('private message', msg); // always showing to sender
  });
  
  // when user leaves.
  socket.on('disconnect', () => {
    const username = sockets.get(socket.id);
    if (username) {
      users.delete(username);
      sockets.delete(socket.id);
      console.log(`Disconnected: ${username}`);
      broadcastUsers();
    }
  });
  // event to get history of user with other user.
  socket.on('get history', ({ self, with: otherUser }) => {
    const relevant = messages.filter(
      m =>
        (m.from === self && m.to === otherUser) ||
        (m.from === otherUser && m.to === self)
    );
    socket.emit('history', relevant);
  });
  
  
  function broadcastUsers() {
    io.emit('users', Array.from(users.keys()));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});
