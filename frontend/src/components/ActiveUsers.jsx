import React from "react";

const ActiveUsers = ({ users, newMessages=[] }) => {
  if (!users || users.length === 0) {
    return <div>No active users.</div>;
  }
  return (
    <div className="overflow-auto container-fluid">
      <h5>Active Users</h5>
      <ul>
        <li><a href="">broadcast</a></li>
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
