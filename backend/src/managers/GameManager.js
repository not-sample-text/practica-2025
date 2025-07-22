// Game manager for handling blackjack game rooms

const { GameRoom, GAME_STATES, PLAYER_STATES } = require("../game/GameRoom");
const deckService = require("../services/deckService");
const auth = require("../auth");

class GameManager {
	constructor() {
		this.gameRooms = new Map(); // roomName -> GameRoom
	}

	// Create or upgrade room to game room
	createGameRoom(roomName, ownerToken, config = {}) {
		const normalRoomName = roomName.trim().toLowerCase();

		if (this.gameRooms.has(normalRoomName)) {
			console.log(`Game room ${normalRoomName} already exists`);
			return this.gameRooms.get(normalRoomName);
		}

		const gameRoom = new GameRoom(normalRoomName, ownerToken, config);
		this.gameRooms.set(normalRoomName, gameRoom);

		console.log(`Game room ${normalRoomName} created`);
		return gameRoom;
	}

	// Get game room
	getGameRoom(roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		return this.gameRooms.get(normalRoomName);
	}

	// Check if room is a game room
	isGameRoom(roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		return this.gameRooms.has(normalRoomName);
	}

	// Join game room
	joinGameRoom(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		gameRoom.addMember(token);
		const username = auth.getUsernameFromToken(token);
		console.log(`${username} joined game room ${roomName}`);

		return { success: true, gameRoom };
	}

	// Leave game room
	leaveGameRoom(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		gameRoom.removeMember(token);
		const username = auth.getUsernameFromToken(token);
		console.log(`${username} left game room ${roomName}`);

		// If no members left, clean up the room
		if (gameRoom.getAllMembers().length === 0) {
			this.removeGameRoom(roomName);
		}

		return { success: true };
	}

	// Remove game room
	removeGameRoom(roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const gameRoom = this.gameRooms.get(normalRoomName);

		if (gameRoom) {
			gameRoom.cleanup();
			this.gameRooms.delete(normalRoomName);
			console.log(`Game room ${normalRoomName} removed`);
		}
	}

	// Start game
	async startGame(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		if (!gameRoom.isOwner(token)) {
			return { success: false, error: "Only room owner can start the game" };
		}

		if (!gameRoom.canStartGame()) {
			return { success: false, error: "Cannot start game in current state" };
		}

		try {
			// Create new deck for the game
			const deckInfo = await deckService.createDeck(gameRoom.config.deckCount);
			gameRoom.deckId = deckInfo.deckId;

			// Set all players to betting state
			for (const [playerToken, player] of gameRoom.players) {
				player.state = PLAYER_STATES.BETTING;
				player.currentBet = 0;
				player.hand = [];
				player.total = 0;
				player.hasBlackjack = false;
				player.busted = false;
			}

			gameRoom.state = GAME_STATES.BETTING;
			gameRoom.currentPlayerIndex = 0;

			console.log(`Game started in room ${roomName}`);
			return { success: true, gameRoom };
		} catch (error) {
			console.error(`Failed to start game in room ${roomName}:`, error);
			return { success: false, error: "Failed to initialize game deck" };
		}
	}

	// Place bet
	placeBet(token, roomName, amount) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		if (gameRoom.state !== GAME_STATES.BETTING) {
			return { success: false, error: "Not in betting phase" };
		}

		const player = gameRoom.getPlayer(token);
		if (!player) {
			return { success: false, error: "You are not a player in this game" };
		}

		if (player.state !== PLAYER_STATES.BETTING) {
			return { success: false, error: "You cannot bet right now" };
		}

		if (amount < gameRoom.config.minBet) {
			return {
				success: false,
				error: `Minimum bet is ${gameRoom.config.minBet} chips`
			};
		}

		if (amount > player.chips) {
			return { success: false, error: "Insufficient chips" };
		}

		player.currentBet = amount;
		player.chips -= amount;
		player.state = PLAYER_STATES.WAITING;

