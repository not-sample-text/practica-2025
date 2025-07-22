import React, { useState, useEffect } from "react";
import "../stylecomponents/GroupChatModal.css";

const GroupChatModal = ({ 
  users, 
  onCreateGroup, 
  onClose,
  initialSelectedUsers = [],
  initialGroupName = "",
  onSelectionChange,
  onNameChange,
  onClearSelections
}) => {
  const [groupName, setGroupName] = useState(initialGroupName);
  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [error, setError] = useState("");

  // Update parent when selections change
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedUsers);
    }
  }, [selectedUsers, onSelectionChange]);

  // Update parent when name changes
  useEffect(() => {
    if (onNameChange) {
      onNameChange(groupName);
    }
  }, [groupName, onNameChange]);

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
    // Note: Don't clear state here, let parent handle it
  };

  const handleClearAll = () => {
    setGroupName("");
    setSelectedUsers([]);
    setError("");
    if (onClearSelections) {
      onClearSelections();
    }
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
            <div className="selection-header">
              <label>Select Users ({selectedUsers.length} selected):</label>
              {(selectedUsers.length > 0 || groupName) && (
                <button 
                  className="clear-all-btn"
                  onClick={handleClearAll}
                  title="Clear all selections"
                >
                  Clear All
                </button>
              )}
            </div>
            
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

          {selectedUsers.length > 0 && (
            <div className="selected-users-preview">
              <h4>Selected Users:</h4>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <span key={user} className="selected-user-tag">
                    {user}
                    <button
                      onClick={() => handleUserToggle(user)}
                      className="remove-user-btn"
                      title={`Remove ${user}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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