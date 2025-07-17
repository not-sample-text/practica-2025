import React, { useState } from "react";
import "../stylecomponents/GroupChatModal.css";

const GroupChatModal = ({ users, onCreateGroup, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState("");

  const handleUserToggle = (username) => {
    setSelectedUsers(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    onCreateGroup(groupName.trim(), selectedUsers);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateGroup();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="group-chat-modal">
        <div className="modal-header">
          <h3>Create Group Chat</h3>
          <button className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="group-name-section">
            <label htmlFor="group-name">Group Name:</label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter group name..."
              className="group-name-input"
              maxLength={50}
            />
          </div>

          <div className="users-selection-section">
            <label>Select Users ({selectedUsers.length} selected):</label>
            <div className="users-grid">
              {users.map(user => (
                <div
                  key={user}
                  className={`user-selection-item ${
                    selectedUsers.includes(user) ? 'selected' : ''
                  }`}
                  onClick={() => handleUserToggle(user)}
                >
                  <div className="user-avatar-small">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user}&background=random&size=32`}
                      alt={user}
                    />
                    {selectedUsers.includes(user) && (
                      <div className="selection-check">✓</div>
                    )}
                  </div>
                  <span className="user-name">{user}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="create-btn" 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0}
          >
            Create Group ({selectedUsers.length} members)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;