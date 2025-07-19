

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


const InviteModal = ({ users, onClose, onInvite }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '2rem',
        minWidth: 320,
        boxShadow: '0 4px 24px #0002',
        textAlign: 'center',
        position: 'relative'
      }}>
        <h3 style={{ marginBottom: 24 }}>Choose a player to invite to a tic tac toe game</h3>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {users && users.length > 0 ? users.map(user => (
            <li key={user} style={{ marginBottom: 12 }}>
              <button
                style={{
                  background: '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 1.5rem',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px #6c63ff22',
                  transition: 'background 0.2s, color 0.2s'
                }}
                onClick={() => onInvite(user)}
              >{user}</button>
            </li>
          )) : <li style={{ color: '#888' }}>No active users</li>}
        </ul>
      </div>
    </div>
  );
};

const Navbar = ({ onLogout, isLoggedIn, activeUsers = [], onSendInvite }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [gameDropdown, setGameDropdown] = useState(false);
  const [newGameDropdown, setNewGameDropdown] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  const handleSendInvite = (gameWith) => {
    setShowInviteModal(false);
    if (onSendInvite) onSendInvite(gameWith);
  };


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
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
        <Link to="/app" style={{ color: '#fff', fontWeight: 700, fontSize: 22, textDecoration: 'none', letterSpacing: 1 }}>JOC</Link>
        <Link to="/app" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500, marginLeft: 16 }}>Home</Link>
        <div style={{ position: 'relative', marginLeft: 16 }}>
          <button
            style={{
              background: 'none',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
              fontSize: 16,
              cursor: 'pointer',
              padding: 0
            }}
            onClick={e => e.preventDefault()}
            onMouseEnter={() => setGameDropdown(true)}
            onMouseLeave={() => setGameDropdown(false)}
          >
            Game
          </button>
          {gameDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#fff',
                color: '#333',
                minWidth: 140,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: 6,
                zIndex: 200,
                padding: '0.5rem 0'
              }}
              onMouseEnter={() => setGameDropdown(true)}
              onMouseLeave={() => setGameDropdown(false)}
            >
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setNewGameDropdown(true)}
                onMouseLeave={() => setNewGameDropdown(false)}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#333',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: 15
                  }}
                  onClick={e => e.preventDefault()}
                >
                  New Game ▶
                </button>
                {newGameDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '100%',
                      background: '#fff',
                      color: '#333',
                      minWidth: 140,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      borderRadius: 6,
                      zIndex: 201,
                      padding: '0.5rem 0'
                    }}
                  >
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#333',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: 15
                      }}
                      onClick={() => setShowInviteModal(true)}
                    >
                      Tic Tac Toe
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
    {showInviteModal && (
      <InviteModal
        users={activeUsers.filter(u => u !== username)}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleSendInvite}
      />
    )}
    </nav>
  );
};

export default Navbar;
