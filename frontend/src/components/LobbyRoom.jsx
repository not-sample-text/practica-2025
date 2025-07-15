import React from "react";

const LobbyRoom = ({ lobby, onLeave }) => {
    if (!lobby) {
        return <div>Loading...</div>;
    }
    if (!lobby.name) {
            return <div>No lobby found.</div>;
        }
    if (!onLeave) {
        return <div>No leave function provided.</div>;
    }
  return (
    <div>
      <h2>{lobby.name}</h2>
      <button onClick={onLeave}>Leave Lobby</button>
    </div>
  );
};

export default LobbyRoom;
