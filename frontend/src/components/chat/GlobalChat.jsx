import React, { useState, useEffect, useRef } from 'react';

const GlobalChat = ({ messages, sendMessage, username, connectionStatus }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="flex-grow-1 p-3 p-md-4 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="w-100 mx-auto" style={{ maxWidth: '800px' }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <p className="fs-5">
                <i className="bi bi-chat-dots-fill me-2"></i>
                Niciun mesaj încă. Fii primul care sparge gheața!
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.username === username;
              const align = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
              const bubble = isCurrentUser ? 'bg-primary text-white' : 'bg-white text-dark border';

              return (
                <div key={index} className={`d-flex ${align} mb-3`}>
                  <div className={`p-3 rounded shadow-sm ${bubble}`} style={{ maxWidth: '75%' }}>
                    <div className="small fw-semibold mb-1 opacity-75">
                      {isCurrentUser ? 'Tu' : message.username}
                    </div>
                    <div className="fs-6" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="py-3 px-4 border-top bg-white shadow-lg flex-shrink-0">
        <div className="w-100 mx-auto" style={{ maxWidth: '800px' }}>
          <div className="input-group">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrie mesajul tău în chat-ul global..."
              disabled={connectionStatus !== 'connected'}
              className="form-control form-control-lg rounded-pill me-2"
            />
            <button
              onClick={handleSendMessage}
              disabled={connectionStatus !== 'connected' || !newMessage.trim()}
              className="btn btn-primary rounded-pill px-4 fs-5"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;