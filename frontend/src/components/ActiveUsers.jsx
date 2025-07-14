import React from 'react';

const ActiveUsers = ({ users }) => {
    if (!users || users.length === 0) {
        return <div>No active users.</div>;
    }
    return (
        <ul>
            {users.map((user, idx) => (
                <li key={user || idx}>
                    {user}
                </li>
            ))}
        </ul>
    );
};

export default ActiveUsers;