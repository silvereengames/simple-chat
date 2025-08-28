const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

const rooms = {}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room/:roomid', (req, res) => {
  var roomid = req.params.roomid;
  if (roomExists(roomid) == false) {
    res.sendFile(path.join(__dirname, 'private', 'noroom.html'));
  } else {

    res.sendFile(path.join(__dirname, 'private', 'room.html'));
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('createRoom', (e) => {
    const code = generateCode()
    console.log(`New room created: ${code}`)
    addRoom(code);
    socket.emit('joinRoom', code);
  })

  socket.on('sendmessage', ({ username, message, roomcode }) => {
    console.log('message recived: ' + message)
    io.to(roomcode).emit('updatemessage', { "username": username, "message": message })
  })

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  })

  socket.on('requestjoin', (roomid) => {
    if (roomExists(roomid) == true) {
      socket.emit('joinRoom', roomid);
    }
  })
});

function addRoom(roomId, password = "") {
  if (rooms[roomId]) {
    return false; // Room already exists
  }

  rooms[roomId] = {
    users: 0,
    createdAt: Date.now(),
    password: password
  };

  return true;
}

function deleteRoom(roomId) {
  if (!rooms[roomId]) {
    return false; // Room doesn't exist
  }

  delete rooms[roomId];
  return true;
}

function roomExists(roomId) {
  return !!rooms[roomId];
}

function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});