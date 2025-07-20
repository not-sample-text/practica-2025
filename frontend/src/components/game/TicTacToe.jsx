import { useState, useEffect } from 'react';
import './TicTacToe.css';

function Square({ value, onSquareClick }) {
  return (
    <button 
      className="square"
      onClick={onSquareClick}
      disabled={value !== null}
    >
      {value}
    </button>
  );
}

function Board({squares, onPlay, gameWith, mySymbol, isMyTurn, setIsMyTurn, socket}) {
    useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    console.log('Board setup:', { mySymbol, isMyTurn });
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.type === 'move') {
          const { index, symbol } = data.move;
          console.log('Move received:', { index, symbol, mySymbol });
          
          if (symbol !== mySymbol) {
            console.log('Updating board with opponent move');
            const newSquares = [...squares];
            newSquares[index] = symbol;
            onPlay(newSquares);
            setIsMyTurn(true);
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, mySymbol, onPlay, squares, setIsMyTurn]);
  
  function handleClick(i) {
    console.log('Square clicked:', i, 'isMyTurn:', isMyTurn, 'mySymbol:', mySymbol); // Debug log
    
    if (!isMyTurn) {
      console.log('Not your turn!');
      return;
    }
    if (squares[i]) {
      console.log('Square already taken!');
      return;
    }
    if (calculateWinner(squares)) {
      console.log('Game already won!');
      return;
    }
    
    // First update local board
    const newSquares = [...squares];
    newSquares[i] = mySymbol;
    onPlay(newSquares);
    
    // Then send move to opponent
    setIsMyTurn(false);
    if (socket && socket.readyState === WebSocket.OPEN) {
      const moveData = {
        type: 'move',
        gameWith: gameWith,
        move: { index: i, symbol: mySymbol }
      };
      console.log('Sending move:', moveData); // Debug log
      socket.send(JSON.stringify(moveData));
    } else {
      console.log('Socket not ready!'); // Debug log
    }
  }

//   useEffect(() => {
//   const handleMessage = (event) => {
//     const data = JSON.parse(event.data);
//     if (data.type === 'move') {
//       const { index, symbol } = data.move;
//       onPlay(prev => {
//         const copy = [...prev];
//         copy[index] = symbol;
//         return copy;
//       });
//       setIsMyTurn(true); // now it's your turn again
//     }
//   };

//   socket.addEventListener('message', handleMessage);

//   return () => socket.removeEventListener('message', handleMessage);
// }, []);




    
  
  const winner = calculateWinner(squares);
  let status;
  let emoji = null;
  if (winner) {
    if (winner === mySymbol) {
      status = "You won!";
      emoji = "🤩";
    } else {
      status = "Opponent won!";
      emoji = "😢";
    }
  } else if (squares.every(square => square !== null)) {
    status = "Game is a draw!";
    emoji = "🤝";
  } else {
    status = isMyTurn ? "Your turn!" : "Opponent's turn...";
  }


  return (
    <div style={{ textAlign: 'center' }}>
      <div className="status" style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
        {status}
        {emoji && <span className="winner-emoji">{emoji}</span>}
      </div>
      <div style={{ display: 'inline-block' }}>
        <div style={{ display: 'flex' }}>
          <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
          <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
          <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
        </div>
        <div style={{ display: 'flex' }}>
          <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
          <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
          <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
        </div>
        <div style={{ display: 'flex' }}>
          <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
          <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
          <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
        </div>
      </div>
    </div>
  );
}

export default function Game({gameWith, socket}) {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isInviter, setIsInviter] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [mySymbol, setMySymbol] = useState(null);
  
  useEffect(() => {
    // Check if this player sent the invite by looking at the URL
    const urlParams = new URLSearchParams(window.location.search);
    const isInviter = urlParams.get('inviter') === 'true';
    setIsInviter(isInviter);
    setMySymbol(isInviter ? 'X' : 'O');
    setIsMyTurn(isInviter); // X (inviter) starts first
    
    console.log('Game initialized:', {
      isInviter,
      symbol: isInviter ? 'X' : 'O',
      startsTurn: isInviter
    });
  }, []);


  function handlePlay(newSquares) {
    console.log('Updating squares:', newSquares); // Add this for debugging
    setSquares(newSquares);
  }

  return (
    <div className="game">
      <h3>Game vs {gameWith} {isInviter ? '(You are X)' : '(You are O)'}</h3>
      <div className="game-board">
        <Board
          squares={squares}
          onPlay={handlePlay}
          gameWith={gameWith}
          mySymbol={mySymbol}
          isMyTurn={isMyTurn}
          setIsMyTurn={setIsMyTurn}
          socket={socket}
        />
      </div>
      <div className="status">
        {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
      </div>
    </div>
  );
}



function calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

