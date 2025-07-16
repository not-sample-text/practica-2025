import React, { useState, useEffect } from "react";

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
    <nav>
      <nav>
        <ul>
          <li>
            <strong>Joc</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href="#">Salut, «{username}»</a>
          </li>
          <li>
            <span
                style={{
                  marginLeft: "1rem",
                  color: getConnectionStatusColor(),
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                ● {connectionStatus.toUpperCase()}
              </span>
          </li>
          <li>
            <a href="#">          
              <button 
            onClick={onLogout}
            style={{ 
              padding: '0.26rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            Logout
          </button></a>
          </li>
        </ul>
      </nav>
    </nav>
  );
};

export default Header;
