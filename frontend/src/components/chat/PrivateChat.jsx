import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';

const PrivateChat = ({ messages, users, username, sendMessage, connectionStatus }) => {
    const { chatPartner } = useParams();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const conversations = useMemo(() => {
        const conversedWith = new Set();
        messages.forEach(msg => {
            if (msg.type === 'private_message') {
                if (msg.sender === username) msg.to && conversedWith.add(msg.to);
                if (msg.to === username) msg.sender && conversedWith.add(msg.sender);
            }
        });
        conversedWith.delete(username);
        return Array.from(conversedWith);
    }, [messages, username]);

    const onlineUsersWithoutConversation = users.filter(user => user !== username && !conversations.includes(user));

    const privateMessages = useMemo(() => {
        if (!chatPartner) return [];
        return messages.filter(msg =>
            msg.type === 'private_message' &&
            ((msg.sender === username && msg.to === chatPartner) || (msg.sender === chatPartner && msg.to === username))
        );
    }, [messages, username, chatPartner]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [privateMessages, chatPartner]);

    useEffect(() => {
        setNewMessage('');
    }, [chatPartner]);

    const handleSendMessage = () => {
        if (newMessage.trim() && connectionStatus === 'connected' && chatPartner) {
            const messageObject = {
                type: 'private_message',
                to: chatPartner,
                text: newMessage
            };
            sendMessage(messageObject);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="d-flex h-100">
            <aside className="d-flex flex-column flex-shrink-0 p-3 bg-white border-end" style={{ width: '280px' }}>
                <h5 className="mb-3">Conversații</h5>
                <ul className="nav nav-pills flex-column mb-auto">
                    {conversations.length > 0 ? conversations.map(user => (
                        <li className="nav-item" key={user}>
                            <NavLink to={`/home/private/${user}`} className="nav-link text-truncate d-flex align-items-center gap-2">
                                <i className="bi bi-person-check-fill"></i>
                                {user}
                            </NavLink>
                        </li>
                    )) : <span className="text-muted small fst-italic px-2">Nicio conversație.</span>}
                </ul>
                <hr />
                <h5 className="mb-3">Utilizatori Online</h5>
                <ul className="nav nav-pills flex-column mb-auto">
                     {onlineUsersWithoutConversation.map(user => (
                        <li className="nav-item" key={user}>
                             <NavLink to={`/home/private/${user}`} className="nav-link text-truncate d-flex align-items-center gap-2">
                                <i className="bi bi-person"></i>
                                {user}
                            </NavLink>
                        </li>
                    ))}
                     {onlineUsersWithoutConversation.length === 0 && <span className="text-muted small fst-italic px-2">Niciun alt utilizator.</span>}
                </ul>
            </aside>

            <main className="flex-grow-1 d-flex flex-column">
                {chatPartner ? (
                    <div className="d-flex flex-column h-100 bg-light">
                        <header className="p-3 border-bottom bg-white shadow-sm">
                            <h4 className="m-0 fw-semibold">Conversație cu: {chatPartner}</h4>
                        </header>
                        <div className="flex-grow-1 p-3 p-md-4 overflow-y-auto" style={{ minHeight: 0 }}>
                            <div className="w-100 mx-auto" style={{ maxWidth: '800px' }}>
                                {privateMessages.map((message, index) => {
                                    const isCurrentUser = message.sender === username;
                                    const align = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
                                    const bubble = isCurrentUser ? 'bg-primary text-white' : 'bg-white text-dark border';
                                    return (
                                        <div key={index} className={`d-flex ${align} mb-3`}>
                                            <div className={`p-3 rounded shadow-sm ${bubble}`} style={{ maxWidth: '75%' }}>
                                                <div className="fs-6" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                    {message.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        <footer className="py-3 px-4 border-top bg-white shadow-lg flex-shrink-0">
                            <div className="w-100 mx-auto" style={{ maxWidth: '800px' }}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={`Trimite un mesaj privat lui ${chatPartner}...`}
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
                        </footer>
                    </div>
                ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-muted bg-light">
                        <div className="text-center">
                            <i className="bi bi-people-fill fs-1"></i>
                            <h4 className="mt-3">Alege o persoană pentru a începe o conversație.</h4>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PrivateChat;