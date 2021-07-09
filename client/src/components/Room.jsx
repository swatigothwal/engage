import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { useParams } from "react-router";
import { Redirect ,useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import Message from "components/Message";
import ToggleFullScreen from "./fullScreen";
import 'antd/dist/antd.css'
import { message as copied} from 'antd'
import {IconButton, Badge, Input, Button} from '@material-ui/core'
import VideocamIcon from '@material-ui/icons/Videocam'
import VideocamOffIcon from '@material-ui/icons/VideocamOff'
import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
import ScreenShareIcon from '@material-ui/icons/ScreenShare'
import StopScreenShareIcon from '@material-ui/icons/StopScreenShare'
import ChatIcon from '@material-ui/icons/Chat'
import CallEndIcon from '@material-ui/icons/CallEnd';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import 'bootstrap/dist/css/bootstrap.css'

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
      const stream = await navigator.mediaDevices
                    .getUserMedia({ video: isVideoVisible, audio: isAudioVisible})
      
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

  const copyUrl = () => {
		let text = window.location.href
    text = text.split('/');
    text = text[4];
		if (!navigator.clipboard) {
			let textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				document.execCommand('copy')
			  copied.success("Link copied to clipboard!")
			} catch (err) {
      	copied.error("Failed to copy")
			}
			document.body.removeChild(textArea)
			return
		}
		navigator.clipboard.writeText(text).then(function () {
			copied.success("Link copied to clipboard!")
		}, () => {
      copied.error("Failed to copy")
		})
	};

  const handleExitFullScreenClick =()=> {
    document.webkitExitFullscreen();
  }

const getToggleFullScreen = ()=>{
     if(!isFullScreen){
        ToggleFullScreen();
        setIsFullScreen(true)
      }else{
      handleExitFullScreenClick();
      setIsFullScreen(false);
    }
}

const toggleVideo = ()=>{
  if(isScreenShare){
    alert("please stop sharing your screen to get video");
  }
  else{
    userVideo.current.srcObject.getVideoTracks()[0].enabled = !isVideoVisible;
    setVideoVisible(!isVideoVisible);
  }
}
const toggleAudio = ()=>{
  userVideo.current.srcObject.getAudioTracks()[0].enabled = !isAudioVisible;
  setAudioVisible(!isAudioVisible);
}

const toggleScreenShare = async ()=>{
  if(isScreenShare){
    const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoVisible, audio: isAudioVisible });
    userVideo.current.srcObject = stream;
  }
  else{
    const stream = await navigator.mediaDevices.getDisplayMedia();
    userVideo.current.srcObject = stream;
  }

  setScreenVisible(!isScreenShare);
}

const showChat = ()=>{
  if(isMsg){
    setIsMsg(false);
  }else{
    setIsMsg(true);
  }
}


const disconnectCall = () => {
  history.push("/login");
    window.location.reload();
};

  return (
    <div className="w-full h-full flex">
      <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
      
      {
        isMsg===true?
       <div className="w-1/4 hidden sm:block h-full border-l border-gray-300">
       <Message room={roomID} socket={socketRef.current} />
       </div>:
       <></>
      }

      <div className="btn-down" style={{ backgroundColor: "whitesmoke", color: "whitesmoke", textAlign: "center" }}>
							<IconButton style={{ color: "#424242" }} onClick={()=>toggleVideo()}>
						{ isVideoVisible ? 	<VideocamIcon /> 
                : <VideocamOffIcon /> }
							</IconButton>

							<IconButton style={{ color: "#f44336" }} onClick={()=>disconnectCall()} >
								<CallEndIcon />
							</IconButton>

							<IconButton style={{ color: "#424242" }} onClick ={()=>toggleAudio()} >
					    {isAudioVisible	?	 <MicIcon /> :
                <MicOffIcon /> }
							</IconButton>
              
								<IconButton style={{ color: "#424242" }} onClick={()=>toggleScreenShare()}>
								
                {!isScreenShare ?	<ScreenShareIcon /> :
                   <StopScreenShareIcon /> }
								</IconButton>

								<IconButton style={{ color: "#424242" }} onClick={()=>getToggleFullScreen()}>
									{
                    isFullScreen!==true?
                    <FullscreenIcon />
                  :<FullscreenExitIcon/>
                  }
								</IconButton>
                     
                <IconButton style={{ color: "#424242" }} onClick={()=>showChat()}>
									<ChatIcon/>
								</IconButton>
                   
                <IconButton style={{ color: "#424242" ,marginLeft: '0.8rem' }} onClick={()=>copyUrl()}>
              <FileCopyOutlinedIcon/>
							</IconButton>
  
          	</div>
    </div>
    );
}

export default Room;