const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const fs = require('fs');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const cors = require('cors');

app.use(cors());

// Users is an object to allow for named indexing
var users = {};

var changesSaved = true;
var currentUsers = 0;

// Loads user data from file using the fs module
try {
  if (fs.existsSync('./account-data.json')) {
    let userData = fs.readFileSync('account-data.json');
    users = JSON.parse(userData);
    console.log('User data loaded.');
  }
} catch(err) {
  console.error(err);
}

function hash(credentials) {
  return `${credentials.username},${credentials.password}`;
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('Login', (credentials) => {
    if (users[hash(credentials)]) {
      socket.user = users[hash(credentials)]
      currentUsers++;
      socket.emit('login-confirm', 'Login successful');
    } else {
      socket.emit('error-message', 'Login failed. Incorrect Username or password.');
    }
  });

  socket.on('Logout', () => {
    socket.user = {};
    currentUsers--;
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
      socket.emit('confirmation', 'Accounted created successfully.');
    }
  });

  socket.on('load', () => {
    socket.emit('data', socket.user.listData);
    console.log('Data sent.');
  });

  socket.on('save', (data) => {
    socket.user.listData = data;
    changesSaved = false;
  });
});

const PORT = 8080;

// Writes to a file called account-data.json every minute
// The json is made to be readable by humnans for debugging
setInterval(function() {
  if (!changesSaved) {
    let data = JSON.stringify(users, null, 2);
    fs.writeFileSync('account-data.json', data);
    changesSaved = true;
    console.log('Data saved.');
  } else {
    console.log('No changes to be saved.');
  }
  if (currentUsers < 0) currentUsers = 0;
  console.log(`${currentUsers} ${(currentUsers == 1) ? 'user' : 'users' } connected.`);
}, 60000);

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
