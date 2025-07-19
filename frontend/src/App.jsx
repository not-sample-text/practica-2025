import "./App.css";
import React, { useEffect, useRef } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";
import ActiveUsers from "./components/ActiveUsers";
import Header from "./components/Header";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!getTokenFromCookie());
  const [username, setUsername] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [newMessages, setNewMessages] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [connectionStatus, setConnectionStatus] = React.useState("disconnected");
  const [selectedChat, setSelectedChat] = React.useState("broadcast");

  const websocketRef = useRef(null);


  // Get username from JWT token
  const getUsernameFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Unknown User";
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return "Unknown User";
    }
  };

  // WebSocket connection effect
  useEffect(() => {
    if (isLoggedIn) {
      // set username again when the page reloads(not only at log in)
      setUsername(getUsernameFromToken(getTokenFromCookie()));
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isLoggedIn]);

  const connectWebSocket = () => {

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
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "private":
            setMessages((prev) => [...prev, data]);
            break;
          case "broadcast":
            setMessages((prev) => [...prev, data]);
            break;
          case "usernames":
            setUsers(['broadcast', ...data.content]);
            break;
          case 'error':
            console.error('server error:', error);
            break;
          default:
            console.warn("Unknown message type:", data);
            return;
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        return;
      }
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
    // setUsername(loggedInUsername);
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

  const handleSelectChat = (chatname, messages) => {
      setSelectedChat(chatname);
      setMessages( [ ...messages]); 
  }

  return isLoggedIn ? (
    <div className="main light">
      <div className="grid">
        <Header onLogout={handleLogout} connectionStatus={connectionStatus} />
      </div>
      <div className="grid" >
        <div className="grid">
          <ActiveUsers users={users} newMessages={messages} handleSelectChat={handleSelectChat}/>
          <div>
            <h5>Chat</h5>
            <Chat
              chatname={selectedChat}
              username={username}
              messages={messages}
              sendMessage={sendMessage}
              connectionStatus={connectionStatus}
            />
          </div>

        </div>

        <div className="game">
        </div>

      </div>
    </div>
  ) : (
    <>
    <Login onLogin={handleLogin} />
    </>
    
  );
}

export default App;
