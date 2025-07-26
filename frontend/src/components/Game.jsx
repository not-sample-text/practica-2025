import { React } from 'react'

const Game = ({ gameState, websocketRef }) => {

    const {
        player,
        opponent,
        isMyTurn,
        choice,
        playerChoice,
        opponentChoice,
        winner,
        message,
        playerScore,
        opponentScore
    } = gameState;

    const handleClick = (e) => {
        const choice = e.target.value;

        websocketRef.current?.send(JSON.stringify({
            type: 'game',
            player,
            choice,
            status: 'choice'
        }));

    }

    //TODO: add play again functionality

    return (
        <>
            {opponent && player ?
                (
                    <>
                        <h5>🎮 {player} vs {opponent} 🎮</h5>
                        <div className='grid container-fluid' >
                            <div  >
                                <h4>🏆 Score</h4>
                                <div>
                                    <p><strong>{player}</strong> : {playerScore} 🎯</p>
                                    <p><strong>{opponent}</strong> : {opponentScore} 🎯</p>

                                    {winner && <h4>🏅 Winner : {winner} 🎉</h4>}
                                </div>
                            </div>
                            <div className='d-flex-column d-flex-centerX' >
                                {!winner ?
                                    (<h4>🔄 {isMyTurn ? 'Your turn' : "Opponent's turn"}</h4>) :
                                    (<h4>🏁 Game Over</h4>)}
                                <div className="choices d-flex-row" style={{ gap: '10px' }}>
                                    <button disabled={winner || !isMyTurn} onClick={handleClick} className='secondary' value='rock'>Rock 🌑</button>
                                    <button disabled={winner || !isMyTurn} onClick={handleClick} className='contrast' value='paper'>Paper 📃</button>
                                    <button disabled={winner || !isMyTurn} onClick={handleClick} value='scissors'>Scissors ✂️</button>
                                </div>
                                {playerChoice && opponentChoice &&
                                    <>
                                        <p style={{ minWidth: "250px" }}>🏹 <strong>{player}</strong> choosed: <strong>{playerChoice}</strong> </p>
                                        <p style={{ minWidth: "250px" }}>🏹 <strong>{opponent}</strong> choosed: <strong>{opponentChoice}</strong></p>
                                    </>}
                                {message && <h4>💬 {message}</h4>}
                                {winner && <button className='contrast'>↻ Play again</button>}
                            </div>

                        </div>
                    </>
                ) :
                (<h3>⏳ Waiting for opponent...</h3>)}
        </>
    );
};

export default Game;