import React from "react";

const LobbyListElement = ({ lobby, onJoin }) => {
  return (
    <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
      <span>{lobby.name}</span>
      <button onClick={() => onJoin(lobby.id)} style={{ marginLeft: "10px" }}>
        Join
      </button>
    </div>
  );
};

export default LobbyListElement;
