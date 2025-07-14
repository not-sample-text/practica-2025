import React from "react";

const LobbyRoom = ({ lobby, onLeave }) => {
  return (
    <div>
      <h2>{lobby.name}</h2>
      <button onClick={onLeave}>Leave Lobby</button>
    </div>
  );
};

export default LobbyRoom;
