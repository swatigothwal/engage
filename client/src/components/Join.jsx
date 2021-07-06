import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import api from "api";

function Join() {
  let [id, setId] = useState();
  let [rooms,setRooms] = useState([]);
  const user = useSelector((state) => state.auth.user);

  function handleChange(e) {
    e.preventDefault();
    setId(e.target.value);
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
            <Link to={`/rooms/${id}`}>
              <button
                type="submit"
                className="bg-blue-500 text-white ml-4 text-lg py-2 px-3 rounded-xl"
              >
                JOIN
              </button>
            </Link>
          </form>
        </div>
        helllllo
        <div>
        { rooms.map(item => 
           <li>{item}</li> )}
        </div>
      </div>
    </div>
  );
}

export default Join;
