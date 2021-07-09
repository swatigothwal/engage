import { useState } from "react";
import { Link ,useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import api from "api";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import StarIcon from '@material-ui/icons/Star';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 300,
    height:70,
    margin:10,
    backgroundColor: theme.palette.background.paper,
  },
}));


function Join() {
  const classes = useStyles();
  let [id, setId] = useState();
  let [rooms,setRooms] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const history = useHistory();

  function handleChange(e) {
    e.preventDefault();
    setId(e.target.value);
  }
  
  const goToRoom = (item)=>{
        history.push(`/chatRoom/${item}`)
  }

  useEffect(()=>{
      async function fetchData() {
        console.log("hhh");
        
      const response =await api.post("/findUserRooms", { email: user.email } );      
      console.log("hhh");
      console.log(response);
      setRooms(response.data);       
    }
    fetchData();
    console.log(rooms)  
  },[])

  return (
    <div className="w-full h-full flex justify-center items-center bg-img-background bg-cover bg-no-repeat">
      <div>
        <div>
          <form>
            <input
              name="id"
              type="text"
              value={id}
              onChange={handleChange}
              placeholder="Enter room's id ..."
              className="rounded-lg p-2 focus:outline-none"
            />
            <Link to={`/chatRoom/${id}`}>
              <button
                type="submit"
                className="bg-blue-500 text-white ml-4 text-lg py-2 px-3 rounded-xl"
              >
                JOIN
              </button>
            </Link>
          </form>
        </div>
        <div>
        <List component="nav" className={classes.root} aria-label="contacts">
      
        { rooms.map(item => 
          <ListItem button onClick={()=>goToRoom(item)}>
        
           <ListItemIcon>
             <StarIcon />
           </ListItemIcon>
           <ListItemText primary={item}/>
         </ListItem> )}
    </List>
        </div>
      </div>
    </div>
  );
}

export default Join;
