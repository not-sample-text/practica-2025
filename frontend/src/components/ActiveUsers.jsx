import React from "react";

const ActiveUsers = ({onChatNameChange, users, newMessages=[] }) => {
  if (!users || users.length === 0) {
    return <div>No active users.</div>;
  }
  return (
    <div>
      <ul>
        <li>
          <span onClick={() => onChatNameChange("Global")}>Global Chat</span>
        </li>
        {users.map((user, idx) => (
          <li key={user || idx}>
            <span onClick={() => onChatNameChange(user)}>
              {user} {newMessages.includes(user) && <button>•</button>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveUsers;
