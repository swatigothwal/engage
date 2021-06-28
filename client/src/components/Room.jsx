import { useParams } from "react-router";
import { Redirect ,useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
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


const END_POINT = "http://localhost:5000/";


function Room() {
  
  const [isMsg,setIsMsg] = useState(false);
  const [isFullScreen,setIsFullScreen] = useState(false);
  const loadingStatus = useSelector((state) => state.auth.loading);
  const authStatus = useSelector((state) => state.auth.isAuthenticated);
  const [room] = useState(useParams().id);
  const user = useSelector((state) => state.auth.user);
  const history = useHistory();

  const [socket] = useState(() =>
    io(END_POINT, {
      transports: ["websocket"],
      upgrade: false,
    })
  );
  const [peerId, setPeerId] = useState();
  const [members, setMembers] = useState([]);
  const [peer] = useState(
    () =>
      new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun2.1.google.com:19302'}
          ],
        },  
        trickle: false,
      })
  );

  useEffect(() => {
    peer?.on("open", (id) => {
      setPeerId(id);
      socket.emit("joinRoom", { name: user?.name, room, peerID: id });

      socket.on("allMembers", (userPeers) => {
        let videos = document.getElementById("videoContainer");
        if (videos) videos.innerHTML = "";
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            playStream(id, stream, true);
            userPeers.forEach((member) => {
              if (member !== id) {
                let call = peer.call(member, stream);
                call?.on("stream", (remoteStream) => {
                  playStream(member, remoteStream);
                });
              }
            });
            updateStream(userPeers);
          });

        // Answer
        peer.on("call", (call) => {
          if (videos) videos.innerHTML = "";
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
              call.answer(stream);
              playStream(id, stream, true);
              userPeers.forEach((member) => {
                if (member !== id) {
                  call?.on("stream", (remoteStream) => {
                    playStream(member, remoteStream);
                  });
                }
              });
              updateStream(userPeers);
            });
        });

        setMembers(userPeers);
      });
    });
  }, [socket, room, user, peer, members]);

  useEffect(() => {
    return () => {
      socket?.emit("peerClose", { peerId });
    };
  }, [socket, peerId]);

  useEffect(() => {
    updateStream(members);
  }, [members]);

  if (!authStatus && !loadingStatus) {
    return <Redirect to="/login" />;
  }

  function updateStream(userPeers) {
    let videos = document.getElementById("videoContainer");
    let arr = [];
    for (let i = 0; i < videos.childNodes.length; i++) {
      if (!userPeers.includes(videos.childNodes[i].id)) {
        arr.push(videos.childNodes[i]);
      }
      console.log(arr);
    }

    arr.forEach((video) => {
      videos.removeChild(video);
    });
  }

  function playStream(id, stream, isLocal = false) {
    if (!document.getElementById(id)) {
      let video = document.createElement("video");
      let div = document.createElement("div");
      let videos = document.getElementById("videoContainer");

      div.className = "max-w-full min-w-min flex justify-center items-center";
      video.srcObject = stream;
      if (isLocal) {
        video.muted = "muted";
      }
      div.id = id;
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then((_) => {})
          .catch((error) => {
            console.log(error);
          });
      }
      div.appendChild(video);
      if (videos) videos.appendChild(div);
    }
  }

  const copyUrl = () => {
		let text = window.location.href
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

const showChat = ()=>{
  if(isMsg){
    setIsMsg(false);
  }else{
    setIsMsg(true);
  }
}


const disconnectCall = () => {
  peer.destroy();
  history.push("/login");
 window.location.reload();
};

  return (
    <div className="w-full h-full flex">
      <div
        className="w-full  h-full no-scrollbar grid grid-cols-2 gap-2 overflow-y-scroll bg-black bg-opacity-90 p-2"
        id="videoContainer"
      ></div>              
      
      {
        isMsg===true?
       <div className="w-1/4 hidden sm:block h-full border-l border-gray-300">
       <Message room={room} socket={socket} />
       </div>:
       <></>
      }

      <div className="btn-down" style={{ backgroundColor: "whitesmoke", color: "whitesmoke", textAlign: "center" }}>
							<IconButton style={{ color: "#424242" }}>
								<VideocamIcon /> 
                 <VideocamOffIcon />
							</IconButton>

							<IconButton style={{ color: "#f44336" }} onClick={()=>disconnectCall()} >
								<CallEndIcon />
							</IconButton>

							<IconButton style={{ color: "#424242" }} >
							 <MicIcon /> 
                <MicOffIcon />
							</IconButton>
              
								<IconButton style={{ color: "#424242" }} >
									<ScreenShareIcon /> 
                   <StopScreenShareIcon />
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
