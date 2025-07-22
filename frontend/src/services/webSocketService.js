// WebSocket service for handling connection and message processing

class WebSocketService {
	constructor() {
		this.websocket = null;
		this.reconnectTimeout = null;
		this.isConnecting = false;
		this.messageQueue = [];
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
		this.baseReconnectDelay = 1000;
		this.listeners = new Map();
	}

	connect(username, actions) {
		// Clear any existing reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		// Close existing connection
		if (this.websocket) {
			this.websocket.close();
		}

		if (this.isConnecting) {
			return Promise.resolve();
		}

		this.isConnecting = true;
		this.actions = actions;

		const wsUrl = "ws://localhost:3000/ws";
		console.log("Connecting to WebSocket at:", wsUrl);

		return new Promise((resolve, reject) => {
			try {
				this.websocket = new WebSocket(wsUrl);
				actions.setWebSocket(this.websocket);

				this.websocket.onopen = () => {
					console.log("WebSocket connected");
					this.isConnecting = false;
					this.reconnectAttempts = 0;
					actions.setConnectionStatus("connected");

					// Send queued messages
					this.processMessageQueue();
					resolve();
				};

				this.websocket.onmessage = (event) => {
					this.handleMessage(event, actions);
				};

				this.websocket.onclose = (event) => {
					console.log("WebSocket disconnected", event);
					this.isConnecting = false;
					actions.setConnectionStatus("disconnected");

					// Auto-reconnect with exponential backoff if not intentionally closed
					if (
						!event.wasClean &&
						username &&
						this.reconnectAttempts < this.maxReconnectAttempts
					) {
						const delay =
							this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
						this.reconnectAttempts++;

						console.log(
							`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
						);
						this.reconnectTimeout = setTimeout(() => {
							this.connect(username, actions);
						}, delay);
					} else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
						actions.setError("Failed to reconnect after multiple attempts");
					}
				};

				this.websocket.onerror = (error) => {
					console.error("WebSocket error:", error);
					this.isConnecting = false;
					actions.setConnectionStatus("error");
					reject(error);
				};
			} catch (error) {
				console.error("Failed to create WebSocket connection:", error);
				this.isConnecting = false;
				actions.setConnectionStatus("error");
				reject(error);
			}
		});
	}

	disconnect() {
		// Clear reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.websocket) {
			this.websocket.close();
			this.websocket = null;
		}

		this.isConnecting = false;
		this.reconnectAttempts = 0;
		this.messageQueue = [];
	}

	sendMessage(messageData) {
		if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
			try {
				this.websocket.send(JSON.stringify(messageData));
				return true;
			} catch (error) {
				console.error("Error sending message:", error);
				// Queue message for retry
				this.messageQueue.push(messageData);
				return false;
			}
		} else {
			// Queue message if not connected
			this.messageQueue.push(messageData);
			return false;
		}
	}

	processMessageQueue() {
		while (this.messageQueue.length > 0) {
			const message = this.messageQueue.shift();
			if (!this.sendMessage(message)) {
				// Put it back if sending failed
				this.messageQueue.unshift(message);
				break;
			}
		}
	}

	handleMessage(event, actions) {
		try {
			const data = JSON.parse(event.data);
			console.log("Received WebSocket message:", data);

			switch (data.type) {
				case "historical_messages":
					actions.addHistoricalMessages(
						data.chatType,
						data.identifier,
						data.messages
					);
					break;

				case "private":
					actions.addMessage({
						content: data.content,
						username: data.username,
						type: "private",
						sender: data.sender,
						timestamp: data.timestamp || new Date().toISOString()
					});
					break;

				case "broadcast":
					actions.addMessage({
						content: data.content,
						username: data.username,
						type: "broadcast",
						timestamp: data.timestamp || new Date().toISOString()
					});
					break;

				case "usernames":
					// Filter out current user from the list
					const currentUser = actions.user?.username;
					const filteredUsers = (data.content || []).filter(
						(user) => user !== currentUser
					);
					actions.setUsers(filteredUsers);
					break;

				case "room_message":
					actions.addMessage({
						type: "room_message",
						room: data.room,
						sender: data.sender,
						content: data.text || data.content,
						timestamp: data.timestamp || new Date().toISOString()
					});
					break;

				case "available_rooms":
					actions.setAvailableRooms(data.content || []);
					break;

				case "joined_rooms":
					actions.setJoinedRooms(data.content || []);
					break;

				case "room_user_count":
					actions.setRoomUserCount(data.room, data.count);
					break;

				case "unread_counts":
					actions.setUnreadCounts(
						data.counts || {
							global: 0,
							rooms: {},
							private: {}
						}
					);
					break;

				case "error":
					console.error("WebSocket error:", data.message);
					actions.setError(data.message);
					break;

				// Game events
				case "game_state_update":
					this.handleGameEvent(data, actions);
					break;

				case "player_state_update":
					this.handleGameEvent(data, actions);
					break;

				case "hand_update":
					this.handleGameEvent(data, actions);
					break;

				case "timer_update":
					this.handleGameEvent(data, actions);
					break;

				case "actions_available":
					this.handleGameEvent(data, actions);
					break;

				case "chips_update":
					this.handleGameEvent(data, actions);
					break;

				case "bet_update":
					this.handleGameEvent(data, actions);
					break;

				case "game_event":
					this.handleGameEvent(data, actions);
					break;

				default:
					console.warn("Unknown message type:", data);
					break;
			}
		} catch (e) {
			console.error("Error parsing WebSocket message:", e);
			actions.setError("Failed to process message from server");
		}
	}

	// Convenience methods for common operations
	requestHistoricalMessages(chatType, identifier) {
		return this.sendMessage({
			type: "get_messages",
			chatType,
			identifier
		});
	}

	markChatAsRead(chatType, identifier) {
		return this.sendMessage({
			type: "mark_chat_read",
			chatType,
			identifier
		});
	}

	// Game event handler
	handleGameEvent(data, actions) {
		console.log("Handling game event:", data);

		switch (data.type) {
			case "game_state_update":
				actions.setGameState(data.gameState);
				break;

			case "player_state_update":
				actions.updatePlayerState(data.username, data.playerState);
				break;

			case "hand_update":
				if (data.hand.type === "dealer") {
					actions.setDealerHand(data.hand);
				} else {
					actions.setPlayerHand(data.username, data.hand);
				}
				break;

			case "timer_update":
				actions.setGameTimer(data.timer);
				break;

			case "actions_available":
				actions.setGameActions(data.actions);
				break;

			case "chips_update":
				actions.setChips(data.chips);
				break;

			case "bet_update":
				actions.setCurrentBet(data.bet);
				break;

			case "game_event":
				// Handle nested game events
				if (data.event) {
					this.handleGameEvent(data.event, actions);
				}
				break;

			default:
				console.warn("Unknown game event type:", data.type);
		}

		// Emit custom events for game listeners
		this.emitToListeners("game_event", data);
	}

	// Event listener system for game components
	addEventListener(eventType, callback) {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}
		this.listeners.get(eventType).add(callback);
	}

	removeEventListener(eventType, callback) {
		if (this.listeners.has(eventType)) {
			this.listeners.get(eventType).delete(callback);
		}
	}

	emitToListeners(eventType, data) {
		if (this.listeners.has(eventType)) {
			this.listeners.get(eventType).forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error("Error in event listener:", error);
				}
			});
		}
	}

	setActiveChat(chatType, identifier) {
		return this.sendMessage({
			type: "set_active_chat",
			chatType,
			identifier
		});
	}

	// Room operations
	createRoom(roomName) {
		return this.sendMessage({
			type: "create_room",
			room: roomName
		});
	}

	joinRoom(roomName) {
		return this.sendMessage({
			type: "join_room",
			room: roomName
		});
	}

	leaveRoom(roomName) {
		return this.sendMessage({
			type: "leave_room",
			room: roomName
		});
	}

	sendRoomMessage(roomName, content) {
		return this.sendMessage({
			type: "sendRoomMessage",
			room: roomName,
			content
		});
	}

	// Chat operations
	sendBroadcastMessage(content) {
		return this.sendMessage({
			type: "broadcast",
			content
		});
	}

	sendPrivateMessage(target, content) {
		return this.sendMessage({
			type: "private",
			target,
			content
		});
	}

	// Game operations
	createGameRoom(roomName, maxPlayers = 8) {
		return this.sendMessage({
			type: "create_game_room",
			roomName,
			maxPlayers
		});
	}

	startGame() {
		return this.sendMessage({
			type: "start_game"
		});
	}

	placeBet(amount) {
		return this.sendMessage({
			type: "place_bet",
			amount
		});
	}

	playerAction(action, data = {}) {
		return this.sendMessage({
			type: "player_action",
			action,
			...data
		});
	}

	addChips(amount = 1000) {
		return this.sendMessage({
			type: "add_chips",
			amount
		});
	}

	joinAsPlayer() {
		return this.sendMessage({
			type: "join_as_player"
		});
	}

	joinAsSpectator() {
		return this.sendMessage({
			type: "join_as_spectator"
		});
	}

	getConnectionStatus() {
		if (!this.websocket) return "disconnected";

		switch (this.websocket.readyState) {
			case WebSocket.CONNECTING:
				return "connecting";
			case WebSocket.OPEN:
				return "connected";
			case WebSocket.CLOSING:
				return "disconnecting";
			case WebSocket.CLOSED:
			default:
				return "disconnected";
		}
	}
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
