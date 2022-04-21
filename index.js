const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const cors = require('cors');

app.use(cors());

var users = [];

function hash(credentials) {
  return `${credentials.username},${credentials.password}`;
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('Login', (credentials) => {
    console.log(credentials);
    if (users[hash(credentials)]) {
      socket.user = users[hash(credentials)]
      socket.emit('login-confirm', 'Login successful');
    } else {
      socket.emit('error-message', 'Login failed. Incorrect Username or password.');
    }
  });

  socket.on('Logout', () => {
    socket.user = {};
    console.log('a user logged out');
  });

  socket.on('create-account', (credentials) => {
    if (users[hash(credentials)]) {
      socket.emit('error-message', 'That account already exists.');
    } else {
      users[hash(credentials)] = {
        username: credentials.username,
        password: credentials.password,
        listData: {
          currentList: 0,
          itemLists: [],
          listTitles: [],
          darkmode: false
        },
        dateCreated: Date.now()
      }
      console.log('Account created.');
    }
  });

  socket.on('load', () => {
    socket.emit('data', socket.user.listData);
    console.log('Data sent.');
  });

  socket.on('save', (data) => {
    socket.user.listData = data;
  });
});

const PORT = 8080;

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
