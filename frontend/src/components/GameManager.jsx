import ConnectFour from "./ConnectFour";
import "../stylecomponents/GameManager.css";
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
const GameManager = forwardRef(({ username, websocketRef, connectionStatus }, ref) => {
  const [activeGames, setActiveGames] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState(null);

  const INVITATION_TIMEOUT = 30;
  const TURN_TIMEOUT = 30;

  const invitationTimeoutsRef = useRef(new Map());
  const turnTimeoutsRef = useRef(new Map());

  useImperativeHandle(ref, () => ({
    sendGameInvitation,
    getSentInvitations: () => sentInvitations,
    canInviteUser,
  }));

  useEffect(() => {
    if (connectionStatus === "connected" && websocketRef.current) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "game_invitation": handleGameInvitation(data); break;
            case "game_started": handleGameStarted(data); break;
            case "game_move": handleGameMove(data); break;
            case "game_ended": handleGameEnded(data); break;
            case "invitation_declined": handleInvitationDeclined(data); break;
            case "invitation_timeout": handleInvitationTimeout(data); break;
            case "rematch_offered": handleRematchOffered(data); break;
            case "rematch_request_sent": handleRematchRequestSent(data); break;
            
            default: break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocketRef.current.addEventListener("message", handleMessage);
      return () => websocketRef.current?.removeEventListener("message", handleMessage);
    }
  }, [connectionStatus, websocketRef,currentInvitation]);

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const clearInvitationState = (gameId) => {
    if (invitationTimeoutsRef.current.has(gameId)) {
      clearInterval(invitationTimeoutsRef.current.get(gameId));
      invitationTimeoutsRef.current.delete(gameId);
    }
    setInvitationModalOpen(false);
    setCurrentInvitation(null);
  };

  const canInviteUser = (targetUsername) => {
    const isAlreadyInvited = sentInvitations.some(inv => inv.to === targetUsername);
    const isAlreadyInGame = activeGames.some(game => game.opponent === targetUsername);
    return !isAlreadyInvited && !isAlreadyInGame;
  };

  const sendGameInvitation = (targetUsername) => {
    if (!canInviteUser(targetUsername)) {
      addNotification(`You already have an active game or invitation with ${targetUsername}.`, 'error');
      return;
    }
    const gameId = `game_${Date.now()}`;
    websocketRef.current?.send(JSON.stringify({
      type: "game_invitation",
      gameId,
      to: targetUsername,
      from: username
    }));
    const sentInv = { id: gameId, to: targetUsername, timeLeft: INVITATION_TIMEOUT };
    setSentInvitations(prev => [...prev, sentInv]);
    startSentInvitationCountdown(gameId);
  };

  const startSentInvitationCountdown = (gameId) => {
    const interval = setInterval(() => {
      setSentInvitations(prev => prev.map(inv => 
        inv.id === gameId ? { ...inv, timeLeft: inv.timeLeft - 1 } : inv
      ).filter(inv => inv.timeLeft > 0));
    }, 1000);
    invitationTimeoutsRef.current.set(gameId, interval);
  };

  const handleGameInvitation = (data) => {
    const invitation = { id: data.gameId, from: data.from, timeLeft: INVITATION_TIMEOUT };
    setCurrentInvitation(invitation);
    setInvitationModalOpen(true);
    startInvitationCountdown(data.gameId, data.from);
  };

  const startInvitationCountdown = (gameId, from) => {
    const interval = setInterval(() => {
      setCurrentInvitation(prev => (prev && prev.id === gameId ? { ...prev, timeLeft: prev.timeLeft - 1 } : prev));
      if (currentInvitation && currentInvitation.timeLeft <= 1) {
        clearInterval(interval);
        declineGameInvitation(gameId, from, true);
      }
    }, 1000);
    invitationTimeoutsRef.current.set(gameId, interval);
  };
  
   const handleRematchOffered = (data) => {
    setActiveGames(prev => prev.map(game => 
      game.id === data.gameId ? { ...game, rematchOfferedBy: data.from } : game
    ));
  };

  const handleRematchRequestSent = (data) => {
    setActiveGames(prev => prev.map(game => 
      game.id === data.gameId ? { ...game, rematchOfferedBy: username } : game
    ));
  };

  const handleGameStarted = (data) => {
    const newGame = {
      id: data.gameId,
      opponent: data.opponent,
      playerSymbol: data.playerSymbol,
      isMyTurn: data.isMyTurn,
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      status: 'playing',
      winner: null,
      turnTimeLeft: data.isMyTurn ? TURN_TIMEOUT : null,
      rematchOfferedBy: null, 

    };
    if (data.rematchOf) {
      setActiveGames(prev => [...prev.filter(g => g.id !== data.rematchOf), newGame]);
    } else {
      setActiveGames(prev => [...prev, newGame]);
      clearInvitationState(data.gameId);
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    }

    addNotification(`Game started with ${data.opponent}!`, 'accepted');
  };

  const handleGameMove = (data) => {
    setActiveGames(prev => prev.map(game => {
      if (game.id === data.gameId) {
        return {
          ...game,
          board: data.board,
          isMyTurn: data.nextTurn === username,
        };
      }
      return game;
    }));
  };
  
  const handleGameEnded = (data) => {
      setActiveGames(prev => prev.map(game => {
          if (game.id === data.gameId) {
              return {...game, status: 'finished', winner: data.winner, isMyTurn: false};
          }
          return game;
      }));
  };

  const handleInvitationDeclined = (data) => {
    setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    clearInvitationState(data.gameId);
    if (data.decliner !== username) {
      addNotification(`${data.decliner} declined your invitation.`, 'declined');
    }
  };
  
  const handleInvitationTimeout = (data) => {
    // Logic to handle when an invitation sent *by you* times out on the other end
    setSentInvitations(prev => prev.filter(inv => inv.id !== data.gameId));
    addNotification(`Invitation to ${data.to} expired.`, 'timeout');
  };
  
  const acceptGameInvitation = (gameId, inviterUsername) => {
    websocketRef.current?.send(JSON.stringify({ type: "accept_game_invitation", gameId, inviter: inviterUsername }));
    clearInvitationState(gameId);
  };

  const declineGameInvitation = (gameId, inviterUsername, isTimeout = false) => {
    websocketRef.current?.send(JSON.stringify({ type: "decline_game_invitation", gameId, inviter: inviterUsername, isTimeout }));
    clearInvitationState(gameId);
  };

  const closeGame = (gameId) => {
    setActiveGames(prev => prev.filter(game => game.id !== gameId));
  };
  
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="game-manager">
      {invitationModalOpen && currentInvitation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🎮 Game Invitation</h3>
            <p><strong>{currentInvitation.from}</strong> has invited you to a game of Connect Four!</p>
            <div className="modal-timer">Time left: {formatTime(currentInvitation.timeLeft)}</div>
            <div className="modal-actions">
              <button className="accept" onClick={() => acceptGameInvitation(currentInvitation.id, currentInvitation.from)}>Accept</button>
              <button className="decline" onClick={() => declineGameInvitation(currentInvitation.id, currentInvitation.from)}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Render active games */}
      <div className="active-games-container">
        {activeGames.length > 0 ? (
            activeGames.map(game => (
              <ConnectFour
                key={game.id}
                gameId={game.id}
                username={username}
                opponent={game.opponent}
                gameState={game}
                websocketRef={websocketRef}
                onCloseGame={() => closeGame(game.id)}
              />
            ))
        ) : (
            <div className="no-active-games">
            </div>
        )}
      </div>
    </div>
  );
});

export default GameManager;