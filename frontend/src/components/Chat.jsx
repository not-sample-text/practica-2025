import React, { useState, useEffect, useRef } from "react";
import "../stylecomponents/Chat.css";

const Chat = ({ 
  chatname = "Global Chat", username, messages, sendMessage, connectionStatus,
  isPrivateChat = false,
  onClosePrivateChat = null 
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isChatHidden, setIsChatHidden] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && connectionStatus === "connected") {
      sendMessage({
        type: isPrivateChat ? "private" : "broadcast",
        chatname: isPrivateChat ? chatname : "broadcast",
        content: newMessage,
        recipient: isPrivateChat ? chatname : null,
      });
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const toggleChatVisibility = () => {
    setIsChatHidden(!isChatHidden);
  };

  const getChatTitle = () => {
    if (isPrivateChat) {
      return `💬 ${chatname}`;
    }
    return "🌐 Global Chat";
  };

  return (
    <div className="chat-container">
      <div
        className="chat-panel"
        style={{ transform: isChatHidden ? "translateX(-100%)" : "translateX(0)" }}
      >
        <header className="chat-header">
          <div>
            <p className="chat-header-title">
              <strong>{getChatTitle()}</strong>
            </p>
          </div>
          {isPrivateChat && onClosePrivateChat && (
            <button 
              className="close-chat-btn" 
              onClick={onClosePrivateChat}
              title="Close private chat"
            >
              ✕
            </button>
          )}
        </header>

        <div className="chat-messages">
          <div className="chat-messages-inner">
            {messages.length === 0 ? (
              <div className="chat-no-messages">
                <p>💬 {isPrivateChat ? `No messages with ${chatname} yet.` : "Niciun mesaj încă. Începe conversația.!"}</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isSystemMessage = message.content.includes("Invalid or expired token") || message.type === 'system';
                
                // For private chats, determine if this is the current user's message
                let isCurrentUser;
                if (isPrivateChat) {
                  // Check if this message is from the current user
                  isCurrentUser = message.username === username;
                } else {
                  // For global chat, use the original logic
                  isCurrentUser = message.username === username;
                }

                return (
                  <div
                    key={index}
                    className="chat-message"
                    style={{ justifyContent: isCurrentUser ? "flex-end" : "flex-start" }}
                  >
                    <div
                      className={`chat-message-content ${
                        isSystemMessage
                          ? "chat-message-system"
                          : isCurrentUser
                          ? "chat-message-current-user"
                          : "chat-message-other-user"
                      }`}
                    >
                      {isSystemMessage ? (
                        <>🔒 System: {message.content}</>
                      ) : (
                        <>
                          <div className="chat-message-username">
                            {isCurrentUser ? "You" : message.username}
                          </div>
                          <div className="chat-message-text">{message.content}</div>
                          {message.timestamp && (
                            <div className="chat-message-timestamp">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-input-container">
          <div className="chat-input-inner">
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isPrivateChat ? `Message ${chatname}...` : "Scrie aici..."}
                disabled={connectionStatus !== "connected"}
                onFocus={(e) => (e.target.style.borderColor = "#ff9900ff")}
                onBlur={(e) => (e.target.style.borderColor = "#dee2e6")}
              />
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={connectionStatus !== "connected" || !newMessage.trim()}
              >
                ➤
              </button>
            </div>
            {connectionStatus !== "connected" && (
              <p className="chat-error">
                {connectionStatus === "error"
                  ? "❌ Connection error. Please refresh the page."
                  : "🔄 Connecting to chat..."}
              </p>
            )}
          </div>
        </div>

        <button className="chat-toggle-btn" onClick={toggleChatVisibility}>
          {isChatHidden ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
};

export default Chat;