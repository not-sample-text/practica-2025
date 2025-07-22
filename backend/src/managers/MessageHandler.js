// Message handler using Command Pattern

const auth = require("../auth");
const ValidationUtils = require("../utils/ValidationUtils");
const RateLimiter = require("../utils/RateLimiter");

class MessageHandler {
	constructor(chatManager, roomManager, gameManager) {
		this.chatManager = chatManager;
		this.roomManager = roomManager;
		this.gameManager = gameManager;
		this.rateLimiter = new RateLimiter();
		this.commands = new Map();
		this.setupCommands();
		this.rateLimiter.startCleanup();
	}

	setupCommands() {
		this.commands.set("disconnect", this.handleDisconnect.bind(this));
		this.commands.set("broadcast", this.handleBroadcast.bind(this));
		this.commands.set("private", this.handlePrivate.bind(this));
		this.commands.set("create_room", this.handleCreateRoom.bind(this));
		this.commands.set("join_room", this.handleJoinRoom.bind(this));
		this.commands.set("leave_room", this.handleLeaveRoom.bind(this));
		this.commands.set("sendRoomMessage", this.handleSendRoomMessage.bind(this));
		this.commands.set("get_messages", this.handleGetMessages.bind(this));
		this.commands.set("mark_chat_read", this.handleMarkChatRead.bind(this));
		this.commands.set("set_active_chat", this.handleSetActiveChat.bind(this));

		// Game commands
		this.commands.set("create_game_room", this.handleCreateGameRoom.bind(this));
		this.commands.set("start_room_game", this.handleStartRoomGame.bind(this));
		this.commands.set("start_game", this.handleStartGame.bind(this));
		this.commands.set("place_bet", this.handlePlaceBet.bind(this));
		this.commands.set("player_action", this.handlePlayerAction.bind(this));
		this.commands.set("add_chips", this.handleAddChips.bind(this));
		this.commands.set("get_game_state", this.handleGetGameState.bind(this));
	}

