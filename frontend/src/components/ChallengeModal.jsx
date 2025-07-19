
// export default Modal;
import React from 'react';
import '../styles/ChallengeModal.css';

const ChallengeModal = ({ user, isOpen, onClose, onAccept, onReject }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Challenge</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p>You have been challenged by <strong>{user}</strong>.</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="action-button reject-button"
            onClick={onReject}
          >
            Reject
          </button>
          <button
            className="action-button accept-button"
            onClick={ onAccept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