		console.log(
			`${player.username} placed bet of ${amount} chips in room ${roomName}`
		);

		// Check if all players have bet
		const allPlayersBet = Array.from(gameRoom.players.values()).every(
			(p) => p.state === PLAYER_STATES.WAITING
		);

		if (allPlayersBet) {
			this.startDealing(gameRoom);
		}

		return { success: true, gameRoom };
	}

	// Start dealing phase
	async startDealing(gameRoom) {
		gameRoom.state = GAME_STATES.DEALING;

		try {
			// Deal 2 cards to each player and dealer
			const totalCards = (gameRoom.players.size + 1) * 2;
			const { cards } = await deckService.drawCards(
				gameRoom.deckId,
				totalCards
			);

			let cardIndex = 0;

			// Deal first card to each player, then dealer
			for (const [token, player] of gameRoom.players) {
				player.hand.push(cards[cardIndex++]);
			}
			gameRoom.dealer.hand.push(cards[cardIndex++]);

			// Deal second card to each player, then dealer
			for (const [token, player] of gameRoom.players) {
				player.hand.push(cards[cardIndex++]);
				player.total = deckService.calculateHandTotal(player.hand);
				player.hasBlackjack = deckService.isBlackjack(player.hand);
				player.state = player.hasBlackjack
					? PLAYER_STATES.STANDING
					: PLAYER_STATES.PLAYING;
			}
			gameRoom.dealer.hand.push(cards[cardIndex++]);
			gameRoom.dealer.total = deckService.calculateHandTotal([
				gameRoom.dealer.hand[0]
			]); // Only count face-up card

			// Check for dealer blackjack
			const dealerBlackjack = deckService.isBlackjack(gameRoom.dealer.hand);
			if (dealerBlackjack) {
				gameRoom.dealer.hasBlackjack = true;
				gameRoom.state = GAME_STATES.ROUND_COMPLETE;
				this.processRoundComplete(gameRoom);
			} else {
				// Start player turns
				gameRoom.state = GAME_STATES.PLAYING;
				gameRoom.currentPlayerIndex = 0;
				this.findNextActivePlayer(gameRoom);
			}

			console.log(`Dealing complete in room ${gameRoom.roomName}`);
		} catch (error) {
			console.error(
				`Failed to deal cards in room ${gameRoom.roomName}:`,
				error
			);
			gameRoom.state = GAME_STATES.WAITING;
		}
	}

	// Find next player who needs to play
	findNextActivePlayer(gameRoom) {
		const players = Array.from(gameRoom.players.values());

		while (gameRoom.currentPlayerIndex < players.length) {
			const currentPlayer = players[gameRoom.currentPlayerIndex];

			if (currentPlayer.state === PLAYER_STATES.PLAYING) {
				gameRoom.startActionTimer();
				return currentPlayer;
			}

			gameRoom.currentPlayerIndex++;
		}

		// All players done, dealer's turn
		gameRoom.state = GAME_STATES.DEALER_TURN;
		this.processDealerTurn(gameRoom);
		return null;
	}

	// Process player action (hit, stand, double, split)
	async processPlayerAction(token, roomName, action, data = {}) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		if (gameRoom.state !== GAME_STATES.PLAYING) {
			return { success: false, error: "Not in playing phase" };
		}

		const player = gameRoom.getPlayer(token);
		if (!player) {
			return { success: false, error: "You are not a player in this game" };
		}

		const currentPlayer = gameRoom.getCurrentPlayer();
		if (!currentPlayer || currentPlayer.token !== token) {
			return { success: false, error: "Not your turn" };
		}

		if (player.state !== PLAYER_STATES.PLAYING) {
			return { success: false, error: "You cannot play right now" };
		}

		try {
			let actionResult = { success: true };

			switch (action) {
				case "hit":
					actionResult = await this.processHit(gameRoom, player);
					break;
				case "stand":
					actionResult = this.processStand(gameRoom, player);
					break;
				case "double":
					actionResult = await this.processDouble(gameRoom, player);
					break;
				// Split to be implemented later
				default:
					return { success: false, error: "Invalid action" };
			}

			if (actionResult.success) {
				// Move to next player if current player is done
				if (
					player.state === PLAYER_STATES.STANDING ||
					player.state === PLAYER_STATES.BUSTED
				) {
					gameRoom.moveToNextPlayer();
					this.findNextActivePlayer(gameRoom);
				}
			}

			return { success: true, gameRoom, actionResult };
		} catch (error) {
			console.error(
				`Failed to process action ${action} for ${player.username}:`,
				error
			);
			return { success: false, error: "Failed to process action" };
		}
	}

	// Process hit action
	async processHit(gameRoom, player) {
		const { cards } = await deckService.drawCards(gameRoom.deckId, 1);
		const newCard = cards[0];

		player.hand.push(newCard);
		player.total = deckService.calculateHandTotal(player.hand);

		if (deckService.isBusted(player.hand)) {
			player.busted = true;
			player.state = PLAYER_STATES.BUSTED;
		}

		console.log(
			`${player.username} hit and got ${newCard.value} of ${newCard.suit}`
		);
		return { success: true, card: newCard };
	}

	// Process stand action
	processStand(gameRoom, player) {
		player.state = PLAYER_STATES.STANDING;
		console.log(`${player.username} stands with total ${player.total}`);
		return { success: true };
	}

	// Process double down action
	async processDouble(gameRoom, player) {
		if (player.hand.length !== 2) {
			return { success: false, error: "Can only double on first two cards" };
		}

		if (player.chips < player.currentBet) {
			return { success: false, error: "Insufficient chips to double" };
		}

		// Double the bet
		player.chips -= player.currentBet;
		player.currentBet *= 2;

		// Hit once and stand
		const hitResult = await this.processHit(gameRoom, player);
		if (hitResult.success && player.state !== PLAYER_STATES.BUSTED) {
			player.state = PLAYER_STATES.STANDING;
		}

		console.log(`${player.username} doubled down`);
		return { success: true, card: hitResult.card };
	}

	// Process dealer turn
	async processDealerTurn(gameRoom) {
		try {
			// Reveal dealer's hole card
			gameRoom.dealer.total = deckService.calculateHandTotal(
				gameRoom.dealer.hand
			);

			// Dealer hits on 16, stands on 17 (including soft 17)
			while (gameRoom.dealer.total < 17) {
				const { cards } = await deckService.drawCards(gameRoom.deckId, 1);
				const newCard = cards[0];

				gameRoom.dealer.hand.push(newCard);
				gameRoom.dealer.total = deckService.calculateHandTotal(
					gameRoom.dealer.hand
				);

				console.log(
					`Dealer hit and got ${newCard.value} of ${newCard.suit}, total: ${gameRoom.dealer.total}`
				);
			}

			if (gameRoom.dealer.total > 21) {
				gameRoom.dealer.busted = true;
			}

			gameRoom.state = GAME_STATES.ROUND_COMPLETE;
			this.processRoundComplete(gameRoom);
		} catch (error) {
			console.error(
				`Error during dealer turn in room ${gameRoom.roomName}:`,
				error
			);
		}
	}

	// Process round completion and payouts
	processRoundComplete(gameRoom) {
		const roundResults = [];

		for (const [token, player] of gameRoom.players) {
			let result = "lose";
			let payout = 0;

			if (player.hasBlackjack && !gameRoom.dealer.hasBlackjack) {
				// Player blackjack wins 3:2
				result = "blackjack";
				payout = Math.floor(player.currentBet * 2.5);
			} else if (player.busted) {
				// Player busted, loses bet
				result = "bust";
				payout = 0;
			} else if (gameRoom.dealer.busted) {
				// Dealer busted, player wins
				result = "win";
				payout = player.currentBet * 2;
			} else if (player.total > gameRoom.dealer.total) {
				// Player has higher total
				result = "win";
				payout = player.currentBet * 2;
			} else if (player.total === gameRoom.dealer.total) {
				// Push - return bet
				result = "push";
				payout = player.currentBet;
			}
			// else player loses (result = 'lose', payout = 0)

			// Apply payout
			player.chips += payout;

			// Update statistics
			if (result === "win" || result === "blackjack") {
				player.roundsWon++;
				player.totalChipsWon += payout - player.currentBet;
			} else if (result === "lose" || result === "bust") {
				player.roundsLost++;
				player.totalChipsLost += player.currentBet;
			}

			roundResults.push({
				username: player.username,
				result,
				payout,
				newChipTotal: player.chips
			});

			// Reset for next round
			player.currentBet = 0;
			player.hand = [];
			player.total = 0;
			player.hasBlackjack = false;
			player.busted = false;
			player.state = PLAYER_STATES.WAITING;
		}

		// Reset dealer
		gameRoom.dealer.hand = [];
		gameRoom.dealer.total = 0;
		gameRoom.dealer.hasBlackjack = false;
		gameRoom.dealer.busted = false;

		// Reset game state
		gameRoom.state = GAME_STATES.WAITING;
		gameRoom.currentPlayerIndex = 0;

		// Add to round history
		gameRoom.roundHistory.push({
			timestamp: new Date().toISOString(),
			results: roundResults
		});

		console.log(`Round complete in room ${gameRoom.roomName}:`, roundResults);

		// Check if deck needs reshuffling
		if (deckService.needsReshuffle(gameRoom.deckId)) {
			this.reshuffleDeck(gameRoom);
		}
	}

	// Reshuffle deck
	async reshuffleDeck(gameRoom) {
		try {
			await deckService.shuffleDeck(gameRoom.deckId);
			console.log(`Deck reshuffled in room ${gameRoom.roomName}`);
		} catch (error) {
			console.error(
				`Failed to reshuffle deck in room ${gameRoom.roomName}:`,
				error
			);
			// Create new deck if reshuffle fails
			try {
				const deckInfo = await deckService.createDeck(
					gameRoom.config.deckCount
				);
				gameRoom.deckId = deckInfo.deckId;
				console.log(`New deck created for room ${gameRoom.roomName}`);
			} catch (createError) {
				console.error(
					`Failed to create new deck for room ${gameRoom.roomName}:`,
					createError
				);
			}
		}
	}

	// Handle player disconnection
	handleDisconnection(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (gameRoom) {
			gameRoom.startDisconnectTimer(token);
		}
	}

	// Handle player reconnection
	handleReconnection(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (gameRoom) {
			gameRoom.handleReconnection(token);
		}
	}

	// Add chips (bankruptcy protection)
	addChips(token, roomName) {
		const gameRoom = this.getGameRoom(roomName);
		if (!gameRoom) {
			return { success: false, error: "Game room not found" };
		}

		const player = gameRoom.getPlayer(token);
		if (!player) {
			return { success: false, error: "You are not a player in this game" };
		}

		if (player.chips > 0) {
			return { success: false, error: "You still have chips" };
		}

		if (gameRoom.state !== GAME_STATES.WAITING) {
			return { success: false, error: "Cannot add chips during active game" };
		}

		player.chips = 1000;
		console.log(`${player.username} received 1000 chips in room ${roomName}`);

		return { success: true, newChipTotal: player.chips };
	}

	// Get all game rooms
	getAllGameRooms() {
		return Array.from(this.gameRooms.keys());
	}

	// Cleanup user from all game rooms
	cleanupUserFromGameRooms(token) {
		for (const [roomName, gameRoom] of this.gameRooms) {
			if (gameRoom.members.has(token)) {
				gameRoom.removeMember(token);

				// Remove empty rooms
				if (gameRoom.getAllMembers().length === 0) {
					this.removeGameRoom(roomName);
				}
			}
		}
	}
}

module.exports = GameManager;