	async handleMessage(clients, token, websocket, parsed) {
		// Check rate limiting for actions
		if (!this.rateLimiter.checkActionLimit(token)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Rate limit exceeded. Please slow down."
				})
			);
			return;
		}

		const command = this.commands.get(parsed.type);

		if (command) {
			try {
				await command(clients, token, websocket, parsed);
			} catch (error) {
				console.error(`Error handling command ${parsed.type}:`, error);
				websocket.send(
					JSON.stringify({
						type: "error",
						message: "An error occurred processing your request"
					})
				);
			}
		} else {
			console.log(`Unknown message type: ${parsed.type}`);
			websocket.send(
				JSON.stringify({
					type: "error",
					message: `Unknown message type: ${parsed.type}`
				})
			);
		}
	}

	handleDisconnect(clients, token, websocket, parsed) {
		console.log("Client disconnected");
		websocket.close();
	}

	async handleBroadcast(clients, token, websocket, parsed) {
		// Check message rate limit
		if (!this.rateLimiter.checkMessageLimit(token)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Message rate limit exceeded"
				})
			);
			return;
		}

		// Validate message content
		const contentValidation = ValidationUtils.validateMessageContent(
			parsed.content
		);
		if (!contentValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: contentValidation.error
				})
			);
			return;
		}

		const validatedMessage = {
			...parsed,
			content: contentValidation.value
		};

		await this.chatManager.broadcastMessage(clients, token, validatedMessage);
	}

	async handlePrivate(clients, token, websocket, parsed) {
		// Check message rate limit
		if (!this.rateLimiter.checkMessageLimit(token)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Message rate limit exceeded"
				})
			);
			return;
		}

		// Validate username and message content
		const usernameValidation = ValidationUtils.validateUsername(
			parsed.chatname
		);
		const contentValidation = ValidationUtils.validateMessageContent(
			parsed.content
		);

		if (!usernameValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: usernameValidation.error
				})
			);
			return;
		}

		if (!contentValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: contentValidation.error
				})
			);
			return;
		}

		const validatedMessage = {
			...parsed,
			chatname: usernameValidation.value,
			content: contentValidation.value
		};

		await this.chatManager.privateMessage(
			clients,
			token,
			validatedMessage.chatname,
			validatedMessage
		);
	}

	handleCreateRoom(clients, token, websocket, parsed) {
		// Validate room name
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		this.roomManager.createRoom(token, roomValidation.value);
		this.roomManager.sendRoomLists(clients);
		this.roomManager.sendJoinedRoomsUpdate(clients, token);
		this.roomManager.sendRoomUserCountUpdate(clients, roomValidation.value);

		// Send historical messages for this room
		this.chatManager.getHistoricalMessages(
			clients,
			token,
			"room",
			roomValidation.value
		);
	}

	handleJoinRoom(clients, token, websocket, parsed) {
		// Validate room name
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		this.roomManager.joinRoom(token, roomValidation.value);
		this.roomManager.sendJoinedRoomsUpdate(clients, token);
		this.roomManager.sendRoomUserCountUpdate(clients, roomValidation.value);

		// Send historical messages for this room
		this.chatManager.getHistoricalMessages(
			clients,
			token,
			"room",
			roomValidation.value
		);
	}

	handleLeaveRoom(clients, token, websocket, parsed) {
		// Validate room name
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		this.roomManager.leaveRoom(token, roomValidation.value);
		this.roomManager.sendRoomLists(clients);
		this.roomManager.sendJoinedRoomsUpdate(clients, token);
		this.roomManager.sendRoomUserCountUpdate(clients, roomValidation.value);
	}

	async handleSendRoomMessage(clients, token, websocket, parsed) {
		// Check message rate limit
		if (!this.rateLimiter.checkMessageLimit(token)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Message rate limit exceeded"
				})
			);
			return;
		}

		// Validate room name and message content
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		const contentValidation = ValidationUtils.validateMessageContent(
			parsed.content
		);

		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		if (!contentValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: contentValidation.error
				})
			);
			return;
		}

		await this.roomManager.sendRoomMessage(
			clients,
			token,
			roomValidation.value,
			contentValidation.value,
			this.chatManager
		);
		this.chatManager.sendUnreadCountsUpdate(clients, token);
	}

	async handleGetMessages(clients, token, websocket, parsed) {
		// Validate chat type
		const chatTypeValidation = ValidationUtils.validateChatType(
			parsed.chatType
		);
		if (!chatTypeValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: chatTypeValidation.error
				})
			);
			return;
		}

		await this.chatManager.getHistoricalMessages(
			clients,
			token,
			chatTypeValidation.value,
			parsed.identifier
		);
	}

	handleMarkChatRead(clients, token, websocket, parsed) {
		// Validate chat type
		const chatTypeValidation = ValidationUtils.validateChatType(
			parsed.chatType
		);
		if (!chatTypeValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: chatTypeValidation.error
				})
			);
			return;
		}

		this.chatManager.markChatAsRead(
			token,
			chatTypeValidation.value,
			parsed.identifier
		);
		this.chatManager.sendUnreadCountsUpdate(clients, token);
	}

	handleSetActiveChat(clients, token, websocket, parsed) {
		// Validate chat type
		const chatTypeValidation = ValidationUtils.validateChatType(
			parsed.chatType
		);
		if (!chatTypeValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: chatTypeValidation.error
				})
			);
			return;
		}

		this.chatManager.setActiveChat(
			token,
			chatTypeValidation.value,
			parsed.identifier
		);
		this.chatManager.sendUnreadCountsUpdate(clients, token);
	}

	cleanup(token) {
		this.rateLimiter.cleanup(token);
	}

	// Game command handlers
	async handleCreateGameRoom(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const config = {
			maxPlayers: Math.min(parsed.maxPlayers || 8, 8),
			minBet: parsed.minBet || 10,
			deckCount: Math.max(parsed.deckCount || 6, 6)
		};

		// Create regular room first
		this.roomManager.createRoom(token, roomValidation.value);

		// Then upgrade to game room
		const gameRoom = this.gameManager.createGameRoom(
			roomValidation.value,
			token,
			config
		);

		this.roomManager.sendRoomLists(clients);
		this.roomManager.sendJoinedRoomsUpdate(clients, token);
		this.roomManager.sendRoomUserCountUpdate(clients, roomValidation.value);

		// Send game state to all room members
		this.broadcastGameState(clients, gameRoom);

		// Send historical messages for this room
		this.chatManager.getHistoricalMessages(
			clients,
			token,
			"room",
			roomValidation.value
		);
	}

	async handleStartRoomGame(clients, token, websocket, parsed) {
		// Get user's current room
		const userRooms = this.roomManager.getUserRooms(token);
		if (!userRooms || userRooms.length === 0) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "You must be in a room to start a game"
				})
			);
			return;
		}

		const roomName = parsed.room || userRooms[0]; // Use specified room or current room

		// Validate room name
		const roomValidation = ValidationUtils.validateRoomName(roomName);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		// Check if room already has a game
		if (this.gameManager.getGameRoom(roomValidation.value)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "This room already has an active game"
				})
			);
			return;
		}

		const config = {
			maxPlayers: 8,
			minBet: 10,
			deckCount: 6
		};

		// Upgrade room to game room
		const gameRoom = this.gameManager.createGameRoom(
			roomValidation.value,
			token,
			config
		);

		// Send game state to all room members
		this.broadcastGameState(clients, gameRoom);

		// Send game event
		this.broadcastGameEvent(clients, gameRoom, {
			type: "game_room_created",
			message: `${auth.getUsername(
				token
			)} started a Blackjack game in this room!`
		});
	}

	async handleStartGame(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const result = await this.gameManager.startGame(
			token,
			roomValidation.value
		);

		if (!result.success) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: result.error
				})
			);
			return;
		}

		// Broadcast game state update to all room members
		this.broadcastGameState(clients, result.gameRoom);

		// Send game event
		this.broadcastGameEvent(clients, result.gameRoom, {
			type: "game_started",
			message: "Game has started! Place your bets."
		});
	}

	async handlePlaceBet(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const amount = parseInt(parsed.amount);
		if (isNaN(amount) || amount <= 0) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Invalid bet amount"
				})
			);
			return;
		}

		const result = this.gameManager.placeBet(
			token,
			roomValidation.value,
			amount
		);

		if (!result.success) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: result.error
				})
			);
			return;
		}

		// Broadcast game state update
		this.broadcastGameState(clients, result.gameRoom);

		// Send bet event
		const username = auth.getUsernameFromToken(token);
		this.broadcastGameEvent(clients, result.gameRoom, {
			type: "player_bet",
			player: username,
			amount: amount,
			message: `${username} placed a bet of ${amount} chips`
		});
	}

	async handlePlayerAction(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const validActions = ["hit", "stand", "double", "split"];
		if (!validActions.includes(parsed.action)) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Invalid action"
				})
			);
			return;
		}

		const result = await this.gameManager.processPlayerAction(
			token,
			roomValidation.value,
			parsed.action,
			parsed.data || {}
		);

		if (!result.success) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: result.error
				})
			);
			return;
		}

		// Broadcast game state update
		this.broadcastGameState(clients, result.gameRoom);

		// Send action event
		const username = auth.getUsernameFromToken(token);
		this.broadcastGameEvent(clients, result.gameRoom, {
			type: "player_action",
			player: username,
			action: parsed.action,
			result: result.actionResult,
			message: `${username} chose to ${parsed.action}`
		});
	}

	handleAddChips(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const result = this.gameManager.addChips(token, roomValidation.value);

		if (!result.success) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: result.error
				})
			);
			return;
		}

		// Send chips added confirmation
		websocket.send(
			JSON.stringify({
				type: "chips_added",
				newTotal: result.newChipTotal
			})
		);

		// Broadcast game state update if in a game room
		const gameRoom = this.gameManager.getGameRoom(roomValidation.value);
		if (gameRoom) {
			this.broadcastGameState(clients, gameRoom);
		}
	}

	handleGetGameState(clients, token, websocket, parsed) {
		const roomValidation = ValidationUtils.validateRoomName(parsed.room);
		if (!roomValidation.valid) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: roomValidation.error
				})
			);
			return;
		}

		const gameRoom = this.gameManager.getGameRoom(roomValidation.value);
		if (!gameRoom) {
			websocket.send(
				JSON.stringify({
					type: "error",
					message: "Not a game room"
				})
			);
			return;
		}

		// Send current game state to requesting client
		const socket = clients.get(token);
		if (socket && socket.readyState === socket.OPEN) {
			socket.send(
				JSON.stringify({
					type: "game_state",
					gameState: gameRoom.getGameState()
				})
			);
		}
	}

	// Helper methods for broadcasting game updates
	broadcastGameState(clients, gameRoom) {
		const gameState = gameRoom.getGameState();
		const message = JSON.stringify({
			type: "game_state",
			gameState
		});

		// Send to all room members
		gameRoom.getAllMembers().forEach((memberToken) => {
			const socket = clients.get(memberToken);
			if (socket && socket.readyState === socket.OPEN) {
				socket.send(message);
			}
		});
	}

	broadcastGameEvent(clients, gameRoom, event) {
		const message = JSON.stringify({
			type: "game_event",
			event,
			timestamp: new Date().toISOString()
		});

		// Send to all room members
		gameRoom.getAllMembers().forEach((memberToken) => {
			const socket = clients.get(memberToken);
			if (socket && socket.readyState === socket.OPEN) {
				socket.send(message);
			}
		});
	}
}

module.exports = MessageHandler;
