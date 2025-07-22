import React, { useState } from "react";
import "../stylecomponents/ActiveUsers.css";

const ActiveUsers = ({
  users = [],
  currentUsername,
  onStartPrivateChat,
  onStartGroupChat,
  onInviteToGame, // New prop for game invitations
  activePrivateChats = [],
  sentGameInvitations = [] // New prop for sent game invitations
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  if (!users || users.length === 0) {
    return (
      <div className="active-users-container">
        <div className="no-users">No active users.</div>
      </div>
    );
  }

  const handleUserClick = (username) => {
    if (username === currentUsername) return;

    if (isSelectionMode) {
      setSelectedUsers(prev => 
        prev.includes(username) 
          ? prev.filter(u => u !== username)
          : [...prev, username]
      );
    } else {
      onStartPrivateChat(username);
    }
  };

  // New function to handle game invitations
  const handleGameInvite = (username, event) => {
    event.stopPropagation(); // Prevent triggering user click
    if (username !== currentUsername) {
      onInviteToGame(username);
    }
  };

  const handleStartGroupChat = () => {
    if (selectedUsers.length > 0) {
      onStartGroupChat();
      setSelectedUsers([]);
      setIsSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedUsers([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedUsers([]);
  };

  const isCurrentUser = (username) => username === currentUsername;
  const hasActiveChat = (username) => activePrivateChats.includes(username);
  const isSelected = (username) => selectedUsers.includes(username);
  const hasPendingGameInvite = (username) => 
    sentGameInvitations.some(inv => inv.to === username);

  const otherUsers = users.filter(user => user !== currentUsername);

  return (
    <div className="active-users-container">
      <div className="active-users-header">
        <h3 className="active-users-title">Active Users ({users.length})</h3>
        
        <div className="user-actions">
          {!isSelectionMode ? (
            <button 
              className="group-chat-btn"
              onClick={toggleSelectionMode}
              disabled={otherUsers.length < 2}
              title="Start group chat"
            >
              👥
            </button>
          ) : (
            <div className="selection-actions">
              <button
                className="confirm-group-btn"
                onClick={handleStartGroupChat}
                disabled={selectedUsers.length === 0}
                title="Create group chat"
              >
                ✓
              </button>
              <button
                className="cancel-selection-btn"
                onClick={handleCancelSelection}
                title="Cancel selection"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {isSelectionMode && (
        <div className="selection-info">
          <p>Choose users for group chat ({selectedUsers.length} selected)</p>
        </div>
      )}

      <div className="users-list">
        {users.map((user, idx) => (
          <div
            key={user || idx}
            className={`user-item ${
              isCurrentUser(user) ? 'current-user' : 'other-user'
            } ${hasActiveChat(user) ? 'active-chat' : ''} ${
              isSelected(user) ? 'selected' : ''
            } ${isSelectionMode ? 'selection-mode' : ''}`}
            onClick={() => handleUserClick(user)}
            style={{
              cursor: isCurrentUser(user) ? 'default' : 'pointer',
              opacity: isCurrentUser(user) ? 0.7 : 1
            }}
            title={
              isCurrentUser(user) 
                ? 'You' 
                : isSelectionMode 
                  ? `${isSelected(user) ? 'Deselect' : 'Select'} ${user}`
                  : `Click to start private chat with ${user}`
            }
          >
            <div className="user-avatar-container">
              <img
                src={`https://ui-avatars.com/api/?name=${user}&background=random&size=40`}
                alt={user}
                className="user-avatar"
              />
              <div className="online-indicator"></div>
              
              {hasActiveChat(user) && !isSelectionMode && (
                <div className="active-chat-indicator" title="Active private chat">
                  💬
                </div>
              )}
              
              {hasPendingGameInvite(user) && !isSelectionMode && (
                <div className="game-invite-indicator" title="Game invitation sent">
                  🎮
                </div>
              )}
              
              {isSelectionMode && isSelected(user) && (
                <div className="selection-indicator">
                  ✓
                </div>
              )}
            </div>
            
            <div className="user-info">
              <span className="username">
                {isCurrentUser(user) ? `${user} (You)` : user}
              </span>
              <span className="status">
                {isCurrentUser(user) ? 'Online' : 'Online •'}
              </span>
            </div>

            {/* Game invitation button */}
            {!isCurrentUser(user) && !isSelectionMode && (
              <div className="user-actions-buttons">
                <button
                  className={`game-invite-btn ${hasPendingGameInvite(user) ? 'pending' : ''}`}
                  onClick={(e) => handleGameInvite(user, e)}
                  disabled={hasPendingGameInvite(user)}
                  title={
                    hasPendingGameInvite(user) 
                      ? 'Game invitation already sent' 
                      : 'Invite to play Tic-Tac-Toe'
                  }
                >
                  🎮
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedUsers.length > 0 && (
        <div className="selected-users-preview">
          <h4>Selected Users:</h4>
          <div className="selected-users-list">
            {selectedUsers.map(user => (
              <span key={user} className="selected-user-tag">
                {user}
                <button
                  onClick={() => setSelectedUsers(prev => prev.filter(u => u !== user))}
                  className="remove-user-btn"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;