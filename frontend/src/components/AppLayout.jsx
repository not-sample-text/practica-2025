import React, { useEffect, useRef, useState } from "react";
import Chat from "./chat/Chat";
import ActiveUsers from "./chat/ActiveUsers";
import Header from "./Header";
import Navbar from "./Navbar";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

const AppLayout = () => {
  const [username, setUsername] = useState(() => {
    const token = getTokenFromCookie();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const websocketRef = useRef(null);
  const [invite, setInvite] = useState(null);
  const [gamename, setGamename] = useState("");
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [selectedUser, setSelectedUser] = useState(null); // For private chat

  useEffect(() => {
    const token = getTokenFromCookie();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch {
        setUsername(null);
      }
      connectWebSocket();
    } else {
      setUsername(null);
      disconnectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
    // eslint-disable-next-line
  }, []);

  const connectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port = location.port === "80" || location.port === "443" ? "" : `:${location.port}`;
    const wsUrl = `${protocol}//${window.location.hostname}${port}/ws`;
    websocketRef.current = new window.WebSocket(wsUrl);
    websocketRef.current.onopen = () => setConnectionStatus("connected");
    websocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { username, from, type, content, chatname, game } = data;
        switch (type) {
          case "private":
            setNewMessages((prev) => [...prev, username]);
            setMessages((prev) => [...prev, { type: 'private', content, username, chatname }]);
            break;
          case "invite":
            // Use 'from' if present, else fallback to 'username'
            setInvite({ from: from || username, game });
            break;  
          case "broadcast":
            setMessages((prev) => [...prev, { type: 'broadcast', content, username }]);
            break;
          case "usernames":
            setUsers(content);
            break;
          default:
            return;
        }
      } catch (e) {
        return;
      }
    };
    websocketRef.current.onclose = () => setConnectionStatus("disconnected");
    websocketRef.current.onerror = () => setConnectionStatus("error");
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setConnectionStatus("disconnected");
  };

  const sendMessage = (message) => {
    if (websocketRef.current && websocketRef.current.readyState === window.WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "GET", credentials: "include" });
    } finally {
      setUsername(null);
      setMessages([]);
      disconnectWebSocket();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
  };

  // Send invite via websocket
  const handleSendInvite = (user, game = 'tictactoe') => {
    if (websocketRef.current && websocketRef.current.readyState === window.WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'invite', gamewith: user, gamename: game }));
    }
  };

  // Accept/decline invitation
  const handleInvitationResponse = (from, response) => {
    if (websocketRef.current && websocketRef.current.readyState === window.WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'invitationresponse', gamewith: from, response }));
    }
    setInvite(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onLogout={handleLogout}
        isLoggedIn={!!getTokenFromCookie()}
        activeUsers={users}
        onSendInvite={handleSendInvite}
      />
      {/* Invitation popup for receiving invites */}
      {invite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '2rem',
            minWidth: 320,
            boxShadow: '0 4px 24px #0002',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h3 style={{ marginBottom: 24 }}>{invite.from} invited you to play {invite.game || 'a game'}!</h3>
            <button onClick={() => setInvite(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
              <button
                style={{ background: '#43e97b', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                onClick={() => handleInvitationResponse(invite.from, 'accept')}
              >Accept</button>
              <button
                style={{ background: '#ff6584', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                onClick={() => handleInvitationResponse(invite.from, 'decline')}
              >Decline</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar for Active Users */}
        <aside style={{ width: 250, background: '#f5f6fa', borderRight: '1px solid #e0e0e0', padding: '1rem 0', overflowY: 'auto' }}>
          <ActiveUsers users={users} newMessages={newMessages} onUserClick={setSelectedUser} selectedUser={selectedUser} />
        </aside>
        {/* Chat Area, now directly next to users */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Chat
            username={username}
            messages={messages}
            sendMessage={sendMessage}
            connectionStatus={connectionStatus}
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>
      </div>
    </div>
  );
};

export default AppLayout; 