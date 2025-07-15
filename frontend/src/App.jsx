import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import Header from "./components/Header";
import GlobalChat from "./components/chat/GlobalChat";
import PrivateChat from './components/chat/PrivateChat';

const RoomsPlaceholder = () => (
  <div className="p-4 text-center">Camere (în curând)</div>
);
const PrivatePlaceholder = () => (
  <div className="p-4 text-center">Privat (în curând)</div>
);

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

// Funcția ajutătoare pentru a extrage username-ul din token
const getUsernameFromToken = (token) => {
    if (!token) return null;
    try {
        // Decodăm partea de "payload" a token-ului (care este în format Base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username;
    } catch (e) {
        console.error("Failed to decode token:", e);
        return null;
    }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromCookie());
  const [username, setUsername] = useState(() => getUsernameFromToken(getTokenFromCookie()));
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const websocketRef = useRef(null);
  const navigate = useNavigate();

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
      setConnectionStatus("connected");
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "broadcast":
            setMessages((prev) => [...prev, {type:'broadcast', content: data.content, username: data.username }]);
            break;
          case "private_message":
            setMessages((prev) => [...prev, {type:'private_message',
               sender: data.sender, to: data.to, text: data.text}]);
            break;
          case "usernames":
            setUsers(data.content);
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    websocketRef.current.onclose = () => {
      setConnectionStatus("disconnected");
    };

    websocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
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
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      let messageToSend;
      if (typeof message === 'string') {
        messageToSend ={type: "broadcast", content: message};
      } else {
        messageToSend = message;

      }
      websocketRef.current.send(
        JSON.stringify({ type: "broadcast", content: message })
      );
    }
  };

  const handleLoginSuccess = (loggedInUsername) => {
    setUsername(loggedInUsername);
    setIsLoggedIn(true);
    setMessages([]);
    navigate('/home/global');
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setUsername(null);
      setMessages([]);
      setUsers([]);
      disconnectWebSocket();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/login');
    }
  };

  return (
    <Routes>
      <Route path="/" element={!isLoggedIn ? <WelcomePage /> : <Navigate to="/home" />} />
      <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLoginSuccess} /> : <Navigate to="/home" />} />
      <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/home" />} />
      
      <Route 
        path="/home" 
        element={
          isLoggedIn ? (
            <Header
              username={username}
              onLogout={handleLogout}
              connectionStatus={connectionStatus}
              users={users}
            />
          ) : (
            <Navigate to="/login" />
          )
        } 
      >
        <Route index element={<Navigate to="global" replace />} />
        <Route 
          path="global" 
          element={
            <GlobalChat 
              messages={messages} 
              sendMessage={sendMessage} 
              username={username}
              connectionStatus={connectionStatus}
            />
          } 
        />
        <Route path="rooms" element={<RoomsPlaceholder />} />
        <Route
    path="private"
    element={
        <PrivateChat 
            messages={messages}
            users={users}
            username={username}
            sendMessage={sendMessage}
            connectionStatus={connectionStatus}
        />
    }
/>
        <Route
            path="private/:chatPartner"
            element={
                <PrivateChat 
                    messages={messages}
                    users={users}
                    username={username}
                    sendMessage={sendMessage}
                    connectionStatus={connectionStatus}
                />
            }
        />
      </Route>      
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;