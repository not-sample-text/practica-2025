// Chat-specific functionality extracted from WebSocketManager

const auth = require("../auth");

class ChatManager {
	constructor(messageStore) {
		this.messageStore = messageStore;
		// Track which chat each user currently has open
		this.activeChats = new Map(); // token -> { type, identifier }
		// Track unread counts per user per chat
		this.unreadCounts = new Map(); // token -> { global: 0, rooms: {roomName: count}, private: {username: count} }
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
	}

	setActiveChat(token, chatType, identifier = null) {
		this.activeChats.set(token, { type: chatType, identifier });
		// Also mark the chat as read when it becomes active
		this.markChatAsRead(token, chatType, identifier);
	}

	getUnreadCounts(token) {
		return (
			this.unreadCounts.get(token) || {
				global: 0,
				rooms: {},
				private: {}
			}
		);
	}

	async broadcastMessage(clients, token, message) {
		const username = auth.getUsernameFromToken(token);
		const messageWithUser = { username, ...message };

		// Save global message
		try {
			await this.messageStore.saveMessage("global", null, messageWithUser);
		} catch (error) {
			console.error("Error saving global message:", error);
		}

		clients.forEach((client, clientToken) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify(messageWithUser));

				// Increment unread count for all other users
				if (clientToken !== token) {
					this.incrementUnreadCount(clientToken, "global");
				}
			}
		});
	}

	async privateMessage(clients, token, chatname, message) {
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
		clients.forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== chatname) return;
			if (socket.readyState === socket.OPEN) {
				socket.send(JSON.stringify(messageData));
				this.incrementUnreadCount(tokenTo, "private", senderUsername);
			}
		});

		// Send back to sender (for their own chat display)
		const senderSocket = clients.get(token);
		if (senderSocket && senderSocket.readyState === senderSocket.OPEN) {
			senderSocket.send(JSON.stringify(messageData));
		}
	}

	async getHistoricalMessages(clients, token, chatType, identifier) {
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

			const socket = clients.get(token);
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
			this.sendErrorToClient(clients, token, "Failed to load message history");
		}
	}

	sendUnreadCountsUpdate(clients, token) {
		const socket = clients.get(token);
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

	sendErrorToClient(clients, token, errorMessage) {
		const clientSocket = clients.get(token);
		if (clientSocket && clientSocket.readyState === clientSocket.OPEN) {
			clientSocket.send(
				JSON.stringify({ type: "error", message: errorMessage })
			);
		}
	}

	cleanupUserData(token) {
		this.unreadCounts.delete(token);
		this.activeChats.delete(token);
	}
}

module.exports = ChatManager;
