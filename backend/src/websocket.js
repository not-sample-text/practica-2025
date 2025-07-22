// WebSocket handling

const auth = require("./auth");
const MessageStore = require("./messageStore");
const ChatManager = require("./managers/ChatManager");
const RoomManager = require("./managers/RoomManager");
const MessageHandler = require("./managers/MessageHandler");
const GameManager = require("./managers/GameManager");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
		this.messageStore = new MessageStore();
		this.chatManager = new ChatManager(this.messageStore);
		this.roomManager = new RoomManager(this.messageStore);
		this.gameManager = new GameManager();
		this.messageHandler = new MessageHandler(
			this.chatManager,
			this.roomManager,
			this.gameManager
		);

		// Initialize existing rooms from saved messages
		this.roomManager.initializeExistingRooms();
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
		this.chatManager.initializeUnreadCounts(token);

		// Send initial unread counts to the user
		this.chatManager.sendUnreadCountsUpdate(this.clients, token);

		// Send historical global messages when user connects
		this.chatManager.getHistoricalMessages(this.clients, token, "global", null);

		ctx.websocket.on("message", async (message) => {
			console.log(`Received from client »»» `, message);

			let parsed = {
				type: "message",
				chatname: "",
				content: message.toString()
			};
			try {
				parsed = JSON.parse(message.toString());
			} catch (e) {}

			console.log("Parsed message", parsed);

			// Use message handler instead of switch statement
			await this.messageHandler.handleMessage(
				this.clients,
				token,
				ctx.websocket,
				parsed
			);
		});

		this.sendUsernames();
		this.roomManager.sendRoomLists(this.clients);
		this.roomManager.sendJoinedRoomsUpdate(this.clients, token);

		ctx.websocket.on("close", () => {
			console.log("Client disconnected");
			this.clients.delete(token);
			this.chatManager.cleanupUserData(token);
			this.roomManager.cleanupUserFromRooms(token);
			this.gameManager.cleanupUserFromGameRooms(token);
			this.messageHandler.cleanup(token);
			this.sendUsernames();
			this.roomManager.sendRoomLists(this.clients);
		});
	}

	sendUsernames() {
		if (this.clients?.size === 0) return;
		const content = Array.from(this.clients.keys()).map((token) =>
			auth.getUsernameFromToken(token)
		);
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify({ type: "usernames", content }));
			}
		});
	}
}

module.exports = WebSocketManager;
