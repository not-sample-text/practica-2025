import React, { useState, useEffect, useRef } from "react";

const Chat = ({
  chatname = "vio",
  username,
  messages,
  sendMessage,
  connectionStatus,
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
        type: chatname === "broadcast" ? "broadcast" : "private",
        chatname,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const toggleChatVisibility = () => {
    setIsChatHidden(!isChatHidden);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden", // Prevent horizontal scrolling
      }}
    >
      {/* Main Chat Container */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          transform: isChatHidden ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.3s ease-in-out",
          position: "relative",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "1rem 2rem",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            minHeight: "70px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "1rem",
                color: "#6c757d",
              }}
            >
              <strong>{chatname}</strong>
            </p>
          </div>
        </header>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            padding: "1rem 2rem",
            overflowY: "auto",
            backgroundColor: "#f8f9fa",
            minHeight: 0, // Important for flex scrolling
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#ea9916ff",
                  marginTop: "2rem",
                  fontSize: "1.1rem",
                }}
              >
                <p>💬 Niciun mesaj încă. Începe conversația.!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isSystemMessage = message.content.includes(
                  "Invalid or expired token"
                );
                const isCurrentUser = message.username === username;

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "0.75rem 1rem",
                        backgroundColor: isSystemMessage
                          ? "#ffebee"
                          : isCurrentUser
                          ? "#007bff"
                          : "#ffffff",
                        color: isSystemMessage
                          ? "#c62828"
                          : isCurrentUser
                          ? "#ffffff"
                          : "#212529",
                        borderRadius: "12px",
                        border: isSystemMessage
                          ? "1px solid #ffcdd2"
                          : isCurrentUser
                          ? "none"
                          : "1px solid #dee2e6",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        wordWrap: "break-word",
                      }}
                    >
                      {isSystemMessage ? (
                        <div
                          style={{ fontStyle: "italic", fontSize: "0.9rem" }}
                        >
                          🔒 System: {message.content}
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              marginBottom: "0.25rem",
                              opacity: 0.9,
                            }}
                          >
                            {isCurrentUser ? "You" : message.username}
                          </div>
                          <div
                            style={{
                              fontSize: "1rem",
                              lineHeight: "1.4",
                            }}
                          >
                            {message.content}
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
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid #dee2e6",
            backgroundColor: "#ffffff",
            boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrie Aici Mesajul..."
                disabled={connectionStatus !== "connected"}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "2px solid #ff9f05ff",
                  borderRadius: "25px",
                  fontSize: "1rem",
                  outline: "none",
                  color: "#212529",
                  transition: "border-color 0.2s",
                  backgroundColor:
                    connectionStatus !== "connected" ? "#f8f9fa" : "#ffffff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ff9900ff")}
                onBlur={(e) => (e.target.style.borderColor = "#dee2e6")}
              />
            </div>
            {connectionStatus !== "connected" && (
              <p
                style={{
                  margin: "0.75rem 0 0 0",
                  color: "#dc3545",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {connectionStatus === "error"
                  ? "❌ Connection error. Please refresh the page."
                  : "🔄 Connecting to chat..."}
              </p>
            )}
          </div>
        </div>

        {/* Toggle Button - Now inside the chat container so it moves with it */}
        <button
          onClick={toggleChatVisibility}
          style={{
            position: "absolute",
            top: "50%",
            right: "-25px", // Always positioned at the right edge of the chat container
            transform: "translateY(-50%)",
            width: "50px",
            height: "50px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "1.2rem",
            fontWeight: "bold",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#0056b3";
            e.target.style.transform = "translateY(-50%) scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#007bff";
            e.target.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          {isChatHidden ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
