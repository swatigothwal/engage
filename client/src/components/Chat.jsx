import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useParams } from "react-router";
import {Link, Redirect ,useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import Message from "components/Message";
import 'antd/dist/antd.css'
import 'bootstrap/dist/css/bootstrap.css'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import VideocamOutlined from '@material-ui/icons/VideocamOutlined';

const END_POINT = "http://localhost:5000";

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};


function ChatRoom() {
  
 const [peers, setPeers] = useState([]);
 const socketRef = useRef();
 const roomID = useState(useParams().id);
 const [isMsg,setIsMsg] = useState(false);
 const [isFullScreen,setIsFullScreen] = useState(false);
 const loadingStatus = useSelector((state) => state.auth.loading);
 const authStatus = useSelector((state) => state.auth.isAuthenticated);
 const user = useSelector((state) => state.auth.user);
 const history = useHistory();
 useEffect(() => {
       socketRef.current = io.connect("http://localhost:5000",
            {transports: ["websocket"],
            upgrade: false});
            console.log("dmkfd");
            socketRef.current.emit("join room", {name:user.name, roomID:roomID[0], email:user.email});
        },[]);


    if (!authStatus && !loadingStatus) {
        return <Redirect to="/login" />;
    }


    return (
        <div style={{marginLeft:'30rem', marginRight:'55rem'  }}>
            <AppBar position="static">
  <Toolbar style={{backgoundColor:'green'}}>
    <Typography variant="h6" >
      Chat
    </Typography>
    <Link to ={`/rooms/${roomID[0]}}`} >
    <IconButton style={{marginLeft:'10rem'}} >
      <VideocamOutlined />   
    </IconButton>
  </Link>
  </Toolbar>
</AppBar>

    <Message room={roomID} socket={socketRef.current} />
       </div>
    );
}

export default ChatRoom;
