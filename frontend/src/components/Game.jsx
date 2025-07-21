import { React, useState } from 'react'

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

const Game = ({ user1, user2, isGameStarted }) => {

    const loggedInUser = getUsernameFromToken(getTokenFromCookie());
    const [currentUser, setCurrentUser] = useState(user1);
    const [score, setScore] = useState(0);

    const handleClick = () => {
        setScore(score + 1);
        setCurrentUser(prevUser => prevUser === user1 ? user2 : user1);
    }

    return (
        <>
            <h1>Jocul nostru</h1>
            {isGameStarted ?
                (
                    <>
                        <h3> Game started {user1} vs {user2}</h3>
                        <h5>Current turn: {currentUser ? currentUser : (setCurrentUser(user1))}</h5>
                        <button onClick={handleClick} disabled={currentUser !== loggedInUser}>
                            Click {score}
                        </button>

                    </>
                ) :
                (<h3>Waiting for opponent...</h3>)}


        </>
    );
};

export default Game;