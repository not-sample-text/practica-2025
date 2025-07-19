import { React } from 'react'


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

    return (
        <>
            <h1>Jocul nostru</h1>
            {isGameStarted ? (<h3>Game started</h3>) : (<h3>Waiting for opponent...</h3>)}


        </>
    );
};

export default Game;