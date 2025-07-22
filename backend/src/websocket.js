// WebSocket handling

const auth = require("./auth");
const MessageStore = require("./messageStore");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
		this.rooms = new Map();
		this.messageStore = new MessageStore();
		// Track which chat each user currently has open
		this.activeChats = new Map(); // token -> { type, identifier }
		// Track unread counts per user per chat
		this.unreadCounts = new Map(); // token -> { global: 0, rooms: {roomName: count}, private: {username: count} }
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send(
				JSON.stringify({
					type: "error",
					message: "Invalid or expired token"
				})
			);
			ctx.websocket.close();
			return;
		}

		this.clients.set(token, ctx.websocket);
		console.log(`Socket client «${token}» added`);

		// Initialize unread counts for new user
		this.initializeUnreadCounts(token);

		// Send initial unread counts to the user
		this.sendUnreadCountsUpdate(token);

		// Send historical global messages when user connects
		this.sendHistoricalMessages(token, "global", null);

		ctx.websocket.on("message", (message) => {
			// do something with the message from client
			console.log(`Received from client »»» `, message);

			let parsed = {
				type: "message",
				chatname: "",
				content: message.toString()
			};
			try {
				parsed = JSON.parse(message.toString());
			} catch (e) {}
			// am putea avea orice in parsed;
			console.log("Parsed message", parsed);
			switch (parsed.type) {
				case "disconnect":
					console.log("Client disconnected");
					ctx.websocket.close();
					break;
				case "broadcast":
					this.broadcastMessage(token, parsed);
					break;
				case "private":
					this.privateMessage(token, parsed.chatname, parsed);
					break;
				case "create_room":
					this.createRoom(token, parsed.room);
					break;
				case "join_room":
					this.joinRoom(token, parsed.room);
					break;
				case "leave_room":
					this.leaveRoom(token, parsed.room);
					break;
				case "sendRoomMessage":
					this.sendRoomMessage(token, parsed.room, parsed.content);
					break;
				case "get_messages":
					this.getHistoricalMessages(token, parsed.chatType, parsed.identifier);
					break;
				case "mark_chat_read":
					this.markChatAsRead(token, parsed.chatType, parsed.identifier);
					break;
				case "set_active_chat":
					this.setActiveChat(token, parsed.chatType, parsed.identifier);
					break;
				default:
					console.log(`Unknown message type: ${message}`);
					return ctx.websocket.send(
						JSON.stringify({
							type: "error",
							message: `Unknown message type: ${parsed.type}`
						})
					);
			}
		});

		this.sendUsernames();
		this.sendRoomLists();
		this.sendJoinedRoomsUpdate(token);

		ctx.websocket.on("close", () => {
			console.log("Client disconnected");
			this.clients.delete(token);
			this.cleanupUserData(token);
			this.sendUsernames();
		});
	}

	createRoom(token, roomName) {
		if (!roomName || roomName.trim() === "") return;

		const normalRoomName = roomName.trim().toLowerCase();
		if (this.rooms.has(normalRoomName)) {
			console.log(`Room ${normalRoomName} already exists, joining.`);
			this.joinRoom(token, normalRoomName);
			return;
		}
		this.rooms.set(normalRoomName, new Set());
		console.log(`Room ${normalRoomName} created`);
		this.joinRoom(token, normalRoomName);
		this.sendRoomLists();
	}

	joinRoom(token, roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const username = auth.getUsernameFromToken(token);

		if (!this.rooms.has(normalRoomName)) {
			this.createRoom(token, normalRoomName);
			return;
		}
		const roomMembers = this.rooms.get(normalRoomName);
		if (roomMembers.has(token)) {
			console.log(`${username} is already in room ${normalRoomName}`);
			return;
		}

		roomMembers.add(token);
		console.log(`${username} joined room ${normalRoomName}`);

		this.sendJoinedRoomsUpdate(token);
		this.sendRoomUserCountUpdate(normalRoomName);

		// Send historical messages for this room
		this.sendHistoricalMessages(token, "room", normalRoomName);
	}

	leaveRoom(token, roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const username = auth.getUsernameFromToken(token);

		if (!this.rooms.has(normalRoomName)) {
			console.log(`Room ${normalRoomName} does not exist`);
			return;
		}
		const roomMembers = this.rooms.get(normalRoomName);
		if (!roomMembers.has(token)) {
			console.log(`${username} is not in room ${normalRoomName}`);
			return;
		}

		roomMembers.delete(token);

		if (roomMembers.size === 0) {
			this.rooms.delete(normalRoomName);
			console.log(`Room ${normalRoomName} deleted.`);
			this.sendRoomLists();
		} else {
			this.sendRoomUserCountUpdate(normalRoomName);
		}
		this.sendJoinedRoomsUpdate(token);
	}

	async sendRoomMessage(token, roomName, content) {
		const normalRoomName = roomName.trim().toLowerCase();
		const senderUsername = auth.getUsernameFromToken(token);

		if (!this.rooms.has(normalRoomName)) {
			return this.sendErrorToClient(
				token,
				`Room ${normalRoomName} does not exist.`
			);
		}

		const roomMembers = this.rooms.get(normalRoomName);
		if (!roomMembers.has(token)) {
			return this.sendErrorToClient(
				token,
				`You are not in room ${normalRoomName}.`
			);
		}

		const messageData = {
			type: "room_message",
			room: normalRoomName,
			sender: senderUsername,
			content: content,
			timestamp: new Date().toISOString()
		};

		// Save room message
		try {
			await this.messageStore.saveMessage("room", normalRoomName, messageData);
		} catch (error) {
			console.error("Error saving room message:", error);
		}

		const messageToClients = JSON.stringify(messageData);

		roomMembers.forEach((memberToken) => {
			const memberSocket = this.clients.get(memberToken);
			if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
				memberSocket.send(messageToClients);

				// Increment unread count for all room members except sender
				if (memberToken !== token) {
					this.incrementUnreadCount(memberToken, "room", normalRoomName);
				}
			}
		});
		console.log(
			`Message from ${senderUsername} in room '${normalRoomName}': ${content}`
		);
	}

	sendRoomLists() {
		const availableRooms = Array.from(this.rooms.keys());
		const message = JSON.stringify({
			type: "available_rooms",
			content: availableRooms
		});
		this.clients.forEach((clientSocket) => {
			if (clientSocket.readyState === clientSocket.OPEN) {
				clientSocket.send(message);
			}
		});
	}

	sendJoinedRoomsUpdate(targetToken) {
		const clientSocket = this.clients.get(targetToken);
		if (!clientSocket || clientSocket.readyState !== clientSocket.OPEN) return;

		const joinedRoomsForClient = [];
		this.rooms.forEach((members, roomName) => {
			if (members.has(targetToken)) {
				joinedRoomsForClient.push(roomName);
			}
		});
		clientSocket.send(
			JSON.stringify({ type: "joined_rooms", content: joinedRoomsForClient })
		);
	}

	sendRoomUserCountUpdate(roomName) {
		const members = this.rooms.get(roomName);
		if (!members) return;
		const count = members.size;
		const message = JSON.stringify({
			type: "room_user_count",
			room: roomName,
			count: count
		});
		this.clients.forEach((clientSocket) => {
			if (clientSocket.readyState === clientSocket.OPEN) {
				clientSocket.send(message);
			}
		});
	}

	sendErrorToClient(token, errorMessage) {
		const clientSocket = this.clients.get(token);
		if (clientSocket && clientSocket.readyState === clientSocket.OPEN) {
			clientSocket.send(
				JSON.stringify({ type: "error", message: errorMessage })
			);
		}
	}

	async privateMessage(token, chatname, message) {
		const senderUsername = auth.getUsernameFromToken(token);
		const messageData = {
			...message,
			type: "private",
			username: senderUsername,
			sender: senderUsername,
			chatname: chatname,
			timestamp: new Date().toISOString()
		};

		// Save private message
		try {
			await this.messageStore.saveMessage(
				"private",
				{
					user1: senderUsername,
					user2: chatname
				},
				messageData
			);
		} catch (error) {
			console.error("Error saving private message:", error);
		}

		// Send to recipient and increment unread count
		this.clients.forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== chatname) return;
			if (socket.readyState === socket.OPEN) {
				socket.send(JSON.stringify(messageData));
				this.incrementUnreadCount(tokenTo, "private", senderUsername);
			}
		});

		// Send back to sender (for their own chat display)
		const senderSocket = this.clients.get(token);
		if (senderSocket && senderSocket.readyState === senderSocket.OPEN) {
			senderSocket.send(JSON.stringify(messageData));
		}
	}
	async broadcastMessage(token, message) {
		const username = auth.getUsernameFromToken(token);
		const messageWithUser = { username, ...message };

		// Save global message
		try {
			await this.messageStore.saveMessage("global", null, messageWithUser);
		} catch (error) {
			console.error("Error saving global message:", error);
		}

		this.clients.forEach((client, clientToken) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify(messageWithUser));

				// Increment unread count for all other users
				if (clientToken !== token) {
					this.incrementUnreadCount(clientToken, "global");
				}
			}
		});
	}
	sendUsernames() {
		if (this.clients?.size === 0) return;
		// const message = JSON.stringify({ type: 'usernames', usernames: this.usernames });
		const content = Array.from(this.clients.keys()).map((token) =>
			auth.getUsernameFromToken(token)
		);
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify({ type: "usernames", content }));
			}
		});
	}

	async getHistoricalMessages(token, chatType, identifier) {
		try {
			let messages = [];
			const username = auth.getUsernameFromToken(token);

			switch (chatType) {
				case "global":
					messages = await this.messageStore.getMessages("global", null);
					break;
				case "room":
					messages = await this.messageStore.getMessages("room", identifier);
					break;
				case "private":
					messages = await this.messageStore.getMessages("private", {
						user1: username,
						user2: identifier
					});
					break;
			}

			const socket = this.clients.get(token);
			if (socket && socket.readyState === socket.OPEN) {
				socket.send(
					JSON.stringify({
						type: "historical_messages",
						chatType,
						identifier,
						messages
					})
				);
			}
		} catch (error) {
			console.error("Error getting historical messages:", error);
			this.sendErrorToClient(token, "Failed to load message history");
		}
	}

	async sendHistoricalMessages(token, chatType, identifier) {
		await this.getHistoricalMessages(token, chatType, identifier);
	}

	initializeUnreadCounts(token) {
		this.unreadCounts.set(token, {
			global: 0,
			rooms: {},
			private: {}
		});
		this.activeChats.set(token, null);
	}

	incrementUnreadCount(token, chatType, identifier = null) {
		if (!this.unreadCounts.has(token)) {
			this.initializeUnreadCounts(token);
		}

		const counts = this.unreadCounts.get(token);
		const activeChat = this.activeChats.get(token);

		// Don't increment if this is the chat the user currently has open
		if (
			activeChat &&
			activeChat.type === chatType &&
			activeChat.identifier === identifier
		) {
			return;
		}

		switch (chatType) {
			case "global":
				counts.global++;
				break;
			case "room":
				if (!counts.rooms[identifier]) counts.rooms[identifier] = 0;
				counts.rooms[identifier]++;
				break;
			case "private":
				if (!counts.private[identifier]) counts.private[identifier] = 0;
				counts.private[identifier]++;
				break;
		}

		this.sendUnreadCountsUpdate(token);
	}

	markChatAsRead(token, chatType, identifier = null) {
		if (!this.unreadCounts.has(token)) {
			this.initializeUnreadCounts(token);
		}

		const counts = this.unreadCounts.get(token);

		switch (chatType) {
			case "global":
				counts.global = 0;
				break;
			case "room":
				if (counts.rooms[identifier]) {
					counts.rooms[identifier] = 0;
				}
				break;
			case "private":
				if (counts.private[identifier]) {
					counts.private[identifier] = 0;
				}
				break;
		}

		this.sendUnreadCountsUpdate(token);
	}

	setActiveChat(token, chatType, identifier = null) {
		this.activeChats.set(token, { type: chatType, identifier });
		// Also mark the chat as read when it becomes active
		this.markChatAsRead(token, chatType, identifier);
	}

	sendUnreadCountsUpdate(token) {
		const socket = this.clients.get(token);
		if (socket && socket.readyState === socket.OPEN) {
			const counts = this.unreadCounts.get(token);
			socket.send(
				JSON.stringify({
					type: "unread_counts",
					counts
				})
			);
		}
	}

	cleanupUserData(token) {
		this.unreadCounts.delete(token);
		this.activeChats.delete(token);
	}
}

module.exports = WebSocketManager;
