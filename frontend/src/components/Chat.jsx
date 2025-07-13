import React, { useState, useEffect, useRef } from "react";
import { getTokenFromCookie } from "../helpers/getTokenFromCookie";
import { decodeJWTPayload } from "../helpers/decodeJWTPayload";
import { Link } from "react-router-dom";
import "./Chat.css";

const Chat = ({ openChat, messages, sendMessage, currentUser }) => {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if(newMessage.trim()){
            sendMessage(newMessage);
            setNewMessage("");
        }
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <button className="close-chat" onClick={() => openChat(false)}>X</button>
                <h2>Chat Room</h2>
            </div>
            <div className="chat-messages">
            {
                messages.map((msg, index) => {
                    const isSelf = msg.sender === currentUser;
                    const messageClass = isSelf ? "message self" : "message";
                    return (
                        <div key={index} className={`chat-message ${messageClass}`}>
                            {isSelf ? <span className="sender">You:</span> : <span className="sender">{msg.sender}:</span>}
                            <span className="message-content">{msg.content}</span>
                            <span className="timestamp">{msg.timestamp}</span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input type="text" 
                placeholder="Scrie un mesaj" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={(e) => {
                    if(e.key === 'Enter'){
                        handleSend();
                    }
                }}
                />
            </div>
            <div className="chat-footer">
                <button type="submit" onClick={handleSend}>Trimite</button>
            </div>
        </div>
    );
};

export default Chat;