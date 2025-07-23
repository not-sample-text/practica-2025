import React, { useState } from 'react';

const UserGameInvite = ({ 
  users = [], 
  currentUsername, 
  onInviteUser, 
  sentInvitations = [],
  onCancelInvitation 
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  const availableUsers = users.filter(user => 
    user !== currentUsername && 
    !sentInvitations.some(inv => inv.to === user)
  );

  const handleInviteClick = () => {
    if (availableUsers.length === 0) {
      alert('No users available to invite!');
      return;
    }
    setShowInviteModal(true);
  };

  const handleSendInvite = () => {
    if (selectedUser) {
      onInviteUser(selectedUser);
      setSelectedUser('');
      setShowInviteModal(false);
    }
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="user-game-invite">
      {/* Invite Button */}
      <button 
        className="invite-game-btn"
        onClick={handleInviteClick}
        disabled={availableUsers.length === 0}
        title="Invite user to play Tic-Tac-Toe"
      >
        🎮 Invite to Game
      </button>

      {/* Sent Invitations Display */}
      {sentInvitations.length > 0 && (
        <div className="sent-invitations-display">
          <h4>Pending Game Invitations</h4>
          {sentInvitations.map(invitation => (
            <div key={invitation.id} className="sent-invitation-item">
              <div className="invitation-info">
                <span className="invitation-user">
                  ⏳ {invitation.to}
                </span>
                <span className="invitation-timer">
                  {formatTime(invitation.timeLeft)}
                </span>
              </div>
              <button 
                className="cancel-invitation"
                onClick={() => onCancelInvitation(invitation.id, invitation.to)}
                title="Cancel invitation"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="invite-modal-overlay">
          <div className="invite-modal">
            <div className="modal-header">
              <h3>🎮 Invite User to Tic-Tac-Toe</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Select a user to invite:</p>
              <div className="user-selection">
                {availableUsers.map(user => (
                  <label key={user} className="user-option">
                    <input
                      type="radio"
                      name="selectedUser"
                      value={user}
                      checked={selectedUser === user}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    />
                    <div className="user-info">
                      <img
                        src={`https://ui-avatars.com/api/?name=${user}&background=random&size=32`}
                        alt={user}
                        className="user-avatar-small"
                      />
                      <span>{user}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-invite-btn"
                onClick={handleSendInvite}
                disabled={!selectedUser}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-game-invite {
          margin: 15px 0;
        }

        .invite-game-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 0.95em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          width: 100%;
        }

        .invite-game-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .invite-game-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .sent-invitations-display {
          margin-top: 15px;
          padding: 12px;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
        }

        .sent-invitations-display h4 {
          margin: 0 0 10px 0;
          color: #856404;
          font-size: 0.9em;
        }

        .sent-invitation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin-bottom: 8px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .sent-invitation-item:last-child {
          margin-bottom: 0;
        }

        .invitation-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .invitation-user {
          font-weight: 600;
          color: #333;
        }

        .invitation-timer {
          font-size: 0.85em;
          color: #666;
          font-family: monospace;
        }

        .cancel-invitation {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.8em;
          transition: background-color 0.2s;
        }

        .cancel-invitation:hover {
          background: #c82333;
        }

        .invite-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }

        .invite-modal {
          background: white;
          border-radius: 12px;
          padding: 0;
          min-width: 300px;
          max-width: 90vw;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.2em;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5em;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background: #f0f0f0;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-body p {
          margin: 0 0 15px 0;
          color: #666;
        }

        .user-selection {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-option:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .user-option input[type="radio"] {
          margin: 0;
        }

        .user-option input[type="radio"]:checked + .user-info {
          color: #667eea;
          font-weight: 600;
        }

        .user-option:has(input[type="radio"]:checked) {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .send-invite-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 600;
        }

        .send-invite-btn:hover:not(:disabled) {
          background: #218838;
        }

        .send-invite-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .invite-modal {
            margin: 20px;
            min-width: auto;
            max-width: none;
          }
          
          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 15px;
          }
          
          .user-option {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserGameInvite;