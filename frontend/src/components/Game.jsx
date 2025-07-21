import { React, useEffect, useState } from 'react'

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

const Game = ({initiator, player, opponent, updateGameState, isGameStarted, isGameUpdate, setIsGameUpdate }) => {

    const loggedInUser = getUsernameFromToken(getTokenFromCookie());
    const [currentUser, setCurrentUser] = useState(initiator);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if(isGameUpdate){
            console.log('setting states in game');
            setScore(score + 1);
            setCurrentUser(prevUser => prevUser === player ? opponent : player);
            setIsGameUpdate(false);
        }
            
    }, [isGameUpdate]);

    const handleClick = () => {
        setScore(score + 1);
        setCurrentUser(prevUser => prevUser === player ? opponent : player);
        updateGameState();
    }

    return (
        <>
            <h1>Jocul nostru</h1>
            {isGameStarted ?
                (
                    <>
                        <h3> Game started {player} vs {opponent}</h3>
                        <h5>Current turn: {currentUser ? currentUser : (setCurrentUser(initiator))}</h5>
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