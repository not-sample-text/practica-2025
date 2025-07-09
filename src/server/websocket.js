// WebSocket handling

const auth = require("./auth");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send("token–Invalid or expired token");
			ctx.websocket.close();
			return;
		}

		this.clients.set(token, ctx.websocket);

		ctx.websocket.on("message", (message) => {
			this.broadcastMessage(token, message);
		});

		ctx.websocket.on("close", () => {
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
