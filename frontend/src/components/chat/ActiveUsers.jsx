import React from "react";

const getAvatar = (username) => {
  // Simple avatar: first letter, colored circle
  const colors = ["#6c63ff", "#ff6584", "#43e97b", "#f9d423", "#ffb347"];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: color,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 18,
      marginRight: 12
    }}>{username[0].toUpperCase()}</div>
  );
};

const ActiveUsers = ({ users = [], newMessages = [], onUserClick, selectedUser }) => {
  if (!users || users.length === 0) {
    return <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No active users.</div>;
  }
  return (
    <div style={{ padding: '0 1rem' }}>
      <h3 style={{ fontSize: 18, margin: '0 0 1rem 0', color: '#333', textAlign: 'center' }}>Active Users</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {users.map((user, idx) => (
          <li
            key={user || idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              background: selectedUser === user ? '#e0e7ff' : 'transparent',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: selectedUser === user ? '0 0 0 2px #6c63ff44' : undefined
            }}
            onClick={() => onUserClick && onUserClick(user)}
          >
            {getAvatar(user)}
            <span style={{ fontWeight: 500, color: '#222', flex: 1 }}>{user}</span>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#43e97b',
              marginLeft: 8,
              boxShadow: '0 0 4px #43e97b88'
            }} title="Online"></span>
            {newMessages.includes(user) && <span style={{ marginLeft: 8, color: '#ff6584', fontSize: 18 }}>•</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveUsers;
