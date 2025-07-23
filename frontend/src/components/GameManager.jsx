import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import TicTacToe from "./TicTacToe";

const GameManager = forwardRef(({ username, websocketRef, connectionStatus }, ref) => {
  const [activeGames, setActiveGames] = useState([]);
  const [gameInvitations, setGameInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  
  // Timeout configurations (in seconds)
  const INVITATION_TIMEOUT = 30;
  const TURN_TIMEOUT = 30;
  
  // Refs to store timeout IDs
  const invitationTimeoutsRef = useRef(new Map());
  const turnTimeoutsRef = useRef(new Map());

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    sendGameInvitation,
    getSentInvitations: () => sentInvitations
  }));

  useEffect(() => {
    if (connectionStatus === "connected" && websocketRef.current) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'game_invitation':
              handleGameInvitation(data);
              break;
            case 'game_started':
              handleGameStarted(data);
              break;
            case 'game_move':
              handleGameMove(data);
              break;
            case 'game_reset':
              handleGameReset(data);
              break;
            case 'game_ended':
              handleGameEnded(data);
              break;
            case 'invitation_declined':
              handleInvitationDeclined(data);
              break;
            case 'invitation_timeout':
              handleInvitationTimeout(data);
              break;
            case 'turn_timeout':
              handleTurnTimeout(data);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing game message:', error);
        }
      };

      websocketRef.current.addEventListener('message', handleMessage);

      return () => {
        if (websocketRef.current) {
          websocketRef.current.removeEventListener('message', handleMessage);
        }
      };
    }
  }, [connectionStatus, websocketRef]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all invitation timeouts
      invitationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      invitationTimeoutsRef.current.clear();
      
      // Clear all turn timeouts
      turnTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      turnTimeoutsRef.current.clear();
    };
  }, []);

  const handleGameInvitation = (data) => {
    const invitation = {
      id: data.gameId,
      from: data.from,
      timestamp: Date.now(),
      timeLeft: INVITATION_TIMEOUT
    };
    
    setGameInvitations(prev => [...prev, invitation]);
    
    // Start invitation countdown
    startInvitationCountdown(invitation.id);
  };

  const startInvitationCountdown = (gameId) => {
    let timeLeft = INVITATION_TIMEOUT;
    
    const countdown = setInterval(() => {
      timeLeft--;
      
      setGameInvitations(prev => 
        prev.map(inv => 
          inv.id === gameId 
            ? { ...inv, timeLeft }
            : inv
        )
      );
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        // Auto-decline invitation
        const invitation = gameInvitations.find(inv => inv.id === gameId);
        if (invitation) {
          declineGameInvitation(gameId, invitation.from, true); // true indicates timeout
        }
      }
    }, 1000);
    
    invitationTimeoutsRef.current.set(gameId, countdown);
  };

  const handleGameStarted = (data) => {
    const newGame = {
      id: data.gameId,
      opponent: data.opponent,
      playerSymbol: data.playerSymbol,
      isMyTurn: data.isMyTurn,
      board: Array(9).fill(null),
      status: 'playing',
      isXNext: true,
      winner: null,
      turnTimeLeft: data.isMyTurn ? TURN_TIMEOUT : null,
      gameStartTime: Date.now()
    };
    
    setActiveGames(prev => [...prev, newGame]);
    
    // Remove invitation if it exists
    setGameInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    
    // Clear invitation timeout
    const timeoutId = invitationTimeoutsRef.current.get(data.gameId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      invitationTimeoutsRef.current.delete(data.gameId);
    }
    
    // Start turn timeout if it's my turn
    if (data.isMyTurn) {
      startTurnTimeout(data.gameId);
    }
  };

  const startTurnTimeout = (gameId) => {
    let timeLeft = TURN_TIMEOUT;
    
    const countdown = setInterval(() => {
      timeLeft--;
      
      setActiveGames(prev =>
        prev.map(game =>
          game.id === gameId && game.isMyTurn
            ? { ...game, turnTimeLeft: timeLeft }
            : game
        )
      );
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        // Handle turn timeout - forfeit turn or end game
        handleTurnTimeout({ gameId, player: username });
      }
    }, 1000);
    
    turnTimeoutsRef.current.set(gameId, countdown);
  };

  const clearTurnTimeout = (gameId) => {
    const timeoutId = turnTimeoutsRef.current.get(gameId);
    if (timeoutId) {
      clearInterval(timeoutId);
      turnTimeoutsRef.current.delete(gameId);
    }
  };

  const handleGameMove = (data) => {
    setActiveGames(prev => prev.map(game => 
      game.id === data.gameId 
        ? {
            ...game,
            board: data.board,
            isMyTurn: data.player !== username,
            isXNext: !game.isXNext,
            winner: data.winner || null,
            status: data.winner ? 'finished' : 'playing',
            turnTimeLeft: data.player !== username ? TURN_TIMEOUT : null
          }
        : game
    ));
    
    // Clear current turn timeout
    clearTurnTimeout(data.gameId);
    
    // Start new turn timeout if it's now my turn and game isn't finished
    if (data.player !== username && !data.winner) {
      startTurnTimeout(data.gameId);
    }
  };

  const handleGameReset = (data) => {
    setActiveGames(prev => prev.map(game => 
      game.id === data.gameId 
        ? {
            ...game,
            board: Array(9).fill(null),
            isMyTurn: game.playerSymbol === 'X',
            isXNext: true,
            winner: null,
            status: 'playing',
            turnTimeLeft: game.playerSymbol === 'X' ? TURN_TIMEOUT : null
          }
        : game
    ));
    
    // Clear any existing turn timeout
    clearTurnTimeout(data.gameId);
    
    // Start turn timeout for whoever goes first (X)
    const game = activeGames.find(g => g.id === data.gameId);
    if (game && game.playerSymbol === 'X') {
      startTurnTimeout(data.gameId);
    }
  };

  const handleGameEnded = (data) => {
    setActiveGames(prev => prev.map(game => 
      game.id === data.gameId 
        ? {
            ...game,
            winner: data.winner,
            status: 'finished',
            turnTimeLeft: null
          }
        : game
    ));
    
    // Clear turn timeout
    clearTurnTimeout(data.gameId);
  };

  const handleInvitationDeclined = (data) => {
    setGameInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    
    // Clear invitation timeout
    const timeoutId = invitationTimeoutsRef.current.get(data.gameId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      invitationTimeoutsRef.current.delete(data.gameId);
    }
  };

  const handleInvitationTimeout = (data) => {
    setGameInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    
    // Show notification
    alert(`Game invitation ${data.from ? `from ${data.from}` : `to ${data.to}`} has expired.`);
  };

  const handleTurnTimeout = (data) => {
    // Handle when a player's turn times out
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'turn_timeout',
        gameId: data.gameId,
        player: data.player
      };
      websocketRef.current.send(JSON.stringify(message));
    }
    
    // Update game state - could forfeit the game or just skip the turn
    setActiveGames(prev => prev.map(game =>
      game.id === data.gameId
        ? {
            ...game,
            winner: game.opponent, // Forfeit due to timeout
            status: 'finished',
            turnTimeLeft: null
          }
        : game
    ));
    
    clearTurnTimeout(data.gameId);
  };

  const sendGameInvitation = (targetUsername) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const gameId = `game_${Date.now()}_${username}_${targetUsername}`;
      const message = {
        type: 'game_invitation',
        gameId: gameId,
        to: targetUsername,
        from: username
      };
      
      websocketRef.current.send(JSON.stringify(message));
      
      // Add to sent invitations with timeout
      const sentInvitation = {
        id: gameId,
        to: targetUsername,
        timestamp: Date.now(),
        timeLeft: INVITATION_TIMEOUT
      };
      
      setSentInvitations(prev => [...prev, sentInvitation]);
      
      // Start countdown for sent invitation
      startSentInvitationCountdown(gameId, targetUsername);
    }
  };

  const startSentInvitationCountdown = (gameId, targetUsername) => {
    let timeLeft = INVITATION_TIMEOUT;
    
    const countdown = setInterval(() => {
      timeLeft--;
      
      setSentInvitations(prev => 
        prev.map(inv => 
          inv.id === gameId 
            ? { ...inv, timeLeft }
            : inv
        )
      );
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        // Remove expired invitation
        setSentInvitations(prev => prev.filter(inv => inv.id !== gameId));
        alert(`Game invitation to ${targetUsername} has expired.`);
      }
    }, 1000);
    
    invitationTimeoutsRef.current.set(gameId, countdown);
  };

  const acceptGameInvitation = (gameId, inviterUsername) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'accept_game_invitation',
        gameId: gameId,
        inviter: inviterUsername
      };
      
      websocketRef.current.send(JSON.stringify(message));
    }
    
    // Clear invitation timeout
    const timeoutId = invitationTimeoutsRef.current.get(gameId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      invitationTimeoutsRef.current.delete(gameId);
    }
  };

  const declineGameInvitation = (gameId, inviterUsername, isTimeout = false) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'decline_game_invitation',
        gameId: gameId,
        inviter: inviterUsername,
        isTimeout: isTimeout
      };
      
      websocketRef.current.send(JSON.stringify(message));
    }
    
    setGameInvitations(prev => prev.filter(inv => inv.id !== gameId));
    
    // Clear invitation timeout
    const timeoutId = invitationTimeoutsRef.current.get(gameId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      invitationTimeoutsRef.current.delete(gameId);
    }
  };

  const cancelSentInvitation = (gameId, targetUsername) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'cancel_game_invitation',
        gameId: gameId,
        to: targetUsername
      };
      
      websocketRef.current.send(JSON.stringify(message));
    }
    
    setSentInvitations(prev => prev.filter(inv => inv.id !== gameId));
    
    // Clear invitation timeout
    const timeoutId = invitationTimeoutsRef.current.get(gameId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      invitationTimeoutsRef.current.delete(gameId);
    }
  };

  const closeGame = (gameId) => {
    setActiveGames(prev => prev.filter(game => game.id !== gameId));
    clearTurnTimeout(gameId);
  };

  const handleGameMoveLocal = (gameId, move) => {
    // This will be handled by the TicTacToe component
    // Clear the turn timeout since we made a move
    clearTurnTimeout(gameId);
  };

  const handleGameEnd = (gameId, winner) => {
    setActiveGames(prev => prev.map(game => 
      game.id === gameId 
        ? { ...game, winner, status: 'finished', turnTimeLeft: null }
        : game
    ));
    clearTurnTimeout(gameId);
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-manager">
      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <div className="sent-invitations">
          <h4>Sent Invitations</h4>
          {sentInvitations.map(invitation => (
            <div key={invitation.id} className="sent-invitation">
              <div className="invitation-content">
                <span className="invitation-text">
                  ⏳ Waiting for <strong>{invitation.to}</strong> to respond...
                </span>
                <span className="invitation-timer">
                  {formatTime(invitation.timeLeft)}
                </span>
                <button 
                  className="cancel-invitation-btn"
                  onClick={() => cancelSentInvitation(invitation.id, invitation.to)}
                  title="Cancel invitation"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Invitations */}
      {gameInvitations.length > 0 && (
        <div className="game-invitations">
          <h4>Game Invitations</h4>
          {gameInvitations.map(invitation => (
            <div key={invitation.id} className="game-invitation">
              <div className="invitation-content">
                <span className="invitation-text">
                  🎮 <strong>{invitation.from}</strong> wants to play Tic-Tac-Toe!
                </span>
                <span className="invitation-timer">
                  {formatTime(invitation.timeLeft)}
                </span>
                <div className="invitation-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => acceptGameInvitation(invitation.id, invitation.from)}
                  >
                    Accept
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => declineGameInvitation(invitation.id, invitation.from)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Games */}
      <div className="active-games">
        {activeGames.map(game => (
          <TicTacToe
            key={game.id}
            gameId={game.id}
            username={username}
            opponent={game.opponent}
            onGameMove={handleGameMoveLocal}
            onGameEnd={handleGameEnd}
            onCloseGame={() => closeGame(game.id)}
            gameState={game}
            websocketRef={websocketRef}
            turnTimeLeft={game.turnTimeLeft}
          />
        ))}
      </div>
    </div>
  );
});

export default GameManager;