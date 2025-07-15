import React from "react";
import { useParams } from "react-router-dom";

const LobbyRoom = ({ lobby, onLeave }) => {
    const { name } = useParams();
    if(!name){
        return <div>No lobby name provided.</div>;
    }
    if (!onLeave) {
        return <div>No leave function provided.</div>;
    }
  return (
    <div>
      <h2>{name}</h2>
      <button onClick={onLeave}>Leave Lobby</button>
    </div>
  );
};

export default LobbyRoom;
