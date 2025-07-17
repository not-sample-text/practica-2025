import React, { useState, useEffect } from "react";
import "../stylecomponents/Header.css";

const Header = ({ onLogout, connectionStatus }) => {
  const [username, setUsername] = useState("");

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

  // Get token from cookie
  const getTokenFromCookie = () => {
    const match = document.cookie.match(/token=([^;]+)/);
    return match ? match[1] : null;
  };

  // Initialize username on component mount and persist it
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
        return "#28a745";
      case "disconnected":
        return "#dc3545";
      case "error":
        return "#fd7e14";
      default:
        return "#6c757d";
    }
  };

  return (
    <nav className="header-nav">
      <div className="nav-left">
        <strong>Joc</strong>
      </div>
      <div className="nav-right">
        <div className="user-info">
          <div className="user-avatar">
            <img 
              src={`https://ui-avatars.com/api/?name=${username}&background=007bff&color=fff&size=32`} 
              alt={username}
              className="avatar-img"
            />
          </div>
          <span className="username">Salut, {username}</span>
        </div>
        <div className="connection-status">
          <span
            className="status-indicator"
            style={{ color: getConnectionStatusColor() }}
          >
            ● {connectionStatus.toUpperCase()}
          </span>
        </div>
        <button 
          onClick={onLogout}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Header;