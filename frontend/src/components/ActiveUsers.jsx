import React from "react";

const ActiveUsers = ({ users, newMessages=[] }) => {
  if (!users || users.length === 0) {
    return <div>No active users.</div>;
  }
  return (
    <div>
      <ul>
        {users.map((user, idx) => (
          <li key={user || idx}>
            <a href={`http://${user}`}>
            {user} {newMessages.includes(user) && <button>•</button>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveUsers;
