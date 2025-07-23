class GameHandler {
  constructor(sendToUserCallback) {
    this.activeGames = new Map();
    this.gameInvitations = new Map();
    // This allows GameHandler to communicate without knowing about WebSocket clients directly.
    this.sendToUser = sendToUserCallback;
    this.turnTimeouts = new Map();

  }

    // --- TIMER MANAGEMENT ---

  _startTurnTimeout(gameId) {
    this._clearTurnTimeout(gameId); // Clear any existing timer for this game first

    const timeoutId = setTimeout(() => {
      const game = this.activeGames.get(gameId);
      if (!game || game.winner) return; // Game already ended or doesn't exist

      console.log(`Turn timeout for game ${gameId}, player ${game.currentPlayer}`);

      const winner = game.currentPlayer === game.player1 ? game.player2 : game.player1;
      const loser = game.currentPlayer;
      game.winner = winner; // The player who didn't time out wins

      const message = { type: 'turn_timeout', gameId, winner, timedOutPlayer: loser };
      this.sendToUser(game.player1, message);
      this.sendToUser(game.player2, message);

      this.activeGames.delete(gameId); // Or move to a "finished games" map
    }, 30000); // 30-second timeout

    this.turnTimeouts.set(gameId, timeoutId);
  }

  _clearTurnTimeout(gameId) {
    if (this.turnTimeouts.has(gameId)) {
      clearTimeout(this.turnTimeouts.get(gameId));
      this.turnTimeouts.delete(gameId);
    }
  }


  // --- INVITATION MANAGEMENT ---

  handleGameInvitation(sender, data) {
    const { gameId, to } = data;
    this.gameInvitations.set(gameId, { from: sender, to });

    setTimeout(() => {
      if (this.gameInvitations.has(gameId)) {
        this.gameInvitations.delete(gameId);
        this.sendToUser(sender, { type: 'invitation_timeout', gameId, to });
        this.sendToUser(to, { type: 'invitation_timeout', gameId, from: sender });
      }
    }, 30000); 

    this.sendToUser(to, { type: 'game_invitation', gameId, from: sender });
  }

  handleAcceptGameInvitation(accepter, data) {
    const { gameId, inviter } = data;
    const invitation = this.gameInvitations.get(gameId);
    if (!invitation || invitation.to !== accepter) return; 

    this.gameInvitations.delete(gameId);

    const game = {
      id: gameId,
      player1: inviter, // Always 'R'
      player2: accepter, // Always 'Y'
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      currentPlayer: inviter, // Inviter goes first
      winner: null,
    };
    this.activeGames.set(gameId, game);

    this.sendToUser(inviter, { type: 'game_started', gameId, opponent: accepter, playerSymbol: 'R', isMyTurn: true });
    this.sendToUser(accepter, { type: 'game_started', gameId, opponent: inviter, playerSymbol: 'Y', isMyTurn: false });
    this._startTurnTimeout(gameId);  
  }

  handleDeclineGameInvitation(decliner, data) {
    const { gameId, inviter } = data;
    if (!this.gameInvitations.has(gameId)) return;
    this.gameInvitations.delete(gameId);
    this.sendToUser(inviter, { type: 'invitation_declined', gameId, decliner });
  }

  // --- ACTIVE GAME MANAGEMENT ---

  handleGameMove(player, data) {
  const { gameId, move } = data;
  const game = this.activeGames.get(gameId);

  if (!game || game.currentPlayer !== player || game.winner) return;
  this._startTurnTimeout(gameId);


  const col = move.col;
  let row = -1;

  for (let r = 5; r >= 0; r--) {
    if (!game.board[r][col]) {
      game.board[r][col] = game.currentPlayer === game.player1 ? 'R' : 'Y';
      row = r;
      break;
    }
  }

  if (row === -1) return; 

  const opponent = player === game.player1 ? game.player2 : game.player1;

  // Send move update to both players
  const moveMessage = {
    type: 'game_move',
    gameId,
    board: game.board,
    nextTurn: opponent
  };
  this.sendToUser(player, moveMessage);
  this.sendToUser(opponent, moveMessage);

  // Check for win or tie
  const winnerSymbol = this._checkConnectFourWinner(game.board);
  const isTie = !game.board.flat().includes(null);

  if (winnerSymbol || isTie) {
    game.winner = winnerSymbol ? player : 'tie';

    setTimeout(() => {
      const endMessage = {
        type: 'game_ended',
        gameId,
        board: game.board,
        winner: game.winner
      };
      this.sendToUser(player, endMessage);
      this.sendToUser(opponent, endMessage);
    }, 500); 
  } else {
    game.currentPlayer = opponent; // Next turn
  }
}


  _checkConnectFourWinner(board) {
    const checkLine = (a, b, c, d) => (a && a === b && a === c && a === d);
    // Check all directions for a win
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        // Horizontal
        if (c < 4 && checkLine(board[r][c], board[r][c+1], board[r][c+2], board[r][c+3])) return board[r][c];
        // Vertical
        if (r < 3 && checkLine(board[r][c], board[r+1][c], board[r+2][c], board[r+3][c])) return board[r][c];
        // Diagonal Down-Right
        if (r < 3 && c < 4 && checkLine(board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3])) return board[r][c];
        // Diagonal Up-Right
        if (r > 2 && c < 4 && checkLine(board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3])) return board[r][c];
      }
    }
    return null;
  }

    handleRematchRequest(requester, data) {
    const { gameId } = data;
    const game = this.activeGames.get(gameId);

    // Only allow rematch requests for finished games
    if (!game || game.winner === null) return;

    // Set the state on the server-side game object
    game.rematchRequestedBy = requester;

    const opponent = requester === game.player1 ? game.player2 : game.player1;

    // Notify the other player that a rematch has been offered
    this.sendToUser(opponent, { type: 'rematch_offered', gameId, from: requester });
    // Confirm to the requester that their offer was sent
    this.sendToUser(requester, { type: 'rematch_request_sent', gameId });
  }

  handleRematchAccept(accepter, data) {
    const { gameId } = data;
    const oldGame = this.activeGames.get(gameId);

    // Validate that a rematch was actually offered by the other player
    if (!oldGame || !oldGame.rematchRequestedBy || oldGame.rematchRequestedBy === accepter) {
      return;
    }

    // --- START NEW GAME ---
    const newGameId = `game_${Date.now()}`;
    
    // The player who lost the previous game starts the new one.
    // If it was a tie, the player who went second (player2) starts.
    const loser = oldGame.winner === 'tie' ? oldGame.player2 : (oldGame.winner === oldGame.player1 ? oldGame.player2 : oldGame.player1);
    
    const newPlayer1 = loser;
    const newPlayer2 = oldGame.rematchRequestedBy === newPlayer1 ? accepter : oldGame.rematchRequestedBy;

    const newGame = {
      id: newGameId,
      player1: newPlayer1, // New 'R' player
      player2: newPlayer2, // New 'Y' player
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      currentPlayer: newPlayer1, // Loser goes first
      winner: null,
      rematchRequestedBy: null, // Reset state
    };

    // Add the new game and remove the old one
    this.activeGames.set(newGameId, newGame);
    this.activeGames.delete(gameId);

    // Notify players that the new game has started
    this.sendToUser(newPlayer1, { 
      type: 'game_started', 
      gameId: newGameId,
      rematchOf: gameId, // Let the client know which game this replaces
      opponent: newPlayer2, 
      playerSymbol: 'R', 
      isMyTurn: true 
    });
    this.sendToUser(newPlayer2, { 
      type: 'game_started', 
      gameId: newGameId,
      rematchOf: gameId,
      opponent: newPlayer1, 
      playerSymbol: 'Y', 
      isMyTurn: false 
    });
  }
  
  // --- CLEANUP ---

  cleanupUserGames(username) {
    // End any active games the user was in
    this.activeGames.forEach((game, gameId) => {
      if (game.player1 === username || game.player2 === username) {
        const opponent = game.player1 === username ? game.player2 : game.player1;
        this.sendToUser(opponent, { type: 'game_ended', gameId, winner: opponent, reason: 'opponent_disconnected' });
        this.activeGames.delete(gameId);
        console.log(`Cleaned up active game ${gameId} for disconnected user ${username}.`);
      }
    });

    // Clean up any invitations sent to or from the user
    this.gameInvitations.forEach((invitation, gameId) => {
      if(invitation.from === username || invitation.to === username) {
        this.gameInvitations.delete(gameId);
        console.log(`Cleaned up game invitation ${gameId} for disconnected user ${username}.`);
      }
    });
  }
}

module.exports = GameHandler;