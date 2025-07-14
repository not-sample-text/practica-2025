import React, { useState, useEffect, useRef } from 'react';

const Header = ({ onLogout, messages, sendMessage, connectionStatus }) => {
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isChatHidden, setIsChatHidden] = useState(false);
  const messagesEndRef = useRef(null);

  // Get username from JWT token
  const getUsernameFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'Unknown User';
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return 'Unknown User';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && connectionStatus === 'connected') {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const parseMessage = (message) => {
    // Format: "token–message" or "token–Invalid or expired token"
    const parts = message.split('–');
    if (parts.length >= 2) {
      const token = parts[0];
      const content = parts.slice(1).join('–');
      
      // Extract username from token instead of showing the token
      const messageUsername = getUsernameFromToken(token);
      
      return { username: messageUsername, content };
    }
    return { username: 'Unknown User', content: message };
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'disconnected': return '#dc3545';
      case 'error': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const toggleChatVisibility = () => {
    setIsChatHidden(!isChatHidden);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'row',
      maxWidth: '100%',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden' // Prevent horizontal scrolling
    }}>
      {/* Main Chat Container */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: isChatHidden ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease-in-out',
        position: 'relative'
      }}>
        {/* Header */}
        <header style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minHeight: '70px'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              color: '#212529',
              fontWeight: '600'
            }}>
              Chat Game
            </h1>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '1rem',
              color: '#6c757d'
            }}>
              Bun Venit, <strong>{username}</strong>! 
              <span style={{ 
                marginLeft: '1rem',
                color: getConnectionStatusColor(),
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                ● {connectionStatus.toUpperCase()}
              </span>
            </p>
          </div>
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
          </button>
        </header>

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          padding: '1rem 2rem',
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          minHeight: 0 // Important for flex scrolling
        }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            width: '100%'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#ea9916ff',
                marginTop: '2rem',
                fontSize: '1.1rem'
              }}>
                <p>💬 Niciun mesaj încă. Începe conversația.!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const parsed = parseMessage(message);
                const isSystemMessage = parsed.content.includes('Invalid or expired token');
                const isCurrentUser = parsed.username === username;
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ 
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      backgroundColor: isSystemMessage ? '#ffebee' : 
                                     isCurrentUser ? '#007bff' : '#ffffff',
                      color: isSystemMessage ? '#c62828' : 
                             isCurrentUser ? '#ffffff' : '#212529',
                      borderRadius: '12px',
                      border: isSystemMessage ? '1px solid #ffcdd2' : 
                              isCurrentUser ? 'none' : '1px solid #dee2e6',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      wordWrap: 'break-word'
                    }}>
                      {isSystemMessage ? (
                        <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                          🔒 System: {parsed.content}
                        </div>
                      ) : (
                        <div>
                          <div style={{ 
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                            opacity: 0.9
                          }}>
                            {isCurrentUser ? 'You' : parsed.username}
                          </div>
                          <div style={{ 
                            fontSize: '1rem',
                            lineHeight: '1.4'
                          }}>
                            {parsed.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div style={{ 
          padding: '1rem 2rem',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#ffffff',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            width: '100%'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrie Aici Mesajul..."
                disabled={connectionStatus !== 'connected'}
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #ff9f05ff',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  outline: 'none',
                  color : '#212529',
                  transition: 'border-color 0.2s',
                  backgroundColor: connectionStatus !== 'connected' ? '#f8f9fa' : '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff9900ff'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
              <button
                onClick={handleSendMessage}
                disabled={connectionStatus !== 'connected' || !newMessage.trim()}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: (connectionStatus === 'connected' && newMessage.trim()) ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: (connectionStatus === 'connected' && newMessage.trim()) ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                  minWidth: '80px'
                }}
              >
                ⮞
              </button>
            </div>
            {connectionStatus !== 'connected' && (
              <p style={{ 
                margin: '0.75rem 0 0 0', 
                color: '#dc3545', 
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {connectionStatus === 'error' ? 
                  '❌ Connection error. Please refresh the page.' : 
                  '🔄 Connecting to chat...'}
              </p>
            )}
          </div>
        </div>

        {/* Toggle Button - Now inside the chat container so it moves with it */}
        <button
          onClick={toggleChatVisibility}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-25px', // Always positioned at the right edge of the chat container
            transform: 'translateY(-50%)',
            width: '50px',
            height: '50px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#0056b3';
            e.target.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          {isChatHidden ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );
};

export default Header;
