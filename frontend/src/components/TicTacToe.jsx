import React, { useState, useEffect } from "react";

const TicTacToe = ({ 
  gameId, 
  username, 
  opponent, 
  onGameMove, 
  onGameEnd, 
  onCloseGame,
  gameState,
  websocketRef,
  turnTimeLeft 
}) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (gameState) {
      setBoard(gameState.board || Array(9).fill(null));
      setIsXNext(gameState.isXNext ?? true);
      setWinner(gameState.winner || null);
      setGameStatus(gameState.status || 'waiting');
      setPlayerSymbol(gameState.playerSymbol || null);
      setIsMyTurn(gameState.isMyTurn ?? false);
    }
  }, [gameState]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (index) => {
    if (!isMyTurn || board[index] || winner || gameStatus !== 'playing') {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    
    // Send move to opponent via WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'game_move',
        gameId: gameId,
        move: index,
        board: newBoard,
        player: username
      };
      websocketRef.current.send(JSON.stringify(message));
    }

    // Update local state
    setBoard(newBoard);
    const newWinner = calculateWinner(newBoard);
    
    if (newWinner) {
      setWinner(newWinner);
      setGameStatus('finished');
      onGameEnd && onGameEnd(gameId, newWinner);
    } else if (newBoard.every(square => square !== null)) {
      setGameStatus('finished');
      setWinner('tie');
      onGameEnd && onGameEnd(gameId, 'tie');
    } else {
      setIsXNext(!isXNext);
      setIsMyTurn(false);
    }

    // Notify parent component that a move was made
    onGameMove && onGameMove(gameId, index);
  };

  const resetGame = () => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'game_reset',
        gameId: gameId,
        player: username
      };
      websocketRef.current.send(JSON.stringify(message));
    }
  };

  const renderSquare = (index) => {
    const isWinningSquare = winner && winner !== 'tie' && isWinningMove(index);
    
    return (
      <button
        key={index}
        className={`ttt-square ${board[index] ? 'filled' : ''} ${
          isMyTurn && !board[index] && gameStatus === 'playing' ? 'clickable' : ''
        } ${isWinningSquare ? 'winning-square' : ''}`}
        onClick={() => handleClick(index)}
        disabled={!isMyTurn || board[index] || winner || gameStatus !== 'playing'}
      >
        {board[index]}
      </button>
    );
  };

  const isWinningMove = (index) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return [a, b, c].includes(index);
      }
    }
    return false;
  };

  const getGameStatusText = () => {
    if (gameStatus === 'waiting') {
      return 'Waiting for opponent to join...';
    }
    if (winner) {
      if (winner === 'tie') {
        return "It's a tie!";
      }
      return winner === playerSymbol ? 'You won! 🎉' : `${opponent} won!`;
    }
    if (gameStatus === 'playing') {
      return isMyTurn ? 'Your turn' : `${opponent}'s turn`;
    }
    return '';
  };

  const getStatusColor = () => {
    if (winner === playerSymbol) return 'win';
    if (winner && winner !== 'tie') return 'lose';
    if (winner === 'tie') return 'tie';
    if (isMyTurn) return 'your-turn';
    return 'opponent-turn';
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!turnTimeLeft) return '';
    if (turnTimeLeft <= 5) return 'critical';
    if (turnTimeLeft <= 10) return 'warning';
    return 'normal';
  };

  return (
    <div className="tictactoe-container">
      <div className="ttt-header">
        <div className="ttt-title">
          <h3>Tic-Tac-Toe</h3>
          <div className="ttt-players">
            <span className="player-info">
              You: <strong>{playerSymbol}</strong>
            </span>
            <span className="vs">vs</span>
            <span className="player-info">
              {opponent}: <strong>{playerSymbol === 'X' ? 'O' : 'X'}</strong>
            </span>
          </div>
        </div>
        <button className="close-game-btn" onClick={onCloseGame} title="Close game">
          ✕
        </button>
      </div>

      <div className={`ttt-status ${getStatusColor()}`}>
        <div className="status-text">{getGameStatusText()}</div>
        {turnTimeLeft !== null && turnTimeLeft !== undefined && isMyTurn && gameStatus === 'playing' && (
          <div className={`turn-timer ${getTimerColor()}`}>
            ⏱️ {formatTime(turnTimeLeft)}
          </div>
        )}
      </div>

      <div className="ttt-board">
        {Array(3).fill(null).map((_, row) => (
          <div key={row} className="ttt-row">
            {Array(3).fill(null).map((_, col) => {
              const index = row * 3 + col;
              return renderSquare(index);
            })}
          </div>
        ))}
      </div>

      {gameStatus === 'finished' && (
        <div className="ttt-actions">
          <button className="ttt-reset-btn" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}

      {gameStatus === 'waiting' && (
        <div className="ttt-waiting">
          <div className="loading-spinner"></div>
          <p>Waiting for {opponent} to join...</p>
        </div>
      )}

      {/* Game Statistics */}
      <div className="ttt-stats">
        <div className="game-duration">
          Game ID: {gameId.split('_')[1]}
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;