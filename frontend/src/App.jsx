import "./App.css";
import React, { useEffect, useRef } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";
import ActiveUsers from "./components/ActiveUsers";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
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
  const [newMessages, setNewMessages] = React.useState([]);
  const websocketRef = useRef(null);
  const [messages, setMessages] = React.useState([]);
  const [connectionStatus, setConnectionStatus] =
    React.useState("disconnected");
  const [lobbies, setLobbies] = React.useState([]);
  const [chatname, setChatname] = React.useState("Global");

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
    const port =
      location.port === "80" || location.port === "443"
        ? ""
        : `:${location.port}`;
    const wsUrl = `${protocol}//${window.location.hostname}${port}/ws`;
    console.log("Connecting to WebSocket at:", wsUrl);
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const { username, type, content } = JSON.parse(event.data);
        switch (type) {
          case "private":
            setNewMessages((prev) => [
              ...prev,
              username,
            ]);
            break;
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
            console.warn("Unknown message type:", { username, type, content });
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
        JSON.stringify(message)
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
    <div className="app-container">
      <Header onLogout={handleLogout} connectionStatus={connectionStatus} />
      <div className="main-content">
        <div className="sidebar">
          <ActiveUsers onChatNameChange={setChatname} users={users} newMessages={newMessages} />
        </div>
        <div className="chat-container">
          {true&&<Chat
            chatname={chatname}
            username={username}
            onLogout={handleLogout}
            messages={messages}
            sendMessage={sendMessage}
            connectionStatus={connectionStatus}
        />}
        </div>
        <div className="create-lobby-container">
          <CreateLobby />
        </div>
        <div className="lobby-list-container">
          {lobbies.length > 0 ? (
            <ul>
              {lobbies.map((lobby) => (
                <LobbyListElement key={lobby.name} lobby={lobby} />
              ))}
            </ul>
          ) : (
            <p>No lobbies available</p>
          )}
        </div>
      </div>
    </div>
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
