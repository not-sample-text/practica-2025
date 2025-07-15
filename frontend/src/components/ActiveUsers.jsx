import React from 'react';

const ActiveStatusIndicator = () => (
    <span 
        className="d-inline-block bg-success rounded-circle me-2" 
        style={{ width: '10px', height: '10px' }}
        title="Activ"
    ></span>
);

const ActiveUsers = ({ users }) => {
    return (
        <>
            <h6 className="dropdown-header">Utilizatori Activi</h6>
            {users && users.length > 0 ? (
                users.map((user, idx) => (
                    <span key={user || idx} className="dropdown-item-text d-flex align-items-center">
                        <ActiveStatusIndicator />
                        <span className="fw-medium">{user}</span>
                    </span>
                ))
            ) : (
                <span className="dropdown-item-text text-muted fst-italic">
                    Niciun alt utilizator activ.
                </span>
            )}
        </>
    );
};

export default ActiveUsers;