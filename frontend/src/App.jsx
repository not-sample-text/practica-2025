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
import PokerLobby from "./components/poker/PokerLobby";
import PokerTable from "./components/poker/PokerTable";


const PrivateChatWrapper = ({ messages, users, username, sendMessage, connectionStatus, onChatPartnerChange }) => {
  const { chatPartner } = useParams();
  
  useEffect(() => {
    if (chatPartner) {
      localStorage.setItem('lastPrivateChatPartner', chatPartner);
      if (onChatPartnerChange) {
        onChatPartnerChange(chatPartner);
      }
    }
  }, [chatPartner, onChatPartnerChange]);

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

const RoomChatWrapper = ({ 
  messages, 
  username, 
  connectionStatus, 
  sendMessage, 
  availableRooms, 
  joinedRooms, 
  usersInRooms, 
  onJoinRoom, 
  onCreateRoom, 
  onLeaveRoom,
  onRoomChange 
}) => {
  const { roomName } = useParams();
  
  useEffect(() => {
    if (roomName) {
      localStorage.setItem('lastRoomChat', roomName);
      if (onRoomChange) {
        onRoomChange(roomName);
      }
    }
  }, [roomName, onRoomChange]);

  return (
    <RoomChat 
      messages={messages}
      username={username}
      connectionStatus={connectionStatus}
      sendMessage={sendMessage}
      availableRooms={availableRooms}
      joinedRooms={joinedRooms}
      usersInRooms={usersInRooms}
      onJoinRoom={onJoinRoom}
      onCreateRoom={onCreateRoom}
      onLeaveRoom={onLeaveRoom}
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
  
  const [pokerGames, setPokerGames] = useState([]);
  const [currentPokerGame, setCurrentPokerGame] = useState(null);
  const [myPokerHand, setMyPokerHand] = useState([]);

  const [lastPrivateChatPartner, setLastPrivateChatPartner] = useState(() => 
    localStorage.getItem('lastPrivateChatPartner')
  );
  const [lastRoomChat, setLastRoomChat] = useState(() => 
    localStorage.getItem('lastRoomChat')
  );

  const websocketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      connectWebSocket();
      fetchPokerGames();
      checkCurrentPokerGame();
    } else {
      disconnectWebSocket();
      localStorage.removeItem('lastPrivateChatPartner');
      localStorage.removeItem('lastRoomChat');
      setLastPrivateChatPartner(null);
      setLastRoomChat(null);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isLoggedIn]);

  const checkCurrentPokerGame = async () => {
    try {
      const response = await fetch('/api/auth/poker/current-game', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setCurrentPokerGame(data.gameState);
        setMyPokerHand(data.hand || []);
        const currentPath = window.location.pathname;
        const expectedPath = `/home/poker/table/${data.gameState.gameId}`;
        if (currentPath !== expectedPath && !currentPath.includes('/home/private/') && !currentPath.includes('/home/global') && !currentPath.includes('/home/rooms/')) {
          navigate(expectedPath);
        }
      }
    } catch (error) {
      console.error('Error checking current poker game:', error);
    }
  };

  const connectWebSocket = () => {
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:3000/ws`;
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => setConnectionStatus("connected");

    websocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "broadcast":
            setMessages((prev) => [...prev, {type:'broadcast', content: data.content, username: data.username }]);
            break;
          case "private_message":
            setMessages((prev) => [...prev, {type:'private_message', sender: data.sender, to: data.to, text: data.text}]);
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
            setMessages((prev) => [...prev, {type: 'room_message', room: data.room, sender: data.sender, text: data.text, timestamp: data.timestamp}]);
            break;
          case 'room_user_count':
            setUsersInRooms(prev => new Map(prev).set(data.room, data.count));
            break;
          case 'poker_game_state':
            setCurrentPokerGame(data.gameState);
            break;
          case 'poker_hand':
            setMyPokerHand(data.hand);
            break;
          case 'poker_left_game':
            setCurrentPokerGame(null);
            setMyPokerHand([]);
            navigate('/home/poker');
            break;
          case 'poker_lobby_update':
            setPokerGames(data.games);
            break;
          case 'error':
            alert(`Eroare de la server: ${data.message}`);
            console.error('WebSocket error:', data.message);
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e, "Raw data:", event.data);
      }
    };

    websocketRef.current.onclose = () => setConnectionStatus("disconnected");
    websocketRef.current.onerror = (error) => console.error("WebSocket error:", error);
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
      const messageToSend = typeof message === 'string' ? {type: "broadcast", content: message} : message;
      websocketRef.current.send(JSON.stringify(messageToSend));
    } else {
      console.warn("WebSocket not open. Message not sent:", message);
    }
  };

  const handleLoginSuccess = (loggedInUsername) => {
    setUsername(loggedInUsername);
    setIsLoggedIn(true);
    
    const storedPrivateChat = localStorage.getItem('lastPrivateChatPartner');
    const storedRoomChat = localStorage.getItem('lastRoomChat');
    
    if (storedPrivateChat) {
      navigate(`/home/private/${storedPrivateChat}`);
    } else if (storedRoomChat) {
      navigate(`/home/rooms/${storedRoomChat}`);
    } else {
      navigate('/home');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setUsername(null);
      setCurrentPokerGame(null);
      setMyPokerHand([]);
      setPokerGames([]);
      setMessages([]);
      setUsers([]);
      setAvailableRooms([]);
      setJoinedRooms([]);
      disconnectWebSocket();
      
      localStorage.removeItem('lastPrivateChatPartner');
      localStorage.removeItem('lastRoomChat');
      setLastPrivateChatPartner(null);
      setLastRoomChat(null);
      
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/login');
    }
  };

  const handleCreateRoom = (roomName) => {
    sendMessage({ type: "create_room", room: roomName });
    localStorage.setItem('lastRoomChat', roomName.trim().toLowerCase());
    setLastRoomChat(roomName.trim().toLowerCase());
    navigate(`/home/rooms/${roomName.trim().toLowerCase()}`);
  };

  const handleJoinRoom = (roomName) => {
    sendMessage({ type: "join_room", room: roomName });
    localStorage.setItem('lastRoomChat', roomName.trim().toLowerCase());
    setLastRoomChat(roomName.trim().toLowerCase());
    navigate(`/home/rooms/${roomName.trim().toLowerCase()}`);
  };
  
  const handleLeaveRoom = (roomName) => {
    sendMessage({ type: "leave_room", room: roomName });
  };

  const fetchPokerGames = async () => {
    try {
      const response = await fetch('/api/auth/poker/games', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setPokerGames(data.games);
    } catch (error) {
      console.error('Error fetching poker games:', error);
    }
  };

  const createPokerGame = async (gameId, password, smallBlind, bigBlind, maxPlayers, stack) => {
    try {
      const response = await fetch('/api/auth/poker/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameId, password, smallBlind, bigBlind, maxPlayers, stack })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPokerGame(data.gameState);
        navigate(`/home/poker/table/${gameId}`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Eroare la crearea jocului.');
    }
  };

  const joinPokerGame = async (gameId, password, stack) => {
    try {
      const response = await fetch('/api/auth/poker/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameId, password, stack })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPokerGame(data.gameState);
        sendMessage({ type: "poker_get_hand", gameId });
        navigate(`/home/poker/table/${gameId}`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Eroare la intrarea în joc.');
    }
  };

  const sendPokerAction = (action, amount = 0) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN && currentPokerGame) {
      sendMessage({ type: "poker_action", gameId: currentPokerGame.gameId, action, amount });
    }
  };

  const startPokerGame = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN && currentPokerGame) {
      sendMessage({ type: "poker_start_game", gameId: currentPokerGame.gameId });
    }
  };

  const startNewHand = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN && currentPokerGame) {
        sendMessage({ type: "poker_start_new_hand", gameId: currentPokerGame.gameId });
    }
  };

  const leavePokerGame = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN && currentPokerGame) {
      sendMessage({ type: "poker_leave_game", gameId: currentPokerGame.gameId });
    } else {
      setCurrentPokerGame(null);
      setMyPokerHand([]);
      navigate('/home/poker');
    }
  };

  const handleChatPartnerChange = (chatPartner) => {
    setLastPrivateChatPartner(chatPartner);
  };

  const handleRoomChange = (roomName) => {
    setLastRoomChat(roomName);
  };

  const EnhancedPrivateChat = ({ messages, users, username, sendMessage, connectionStatus }) => {
    const currentPath = window.location.pathname;
    if (currentPath === '/home/private' && lastPrivateChatPartner) {
      navigate(`/home/private/${lastPrivateChatPartner}`, { replace: true });
      return null;
    }

    return (
      <PrivateChat 
        messages={messages.filter(msg => msg.type === 'private_message' && (msg.sender === username || msg.to === username))} 
        users={users} 
        username={username} 
        sendMessage={sendMessage} 
        connectionStatus={connectionStatus} 
      />
    );
  };

  const EnhancedRoomChat = ({ 
    messages, 
    username, 
    connectionStatus, 
    sendMessage, 
    availableRooms, 
    joinedRooms, 
    usersInRooms, 
    onJoinRoom, 
    onCreateRoom, 
    onLeaveRoom 
  }) => {
    const currentPath = window.location.pathname;
    if (currentPath === '/home/rooms' && lastRoomChat) {
      navigate(`/home/rooms/${lastRoomChat}`, { replace: true });
      return null;
    }

    return (
      <RoomChat 
        messages={messages}
        username={username}
        connectionStatus={connectionStatus}
        sendMessage={sendMessage}
        availableRooms={availableRooms}
        joinedRooms={joinedRooms}
        usersInRooms={usersInRooms}
        onJoinRoom={onJoinRoom}
        onCreateRoom={onCreateRoom}
        onLeaveRoom={onLeaveRoom}
      />
    );
  };

  const handlePrivateNavigation = () => {
    if (lastPrivateChatPartner) {
      navigate(`/home/private/${lastPrivateChatPartner}`);
    } else {
      navigate('/home/private');
    }
  };

  const handleRoomNavigation = () => {
    if (lastRoomChat) {
      navigate(`/home/rooms/${lastRoomChat}`);
    } else {
      navigate('/home/rooms');
    }
  };

  const handlePokerNavigation = () => {
    if (currentPokerGame && currentPokerGame.gameId) {
      navigate(`/home/poker/table/${currentPokerGame.gameId}`);
    } else {
      navigate('/home/poker');
    }
  };
  
  return (
    <Routes>
      <Route path="/" element={!isLoggedIn ? <WelcomePage /> : <Navigate to="/home" />} />
      <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLoginSuccess} /> : <Navigate to="/home" />} />
      <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/home" />} />
      
      <Route path="/home" element={isLoggedIn ? <Header username={username} onLogout={handleLogout} connectionStatus={connectionStatus} users={users} onPrivateNavigation={handlePrivateNavigation} onRoomNavigation={handleRoomNavigation} onPokerNavigation={handlePokerNavigation} /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="global" replace />} />
        
        <Route path="global" element={<GlobalChat messages={messages.filter(msg => msg.type === 'broadcast')} sendMessage={sendMessage} username={username} connectionStatus={connectionStatus} />} />
        
        <Route path="rooms" element={<EnhancedRoomChat messages={messages} username={username} connectionStatus={connectionStatus} sendMessage={sendMessage} availableRooms={availableRooms} joinedRooms={joinedRooms} usersInRooms={usersInRooms} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} onLeaveRoom={handleLeaveRoom} />} />
        <Route path="rooms/:roomName" element={<RoomChatWrapper messages={messages} username={username} connectionStatus={connectionStatus} sendMessage={sendMessage} availableRooms={availableRooms} joinedRooms={joinedRooms} usersInRooms={usersInRooms} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} onLeaveRoom={handleLeaveRoom} onRoomChange={handleRoomChange} />} />
        
        <Route path="private" element={<EnhancedPrivateChat messages={messages} users={users} username={username} sendMessage={sendMessage} connectionStatus={connectionStatus} />} />
        <Route path="private/:chatPartner" element={<PrivateChatWrapper messages={messages} users={users} username={username} sendMessage={sendMessage} connectionStatus={connectionStatus} onChatPartnerChange={handleChatPartnerChange} />} />
        
        <Route path="poker" element={<PokerLobby availableGames={pokerGames} onCreateGame={createPokerGame} onJoinGame={joinPokerGame} onRefresh={fetchPokerGames} />} />
        
        <Route
            path="poker/table/:gameId"
            element={
                <PokerTable 
                    pokerState={currentPokerGame}
                    myHand={myPokerHand}
                    username={username}
                    onPokerAction={sendPokerAction}
                    onStartGame={startPokerGame}
                    onNewHand={startNewHand}
                    onLeaveGame={leavePokerGame}
                />
            }
        />
      </Route>      
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;