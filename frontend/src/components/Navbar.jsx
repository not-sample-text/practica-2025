

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'Unknown User';
  } catch (error) {
    return 'Unknown User';
  }
};

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

const Navbar = ({ onLogout, isLoggedIn }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      const token = getTokenFromCookie();
      if (token) {
        setUsername(getUsernameFromToken(token));
      }
    } else {
      setUsername('');
    }
  }, [isLoggedIn]);

  return (
    <nav style={{
      width: '100vw',
      left: 0,
      top: 0,
      background: '#6c63ff',
      color: '#fff',
      padding: '0.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/app" style={{ color: '#fff', fontWeight: 700, fontSize: 22, textDecoration: 'none', letterSpacing: 1 }}>JOC</Link>
        <Link to="/app" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500, marginLeft: 16 }}>Home</Link>
        <Link to="/app/game" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500, marginLeft: 16 }}>Game</Link>
        <Link to="/app/about" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500, marginLeft: 16 }}>About</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isLoggedIn && (
          <span style={{ marginRight: 8, color: '#fff', fontWeight: 500 }}>
            Salut, <b>{username}</b>
          </span>
        )}
        {isLoggedIn ? (
          <button
            style={{
              background: '#fff',
              color: '#6c63ff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.5rem',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 1px 4px #6c63ff22',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={onLogout}
          >Logout</button>
        ) : (
          <>
            <button style={{ marginRight: 8 }} onClick={() => navigate('/login')}>Sign In</button>
            <button onClick={() => navigate('/register')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
