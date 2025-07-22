// Game Room class extending regular room functionality for blackjack

const auth = require("../auth");

// Game states enum
const GAME_STATES = {
	WAITING: "waiting",
	BETTING: "betting",
	DEALING: "dealing",
	PLAYING: "playing",
	DEALER_TURN: "dealer_turn",
	ROUND_COMPLETE: "round_complete",
	GAME_OVER: "game_over"
};

// Player states enum
const PLAYER_STATES = {
	WAITING: "waiting",
	BETTING: "betting",
	PLAYING: "playing",
	BUSTED: "busted",
	STANDING: "standing",
	DISCONNECTED: "disconnected",
	SPECTATING: "spectating"
};

// Game over reasons
const GAME_OVER_REASONS = {
	DEALER_BUST: "dealer_bust",
	PLAYER_BUST: "player_bust",
	DEALER_BLACKJACK: "dealer_blackjack",
	PLAYER_BLACKJACK: "player_blackjack",
	DEALER_WIN: "dealer_win",
	PLAYER_WIN: "player_win",
	PUSH: "push"
};

class GameRoom {
	constructor(roomName, ownerToken, config = {}) {
		this.roomName = roomName.trim().toLowerCase();
		this.ownerToken = ownerToken;
		this.state = GAME_STATES.WAITING;

		// Room configuration
		this.config = {
			maxPlayers: config.maxPlayers || 8,
			minBet: config.minBet || 10,
			deckCount: Math.max(config.deckCount || 6, 6), // Minimum 6 decks
			actionTimeout: config.actionTimeout || 30000, // 30 seconds
			disconnectGracePeriod: config.disconnectGracePeriod || 45000, // 45 seconds
			reconnectBonusTime: config.reconnectBonusTime || 15000 // 15 seconds
		};

		// Game state
		this.deckId = null;
		this.players = new Map(); // token -> PlayerData
		this.spectators = new Set(); // tokens of spectating users
		this.currentPlayerIndex = 0;
		this.dealer = {
			hand: [],
			total: 0,
			hasBlackjack: false,
			busted: false
		};

		// Timers
		this.actionTimer = null;
		this.disconnectTimers = new Map(); // token -> timer

		// Game history
		this.roundHistory = [];

		// Member management (extends regular room functionality)
		this.members = new Set(); // All room members (players + spectators)

		console.log(
			`Game room ${this.roomName} created by ${auth.getUsernameFromToken(
				ownerToken
			)}`
		);
	}

	// Member management
	addMember(token) {
		this.members.add(token);

		// If game is in waiting state, add as player (if space available)
		if (
			this.state === GAME_STATES.WAITING &&
			this.players.size < this.config.maxPlayers
		) {
			this.addPlayer(token);
		} else {
			// Add as spectator
			this.addSpectator(token);
		}
	}

	removeMember(token) {
		this.members.delete(token);
		this.removePlayer(token);
		this.spectators.delete(token);
		this.clearDisconnectTimer(token);
	}

	addPlayer(token) {
		if (this.players.size >= this.config.maxPlayers) {
			return false;
		}

		const username = auth.getUsernameFromToken(token);
		this.players.set(token, {
			token,
			username,
			state: PLAYER_STATES.WAITING,
			chips: 1000, // Starting chips
			currentBet: 0,
			hand: [],
			total: 0,
			hasBlackjack: false,
			busted: false,
			insurance: 0,
			canSplit: false,
			canDouble: false,
			roundsWon: 0,
			roundsLost: 0,
			totalChipsWon: 0,
			totalChipsLost: 0
		});

		this.spectators.delete(token);
		console.log(`${username} added as player in room ${this.roomName}`);
		return true;
	}

	removePlayer(token) {
		if (this.players.has(token)) {
			const player = this.players.get(token);
			console.log(
				`${player.username} removed from game in room ${this.roomName}`
			);

			// If it's the current player's turn and game is active, skip their turn
			if (
				this.state === GAME_STATES.PLAYING &&
				this.getCurrentPlayer()?.token === token
			) {
				this.processPlayerAction(token, "stand");
			}

			this.players.delete(token);
		}
	}

	addSpectator(token) {
		this.spectators.add(token);
		const username = auth.getUsernameFromToken(token);
		console.log(`${username} added as spectator in room ${this.roomName}`);
	}

	// Player state management
	getPlayer(token) {
		return this.players.get(token);
	}

