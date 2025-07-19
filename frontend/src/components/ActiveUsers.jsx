import { React, useState } from "react";
import { useEffect } from "react";

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

// Get username from JWT token
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "Unknown User";
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return "Unknown User";
  }
};

const ActiveUsers = ({ users, newMessages = [], handleSelectChat }) => {

  const loggedInUser = getUsernameFromToken(getTokenFromCookie());

  if (!users || users.length === 0) {
    return <div>No active users.</div>;
  }

  function userHasNewMessages(user) {
    // pentru ca sa nu apara notificare pt user daca mesajul a fost trimis pe broadcast
    return newMessages.find((message) => ((message.sender === user && message.type !== 'broadcast') || 
                            (message.sender !== loggedInUser && message.to === user && message.type === 'broadcast') )) !== undefined;
  }

  return (
    <div className="overflow-auto container-fluid">
      <h5>Active Users</h5>
      <ul>
        {users.filter((user) => { return user !== loggedInUser })
          .map((user, idx) => (
            <li key={user || idx} onClick={() => { handleSelectChat(user, newMessages )}}>
              <button>
                {user} {userHasNewMessages(user) && <p>•</p>}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ActiveUsers;
