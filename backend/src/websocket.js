// WebSocket handling

const auth = require("./auth");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
	}

	handleConnection(ctx) {
		console.log("New WebSocket connection attempt");

		const token = ctx.cookies.get("token")
		console.log("WebSocket connection attempt with token:", token);

		if(!auth.isValidToken(token)) {
			console.log("Invalid token, closing connection.");
			ctx.websocket.close(1008, "Invalid token");
			return;
		}

		console.log("Valid token, proceeding with connection.");
		this.clients.set(token, ctx.websocket);
		
		ctx.websocket.on("error", (error) => {
			console.error("WebSocket server error:", error);
			this.clients.delete(token);
		});
		ctx.websocket.on("open", () => {
			console.log("WebSocket connection opened for token:", token);
		});

		ctx.websocket.on("message", (message) => {
			console.log("Received message:", message, "from token:", token);
			this.broadcastMessage(token, message);
		});

		ctx.websocket.on("close", () => {
			console.log("WebSocket connection closed for token:", token);
			this.clients.delete(token);
		});
	}

	broadcastMessage(senderToken, message) {
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(`${senderToken}–${message}`);
			}
		});
	}
}

module.exports = WebSocketManager;
