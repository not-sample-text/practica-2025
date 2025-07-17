// START OF FILE App.jsx
import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import Header from "./components/Header";
import GlobalChat from "./components/chat/GlobalChat";
import PrivateChat from './components/chat/PrivateChat';
import RoomChat from "./components/chat/RoomChat";

const RoomsPlaceholder = () => (
  <div className="p-4 text-center">Camere (în curând)</div>
);
const PrivatePlaceholder = () => (
  <div className="p-4 text-center">Privat (în curând)</div>
);

const PrivateChatWrapper = ({ messages, users, username, sendMessage, connectionStatus }) => {
  const { chatPartner } = useParams();
  const filteredMessages = messages.filter(msg => 
    msg.type === 'private_message' && 
    ((msg.sender === username && msg.to === chatPartner) || (msg.sender === chatPartner && msg.to === username))
  );
  
  return (
    <PrivateChat 
      messages={filteredMessages}
      users={users}
      username={username}
      sendMessage={sendMessage}
      connectionStatus={connectionStatus}
    />
  );
};

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

const getUsernameFromToken = (token) => {
    if (!token) return null;
    try {
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
  const [availableRooms, setAvailableRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [usersInRooms, setUsersInRooms] = useState(new Map());

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
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
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
          case 'available_rooms':
            setAvailableRooms(data.content);
            break;
          case 'joined_rooms':
            setJoinedRooms(data.content);
            break;
          case 'room_message':
            setMessages((prev) => [...prev, {type: 'room_message',
               room: data.room, sender: data.sender, text: data.text, timestamp: data.timestamp}]);
            break;
          case 'room_user_count':
            setUsersInRooms(prev => new Map(prev).set(data.room, data.count));
            break;
          case 'error':
              console.error('Server error:', data.message);
              break;
          case 'info':
              console.log('Server info:', data.message);
              break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e, "Raw data:", event.data);
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
        JSON.stringify(messageToSend)
      );
    } else {
      console.warn("WebSocket not open. Message not sent:", message);
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
      setAvailableRooms([]);
      setJoinedRooms([]);
      setUsersInRooms(new Map());
      disconnectWebSocket();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/login');
    }
  };

  const handleCreateRoom = (roomName) => {
    if(websocketRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({ type: "create_room", room: roomName });
      navigate(`/home/rooms/${roomName.trim().toLowerCase()}`);
    }
  };

  const handleJoinRoom = (roomName) => {
    if(websocketRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({ type: "join_room", room: roomName });
      navigate(`/home/rooms/${roomName.trim().toLowerCase()}`);
    }
  };
  const handleLeaveRoom = (roomName) => {
    if(websocketRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({ type: "leave_room", room: roomName });
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
              messages={messages.filter(msg => msg.type === 'broadcast')} 
              sendMessage={sendMessage} 
              username={username}
              connectionStatus={connectionStatus}
            />
          } 
        />
        <Route path="rooms" element={<RoomChat
          messages={messages}
          username={username}
          connectionStatus={connectionStatus}
          sendMessage={sendMessage}
          availableRooms={availableRooms}
          joinedRooms={joinedRooms}
          usersInRooms={usersInRooms}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onLeaveRoom={handleLeaveRoom}
        />} />
        <Route path="rooms/:roomName" element={<RoomChat
          messages={messages}
          username={username}
          connectionStatus={connectionStatus}
          sendMessage={sendMessage}
          availableRooms={availableRooms}
          joinedRooms={joinedRooms}
          usersInRooms={usersInRooms}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onLeaveRoom={handleLeaveRoom}
        />} />
        <Route
            path="private"
            element={
                <PrivateChat 
                    messages={messages.filter(msg => msg.type === 'private_message' && (msg.sender === username || msg.to === username))}
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
                <PrivateChatWrapper 
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