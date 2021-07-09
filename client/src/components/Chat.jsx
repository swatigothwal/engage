import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
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

const END_POINT = process.env.REACT_APP_HOST_URL;
//const END_POINT = "http://localhost:5000";
const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 40%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    );
}

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};


function Room() {
  
 const [peers, setPeers] = useState([]);
 const socketRef = useRef();
 const userVideo = useRef();
 const userScreen = useRef();
 const peersRef = useRef([]);
 const roomID = useState(useParams().id);
 const [isMsg,setIsMsg] = useState(false);
 const [isFullScreen,setIsFullScreen] = useState(false);
 const loadingStatus = useSelector((state) => state.auth.loading);
 const authStatus = useSelector((state) => state.auth.isAuthenticated);
 const user = useSelector((state) => state.auth.user);
 const history = useHistory();
 const [isVideoVisible, setVideoVisible] = useState(true);
 const [isAudioVisible, setAudioVisible] = useState(true);
 const [isScreenShare, setScreenVisible] = useState(false);
 const [streamObj, setStreamObj] = useState(); 

  useEffect(() => { 
    const helperGetUserMedia = async ()=>{
     try{
      const stream = null;

        if(!stream) console.log("ddddd")
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", {name:user.name, roomID:roomID[0], email : user.email});
         
        socketRef.current.on("all users", users => {
             const peers = [];
             users.forEach(item => {
                 const peer = createPeer(item.id, socketRef.current.id, stream);
                 peersRef.current.push({
                     peerID: item.id,
                     peer,
                 })
                 peers.push(peer);
             })
             setPeers(peers);
         })
          
         socketRef.current.on("user joined", payload => {
             const peer = addPeer(payload.signal, payload.callerID, stream);
             peersRef.current.push({
                 peerID: payload.callerID,
                 peer,
             })

             setPeers(users => [...users, peer]);
          });

          socketRef.current.on("receiving returned signal", payload => {
             const item = peersRef.current.find(p => p.peerID === payload.id);
             item.peer.signal(payload.signal);
          });
        }
        catch{
          console.log("error in geUserMedia");
        }
     }

    socketRef.current = io.connect(END_POINT,
            {transports: ["websocket"],
            upgrade: false});
            console.log("dmkfd");
            helperGetUserMedia();
    },[userVideo]);


    if (!authStatus && !loadingStatus) {
        return <Redirect to="/login" />;
    }

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

  return (
   <div>
  <AppBar style={{marginLeft:'26rem'}}>
  <Toolbar>
    <Typography variant="h6" >
      Chat
    </Typography>
    <Link to ={`/rooms/${roomID[0]}`} >
    <IconButton style={{marginLeft:'10rem'}}>
      <VideocamOutlined />   
    </IconButton>
  </Link>
  </Toolbar>
</AppBar>
       <div style={{marginTop:'4rem'}} className="w-full h-full flex">
       <div className="w-1/4 hidden sm:block h-full border-l border-gray-300">
       <Message room={roomID} socket={socketRef.current} />
  </div>       
    </div>
    </div>
    );
}

export default Room;