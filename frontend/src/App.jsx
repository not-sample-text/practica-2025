import "./App.css";
import React, { useEffect, useRef } from "react";
import Login from "./components/Login";
import Header from "./components/Header";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!getTokenFromCookie());
  const [username, setUsername] = React.useState(null);
  const websocketRef = useRef(null);
  const [messages, setMessages] = React.useState([]);
  const [connectionStatus, setConnectionStatus] = React.useState('disconnected');

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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3000/ws`;
    
    websocketRef.current = new WebSocket(wsUrl);
    
    websocketRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };

    websocketRef.current.onmessage = (event) => {
      const message = event.data;
      setMessages(prev => [...prev, message]);
    };

    websocketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(message);
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
      const response = await fetch('/logout', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear local state
        setIsLoggedIn(false);
        setUsername(null);
        setMessages([]);
        
        // Close WebSocket connection
        disconnectWebSocket();
        
        // Clear token cookie on client side as well
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        console.log('Logged out successfully');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if server call fails
      setIsLoggedIn(false);
      setUsername(null);
      setMessages([]);
      disconnectWebSocket();
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  return isLoggedIn ? (
    <Header 
      username={username}
      onLogout={handleLogout}
      messages={messages}
      sendMessage={sendMessage}
      connectionStatus={connectionStatus}
    />
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