	getCurrentPlayer() {
		const playerTokens = Array.from(this.players.keys());
		if (this.currentPlayerIndex < playerTokens.length) {
			const token = playerTokens[this.currentPlayerIndex];
			return this.players.get(token);
		}
		return null;
	}

	moveToNextPlayer() {
		this.currentPlayerIndex++;
		this.clearActionTimer();

		if (this.currentPlayerIndex >= this.players.size) {
			// All players have played, dealer's turn
			this.state = GAME_STATES.DEALER_TURN;
			return null;
		}

		const currentPlayer = this.getCurrentPlayer();
		if (
			currentPlayer &&
			(currentPlayer.state === PLAYER_STATES.BUSTED ||
				currentPlayer.state === PLAYER_STATES.STANDING)
		) {
			// Skip players who are already done
			return this.moveToNextPlayer();
		}

		this.startActionTimer();
		return currentPlayer;
	}

	// Timer management
	startActionTimer() {
		this.clearActionTimer();
		const currentPlayer = this.getCurrentPlayer();
		if (!currentPlayer) return;

		this.actionTimer = setTimeout(() => {
			console.log(
				`Action timeout for ${currentPlayer.username} in room ${this.roomName}`
			);
			this.processPlayerAction(currentPlayer.token, "stand");
		}, this.config.actionTimeout);
	}

	clearActionTimer() {
		if (this.actionTimer) {
			clearTimeout(this.actionTimer);
			this.actionTimer = null;
		}
	}

	startDisconnectTimer(token) {
		this.clearDisconnectTimer(token);
		const player = this.getPlayer(token);
		if (!player) return;

		player.state = PLAYER_STATES.DISCONNECTED;

		this.disconnectTimers.set(
			token,
			setTimeout(() => {
				console.log(`Disconnect grace period expired for ${player.username}`);
				this.removePlayer(token);
				this.addSpectator(token);
			}, this.config.disconnectGracePeriod)
		);
	}

	clearDisconnectTimer(token) {
		const timer = this.disconnectTimers.get(token);
		if (timer) {
			clearTimeout(timer);
			this.disconnectTimers.delete(token);
		}
	}

	handleReconnection(token) {
		this.clearDisconnectTimer(token);
		const player = this.getPlayer(token);
		if (player && player.state === PLAYER_STATES.DISCONNECTED) {
			// Give bonus time for action
			player.state = PLAYER_STATES.PLAYING;
			if (this.getCurrentPlayer()?.token === token) {
				this.clearActionTimer();
				this.actionTimer = setTimeout(() => {
					this.processPlayerAction(token, "stand");
				}, this.config.reconnectBonusTime);
			}
		}
	}

	// Game state checks
	canStartGame() {
		return (
			this.state === GAME_STATES.WAITING &&
			this.players.size > 0 &&
			this.players.size <= this.config.maxPlayers
		);
	}

	isOwner(token) {
		return this.ownerToken === token;
	}

	getAllMembers() {
		return Array.from(this.members);
	}

	getPlayersList() {
		return Array.from(this.players.values()).map((player) => ({
			username: player.username,
			chips: player.chips,
			state: player.state,
			currentBet: player.currentBet,
			hand: player.hand,
			total: player.total
		}));
	}

	getGameState() {
		return {
			roomName: this.roomName,
			state: this.state,
			config: this.config,
			players: this.getPlayersList(),
			spectatorCount: this.spectators.size,
			currentPlayerIndex: this.currentPlayerIndex,
			currentPlayer: this.getCurrentPlayer()?.username || null,
			dealer: {
				hand: this.dealer.hand,
				total: this.dealer.total,
				hasBlackjack: this.dealer.hasBlackjack
			},
			deckId: this.deckId
		};
	}

	// Placeholder methods for game actions (to be implemented)
	async startGame() {
		throw new Error("startGame method not implemented yet");
	}

	async processPlayerAction(token, action, data = {}) {
		throw new Error("processPlayerAction method not implemented yet");
	}

	cleanup() {
		this.clearActionTimer();
		this.disconnectTimers.forEach((timer) => clearTimeout(timer));
		this.disconnectTimers.clear();
		console.log(`Game room ${this.roomName} cleaned up`);
	}
}

module.exports = { GameRoom, GAME_STATES, PLAYER_STATES, GAME_OVER_REASONS };
