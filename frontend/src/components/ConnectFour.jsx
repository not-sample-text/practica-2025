import React from 'react';
import '../stylecomponents/ConnectFour.css';

const ConnectFour = ({ 
    gameId, 
    username, 
    opponent, 
    gameState,
    websocketRef,
    onCloseGame,
}) => {
  const { 
    board, 
    isMyTurn, 
    playerSymbol, 
    winner, 
    status, 
    rematchOfferedBy // New prop to track rematch state
  } = gameState;

  const handleColumnClick = (colIndex) => {
    if (!isMyTurn || winner || status !== 'playing' || (board && board[0][colIndex])) {
      return;
    }
    websocketRef.current?.send(JSON.stringify({
      type: 'game_move',
      gameId: gameId,
      move: { col: colIndex },
      player: username
    }));
  };

  const handleRematchRequest = () => {
    websocketRef.current?.send(JSON.stringify({ type: 'rematch_request', gameId }));
  };
  
  const handleRematchAccept = () => {
    websocketRef.current?.send(JSON.stringify({ type: 'rematch_accept', gameId }));
  };
  
  const getGameStatusText = () => {
    if (status === 'finished') {
        if(winner === 'tie') return "It's a Tie!";
        return winner === username ? `You won! 🎉` : `${opponent} won!`;
    }
    if (status === 'playing') {
        return isMyTurn ? `Your Turn` : `${opponent}'s Turn`;
    }
    return "Waiting for game to start...";
  };

  const getPieceColor = (symbol) => {
    if (symbol === 'R') return 'red';
    if (symbol === 'Y') return 'yellow';
    return '';
  }

  const renderRematchSection = () => {
    if (status !== 'finished') return null;

    // Case 1: Opponent has offered a rematch
    if (rematchOfferedBy && rematchOfferedBy !== username) {
      return (
        <div className="cf-rematch">
          <p>{opponent} wants a rematch!</p>
          <button className="rematch-accept" onClick={handleRematchAccept}>Accept</button>
        </div>
      );
    }

    // Case 2: You have offered a rematch
    if (rematchOfferedBy === username) {
      return (
        <div className="cf-rematch">
          <p>Rematch offered. Waiting for {opponent}...</p>
        </div>
      );
    }
    
    // Case 3: No one has offered a rematch yet
    return (
      <div className="cf-rematch">
        <button className="rematch-request" onClick={handleRematchRequest}>Play Again</button>
      </div>
    );
  };

  return (
    <div className="connect-four-container">
      <div className="cf-header">
        <h3>Connect Four</h3>
        <button className="close-game-btn" onClick={onCloseGame}>✕</button>
      </div>

      <div className={`cf-status ${isMyTurn ? 'my-turn' : ''}`}>
        {getGameStatusText()}
      </div>

      <div className="cf-board" style={{ "--player-color": getPieceColor(playerSymbol) }}>
        {board && board.map((row, rIndex) => 
          row.map((cell, cIndex) => (
            <div key={`${rIndex}-${cIndex}`} className="cf-slot" onClick={() => handleColumnClick(cIndex)}>
              {cell && <div className={`cf-piece ${getPieceColor(cell)}`}></div>}
            </div>
          ))
        )}
      </div>

       <div className="cf-players">
          <span className={`player-tag ${getPieceColor(playerSymbol)}`}>You</span>
           vs 
          <span className={`player-tag ${getPieceColor(playerSymbol === 'R' ? 'Y' : 'R')}`}>{opponent}</span>
       </div>

       {/* --- NEW REMATCH SECTION --- */}
       {renderRematchSection()}
    </div>
  );
};

export default ConnectFour;