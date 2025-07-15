import React from "react";

const CreateLobby = ({ onCreateLobby }) => {
  const [lobbyName, setLobbyName] = React.useState("");

  const handleCreateLobby = () => {
    if (lobbyName.trim()) {
      onCreateLobby(lobbyName);
      setLobbyName("");
    } else {
      alert("Please enter a lobby name.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Creaza Lobby</h2>
      <input
        type="text"
        value={lobbyName}
        onChange={(e) => setLobbyName(e.target.value)}
        placeholder="Introduceti numele lobby-ului"
        style={{ padding: "10px", width: "200px" }}
      />
      <button onClick={handleCreateLobby} style={{ padding: "10px", marginLeft: "10px" }}>
        Creaza
      </button>
    </div>
  );
};

export default CreateLobby;