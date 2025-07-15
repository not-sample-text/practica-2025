import "./App.css";
import React, { use, useEffect, useRef } from "react";
import Login from "./components/Login";
import Header from "./components/Header";
import ActiveUsers from "./components/ActiveUsers";
import CreateLobby from "./components/CreateLobby";
import LobbyListElement from "./components/LobbyListElement";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!getTokenFromCookie());
  const [username, setUsername] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const websocketRef = useRef(null);
  const [messages, setMessages] = React.useState([]);
  const [connectionStatus, setConnectionStatus] =
    React.useState("disconnected");
  const [lobbies, setLobbies] = React.useState([]);

  // WebSocket connection effect
  useEffect(() => {
    if (isLoggedIn) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isLoggedIn]);

  const connectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:3000/ws`;

    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const { username, type, content } = JSON.parse(event.data);
        switch (type) {
          case "broadcast":
            setMessages((prev) => [...prev, { content, username }]);
            break;
          case "usernames":
            setUsers(content);
            break;
          case "lobby":
            setLobbies((prev) => {
              const updatedLobbies = [...prev];
              const existingLobbyIndex = updatedLobbies.findIndex(
                (lobby) => lobby.name === content.name
              );
              if (existingLobbyIndex > -1) {
                updatedLobbies[existingLobbyIndex] = content;
              } else {
                updatedLobbies.push(content);
              }
              return updatedLobbies;
            });
            break;
          default:
            console.warn("Unknown message type:", type);
            return;
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        return;
      }
      console.log("Received message:", event);
    };

    websocketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");
    };

    websocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setConnectionStatus("disconnected");
  };

  const sendMessage = (message) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(
        JSON.stringify({ type: "broadcast", content: message })
      );
    }
  };

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername);
    setIsLoggedIn(true);
    setMessages([]); // Clear messages on login
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const response = await fetch("/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        // Clear local state
        setIsLoggedIn(false);
        setUsername(null);
        setMessages([]);

        // Close WebSocket connection
        disconnectWebSocket();

        // Clear token cookie on client side as well
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        console.log("Logged out successfully");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if server call fails
      setIsLoggedIn(false);
      setUsername(null);
      setMessages([]);
      disconnectWebSocket();
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  return isLoggedIn ? (
    <>
      <ActiveUsers users={users} />
      <Header
        username={username}
        onLogout={handleLogout}
        messages={messages}
        sendMessage={sendMessage}
        connectionStatus={connectionStatus}
      />
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
        <CreateLobby onCreateLobby={(lobbyName) => {
          console.log("Lobby created:", lobbyName);
          window.location.href = `/lobby/${lobbyName}`;
          sendMessage({ type: 'lobby', name: lobbyName });
        }} />
      </div>
      <div className="lobby-list">
        {lobbies.length === 0 ? (
          <p>Nu sunt lobby-uri disponibile.</p>
        ) : (
          lobbies.map((lobby, index) => (
            <LobbyListElement
              key={index}
              lobby={lobby}
              onJoin={(name) => {
                console.log("Joining lobby:", name);
                window.location.href = `/lobby/${name}`;
              }}
            />
          ))
        )}
      </div>
    </>
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
