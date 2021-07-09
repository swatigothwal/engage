const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const cors = require("cors");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  userJoin,
  userLeave,
  getUser,
  users
} = require("./utils/users");
const userModal = require("./models/user");
const roomModal = require("./models/room");

const path = require("path");

app.use(express.static("public"));
app.use(express.json({
  extended: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

connectDB();

const liveUsers = {};

const socketToRoom = {};

app.get("/auth", function (req, res) {
  const token = req.headers["x-auth-token"];
  if (token) {
    const decoded = jwt.verify(token, "shhhhh");

    return res
      .status(200)
      .json({
        user: {
          email: decoded.email,
          name: decoded.name
        }
      });
  }

  res.json({
    message: "Failed Auth"
  });
});

app.post("/findAllMsgs", async function (req, res) {
  const response = await roomModal.findOne({
    ID: req.body.room
  });
  return res.status(200).json({
    msgs: response?.text
  });
});


app.post("/findUserRooms", async function (req, res) {
  const response = await userModal.findOne({
    email : req.body.email
  });
  return res.status(200).json(
    response.group
  );
});


app.post("/login", async function (req, res) {
  const {
    email,
    password
  } = req.body;
  const user = await userModal.findOne({
    email: email
  });
  if (user) {
    const checkPassword = await bcrypt.compare(password, user.password);
    if (checkPassword) {
      const token = jwt.sign({
          email: email,
          password: password,
          name: user.name
        },
        "shhhhh"
      );
      return res
        .status(200)
        .json({
          token,
          user: {
            email: user.email,
            name: user.name
          }
        });
    }
    return res.status(403).json({
      message: "Failed"
    });
  }
  res.json({
    message: "Failed"
  });
});

app.post("/register", async function (req, res) {
  const {
    name,
    email,
    password
  } = req.body;
  if (!name || !email || !password)
    return res.status(500).json({
      msg: "Please fill all!"
    });
  let user = await userModal.findOne({
    email
  });
  if (user) {
    return res.status(500).json({
      msg: "Account exists"
    });
  }
  const salt = await bcrypt.genSalt(10);
  user = new userModal({
    name,
    email,
    password
  });
  user.password = await bcrypt.hash(password, salt);
  await user.save();
  res.status(200).json({
    user: email
  });
});

if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;

io.on('connection', (socket) => {

  var userForExitName ;
  socket.on("join room", (item) => {

    const {name, roomID, email} = item;
    userForExitName = item.name;
    console.log(roomID)
    console.log(name)
    console.log(email)
    if (liveUsers[roomID]) {
    
      const length = liveUsers[roomID].length;
      if (length === 4) {
        socket.emit("room full");
        return;
      }

      console.log()

    if(liveUsers[roomID].includes({name:name})){
        liveUsers[roomID].remove({name:name});
        console.log("duplicates");
    }

      liveUsers[roomID].push({
        id: socket.id,
        name: name
      });
    } else {
      liveUsers[roomID] = [{
        id: socket.id,
        name: name
      }];
    }
    console.log(roomID)
    userModal.findOne({ email : email})
             .then((doc) => {
                if (doc) {
                  if(!doc.group.includes(roomID)){
                    doc.group.push(roomID);
                    doc.save('done');
                  }
                }
             })

    socketToRoom[socket.id] = roomID;


    const usersInThisRoom = liveUsers[roomID].filter(item => item.id !== socket.id);
    // Wellcome room
    socket.emit("all users", usersInThisRoom);

    socket.broadcast.to(socket.id).emit("message", {
      name: "Admin",
      msg: `${name} has joined to room`,
    });

  });

  socket.on("sending signal", payload => {
    io.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID
    });
  });

  socket.on("returning signal", payload => {
    io.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: socket.id
    });
  });

  socket.on('disconnect', () => {
    const roomID = socketToRoom[socket.id];
    let room = liveUsers[roomID];
    if (room) {
      room = room.filter(item => item.id !== socket.id);
      liveUsers[roomID] = room;
      var temp;
      if(userForExitName=="") temp="Someone has left the room"
      else temp= `${userForExitName} has left the room` 
      socket.broadcast.to(socket.id).emit("message", {
        name: "Admin",
        msg: `${userForExitName} has left to room`,
      });
    }

  });
  socket.emit("message", { name: "Admin", msg: "Continue Chat"});

  socket.on("sendMessage", ({
    name,
    msg,
    room
  }) => {
    io.emit("message", {
      name : name,
      msg : msg
    });
    console.log(room)
    roomModal.findOne({ ID: room[0] })
            .then((doc) => {
                if (doc) {

                    doc.text.push({
                        Sender: name,
                        Time: Date.now(),
                        Message: msg
                    })
                    doc.save('done');
                }
                else {
                  
                  const newDoc = new roomModal({
                        ID: room[0],
                        text: [{
                            Sender: name,
                            Time: Date.now(),
                            Message: msg
                        }]
                    })
                  newDoc.save();
                }
            })
  });
  
});
server.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});