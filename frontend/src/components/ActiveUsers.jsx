import React from "react";
import { DEFAULT_JOIN_ROOM } from "../../../shared/constants";

const ActiveUsers = ({ users, unreadMessages = [], chatContext, setChatContext, loadMessageHistory }) => {
  if (!users || users.length === 0) {
    return <div>No active users.</div>;
  }
  return (
    <div>
      <ul>
        {users.map((user, idx) => (
          <li key={user || idx}>
            <a onClick={() => {
              const newContext = chatContext === user ? DEFAULT_JOIN_ROOM : user
              setChatContext(newContext)
              loadMessageHistory(newContext)
              const i = unreadMessages.indexOf(user);
              if (i !== -1) unreadMessages.splice(i, 1);
            }}>
              {user} {unreadMessages.includes(user) && <button>•</button>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveUsers;
