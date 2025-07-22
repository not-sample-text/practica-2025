import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';

const RoomChat = ({
  messages,
  username,
  connectionStatus,
  sendMessage,
  availableRooms,
  joinedRooms,
  usersInRooms,
  onJoinRoom,
  onCreateRoom,
  onLeaveRoom
}) => {
  const { roomName } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef(null);

  const currentRoomUserCount = usersInRooms.get(roomName) || 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentRoomMessages = useMemo(() => {
    if (!roomName) return [];
    return messages.filter(msg =>
      msg.type === 'room_message' && msg.room.toLowerCase() === roomName.toLowerCase()
    );
  }, [messages, roomName]);

  useEffect(() => {
    scrollToBottom();
  }, [currentRoomMessages, roomName]);

  
  useEffect(() => {
    setNewMessage('');
  }, [roomName]);


  const handleSendMessage = () => {
    if (newMessage.trim() && connectionStatus === 'connected' && roomName) {
      const messageObject = {
        type: 'sendRoomMessage',
        room: roomName,
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

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim());
      setNewRoomName('');
    }
  };

  const handleJoinRoom = (roomToJoin) => {
    onJoinRoom(roomToJoin);
  };

  const handleLeaveRoom = () => {
    if (roomName && onLeaveRoom) {
      onLeaveRoom(roomName);
    }
  };

  const isUserInCurrentRoom = roomName && joinedRooms.includes(roomName);

  return (
    <div className="d-flex h-100">
      <aside className="d-flex flex-column flex-shrink-0 p-3 bg-white border-end" style={{ width: '280px' }}>
        <h5 className="mb-3 d-flex align-items-center">
            <i className="bi bi-door-open-fill me-2"></i> Camere
        </h5>
        
        <div className="mb-3">
          <label htmlFor="newRoomNameInput" className="form-label small text-muted">Creează o cameră nouă</label>
          <div className="input-group input-group-sm">
            <input
              type="text"
              id="newRoomNameInput"
              className="form-control"
              placeholder="Nume cameră..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              disabled={connectionStatus !== 'connected'}
            />
          
            <button
              className="btn btn-outline-success"
              onClick={handleCreateRoom}
              disabled={connectionStatus !== 'connected' || !newRoomName.trim()}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
            <input 
            className="input-group input-group-sm mt-2"
            type='text'
            id='passwordInput'
            placeholder='Parolă (opțional)'
            disabled
            ></input>
        </div>

        <hr />
        
        <h6 className="mb-2 text-muted">Camerele mele</h6>
        <ul className="nav nav-pills flex-column mb-3 overflow-auto" style={{ maxHeight: '200px' }}>
          {joinedRooms && joinedRooms.length > 0 ? joinedRooms.map(room => (
            <li className="nav-item" key={room}>
              <NavLink to={`/home/rooms/${room}`} className="nav-link text-truncate d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots"></i> {room}
                {roomName === room && currentRoomUserCount > 0 &&
                  <span className="badge bg-secondary ms-auto">{currentRoomUserCount}</span>}
              </NavLink>
            </li>
          )) : <span className="text-muted small fst-italic px-2">Nu ai intrat în nicio cameră.</span>}
        </ul>

        <hr />

        <h6 className="mb-2 text-muted">Camere disponibile</h6>
        <ul className="nav nav-pills flex-column mb-auto overflow-auto" style={{ maxHeight: 'calc(100% - 400px)' }}>
          {availableRooms && availableRooms.length > 0 ? (
            availableRooms.filter(room => !joinedRooms.includes(room)).map(room => (
              <li className="nav-item" key={room}>
                <button
                  className="nav-link text-start w-100 text-truncate d-flex align-items-center gap-2"
                  onClick={() => handleJoinRoom(room)}
                  disabled={connectionStatus !== 'connected'}
                >
                  <i className="bi bi-door-closed"></i> {room}
                </button>
              </li>
            ))
          ) : (
            <span className="text-muted small fst-italic px-2">Nicio cameră disponibilă.</span>
          )}
        </ul>
      </aside>

      <main className="flex-grow-1 d-flex flex-column">
        {roomName ? (
          <div className="d-flex flex-column h-100 bg-light">
            <header className="p-3 border-bottom bg-white shadow-sm d-flex align-items-center justify-content-between">
              <h4 className="m-0 fw-semibold">Cameră: {roomName}</h4>
              {isUserInCurrentRoom && currentRoomUserCount > 0 && (
                <span className="badge bg-info text-dark ms-3">
                  <i className="bi bi-people-fill me-1"></i> {currentRoomUserCount} Utilizatori
                </span>
              )}
              <div className="ms-auto">
                  {!isUserInCurrentRoom ? (
                    <button
                      className="btn btn-success btn-sm rounded-pill px-3"
                      onClick={() => handleJoinRoom(roomName)}
                      disabled={connectionStatus !== 'connected'}
                    >
                      <i className="bi bi-box-arrow-in-right me-1"></i> Intră în cameră
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-danger btn-sm rounded-pill px-3"
                      onClick={handleLeaveRoom}
                      disabled={connectionStatus !== 'connected'}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Ieși din cameră
                    </button>
                  )}
              </div>
            </header>
            
            {isUserInCurrentRoom ? (
                <>
                <div className="flex-grow-1 p-3 p-md-4 overflow-y-auto" style={{ minHeight: 0 }}>
                    <div className="w-100 mx-auto" style={{ maxWidth: '800px' }}>
                        {currentRoomMessages.length === 0 ? (
                            <div className="text-center text-muted mt-5">
                                <p className="fs-5">
                                    <i className="bi bi-chat-dots-fill me-2"></i>
                                    Niciun mesaj încă în această cameră. Fii primul!
                                </p>
                            </div>
                        ) : (
                            currentRoomMessages.map((message, index) => {
                                const isCurrentUser = message.sender === username;
                                const align = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
                                const bubble = isCurrentUser ? 'bg-primary text-white' : 'bg-white text-dark border';
                                return (
                                    <div key={index} className={`d-flex ${align} mb-3`}>
                                        <div className={`p-3 rounded shadow-sm ${bubble}`} style={{ maxWidth: '75%' }}>
                                            <div className="small fw-semibold mb-1 opacity-75">
                                                {isCurrentUser ? 'Tu' : message.sender}
                                            </div>
                                            <div className="fs-6" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                                                {message.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
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
                                placeholder={`Trimite un mesaj în ${roomName}...`}
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
                </>
            ) : (
                <div className="d-flex h-100 justify-content-center align-items-center text-muted bg-light">
                    <div className="text-center">
                        <i className="bi bi-door-closed-fill fs-1"></i>
                        <h4 className="mt-3">Nu ești în această cameră. Intră pentru a începe să discuți!</h4>
                        <button
                            className="btn btn-success btn-lg mt-3"
                            onClick={() => handleJoinRoom(roomName)}
                            disabled={connectionStatus !== 'connected'}
                        >
                            <i className="bi bi-box-arrow-in-right me-2"></i> Intră în {roomName}
                        </button>
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="d-flex h-100 justify-content-center align-items-center text-muted bg-light">
            <div className="text-center">
              <i className="bi bi-house-door-fill fs-1"></i>
              <h4 className="mt-3">Alege o cameră din listă sau creează una nouă.</h4>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomChat;