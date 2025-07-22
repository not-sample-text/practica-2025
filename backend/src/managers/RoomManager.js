// Room-specific functionality extracted from WebSocketManager

const auth = require("../auth");

class RoomManager {
	constructor(messageStore) {
		this.messageStore = messageStore;
		this.rooms = new Map(); // roomName -> Set of tokens
		this.initializeExistingRooms();
	}

	async initializeExistingRooms() {
		try {
			const existingRooms = await this.messageStore.getExistingRooms();
			existingRooms.forEach((roomName) => {
				if (!this.rooms.has(roomName)) {
					this.rooms.set(roomName, new Set());
					console.log(`Restored room: ${roomName}`);
				}
			});
		} catch (error) {
			console.error("Error initializing existing rooms:", error);
		}
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
		}
	}

	async sendRoomMessage(clients, token, roomName, content, chatManager) {
		const normalRoomName = roomName.trim().toLowerCase();
		const senderUsername = auth.getUsernameFromToken(token);

		if (!this.rooms.has(normalRoomName)) {
			return chatManager.sendErrorToClient(
				clients,
				token,
				`Room ${normalRoomName} does not exist.`
			);
		}

		const roomMembers = this.rooms.get(normalRoomName);
		if (!roomMembers.has(token)) {
			return chatManager.sendErrorToClient(
				clients,
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
			const memberSocket = clients.get(memberToken);
			if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
				memberSocket.send(messageToClients);

				// Increment unread count for all room members except sender
				if (memberToken !== token) {
					chatManager.incrementUnreadCount(memberToken, "room", normalRoomName);
				}
			}
		});
		console.log(
			`Message from ${senderUsername} in room '${normalRoomName}': ${content}`
		);
	}

	sendRoomLists(clients) {
		const availableRooms = Array.from(this.rooms.keys());
		const message = JSON.stringify({
			type: "available_rooms",
			content: availableRooms
		});
		clients.forEach((clientSocket) => {
			if (clientSocket.readyState === clientSocket.OPEN) {
				clientSocket.send(message);
			}
		});
	}

	sendJoinedRoomsUpdate(clients, targetToken) {
		const clientSocket = clients.get(targetToken);
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

	getUserRooms(token) {
		const userRooms = [];
		this.rooms.forEach((members, roomName) => {
			if (members.has(token)) {
				userRooms.push(roomName);
			}
		});
		return userRooms;
	}

	sendRoomUserCountUpdate(clients, roomName) {
		const members = this.rooms.get(roomName);
		if (!members) return;
		const count = members.size;
		const message = JSON.stringify({
			type: "room_user_count",
			room: roomName,
			count: count
		});
		clients.forEach((clientSocket) => {
			if (clientSocket.readyState === clientSocket.OPEN) {
				clientSocket.send(message);
			}
		});
	}

	getRoomMembers(roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		return this.rooms.get(normalRoomName) || new Set();
	}

	isUserInRoom(token, roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const roomMembers = this.rooms.get(normalRoomName);
		return roomMembers ? roomMembers.has(token) : false;
	}

	getAllRooms() {
		return Array.from(this.rooms.keys());
	}

	cleanupUserFromRooms(token) {
		this.rooms.forEach((members, roomName) => {
			if (members.has(token)) {
				members.delete(token);
				if (members.size === 0) {
					this.rooms.delete(roomName);
					console.log(`Room ${roomName} deleted due to no members.`);
				}
			}
		});
	}
}

module.exports = RoomManager;
