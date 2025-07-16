import React, { useState, useEffect } from "react";

const Header = ({ onLogout, connectionStatus }) => {
  const [username, setUsername] = useState("");

  // Get username from JWT token
  const getUsernameFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "Unknown User";
    } catch (error) {
      return "Unknown User";
    }
  };

  // Get token from cookie
  const getTokenFromCookie = () => {
    const match = document.cookie.match(/token=([^;]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const token = getTokenFromCookie();
    if (token) {
      const extractedUsername = getUsernameFromToken(token);
      setUsername(extractedUsername);
    }
  }, []);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#43e97b";
      case "disconnected":
        return "#dc3545";
      case "error":
        return "#fd7e14";
      default:
        return "#6c757d";
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0.5rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #eee',
      fontSize: 16
    }}>
      <span style={{ marginRight: 16, color: '#333' }}>Salut, <b>{username}</b></span>
      <span
        style={{
          marginLeft: 8,
          color: getConnectionStatusColor(),
          fontWeight: 'bold',
          fontSize: '0.95rem',
        }}
      >
        ● {connectionStatus.toUpperCase()}
      </span>
    </div>
  );
};

export default Header;
