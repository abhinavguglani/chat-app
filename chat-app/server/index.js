const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const messages = [];
const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_joined', (username) => {
    users[socket.id] = username;
    io.emit('update_users', Object.values(users));
    io.emit('user_notification', `${username} joined the chat`);
    socket.emit('message_history', messages);
  });

  socket.on('send_message', (data) => {
    messages.push(data);
    io.emit('receive_message', data);
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('user_typing', username);
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    delete users[socket.id];
    io.emit('update_users', Object.values(users));
    io.emit('user_notification', `${username} left the chat`);
    console.log('User disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});