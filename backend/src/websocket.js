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

		if (!auth.isValidToken(token)) {
			ctx.websocket.send("token-Invalid or expired token");
			ctx.websocket.close();
			return;
		}

		(this.clients).set(token, ctx.websocket);
		console.log(`Socket client «${token}» added`);

		ctx.websocket.on('message', (message) => {
			// do something with the message from client
			console.log(`Received from client »»» `, message);

			let parsed = { type: 'message', content: message.toString() };
			try {
				parsed = JSON.parse(message.toString());
			} catch (e) { }
			// am putea avea orice in parsed;
			console.log('Parsed message', parsed);
			switch (parsed.type) {
				case 'disconnect':
					console.log('Client disconnected');
					ctx.websocket.close();
					break;
				case 'broadcast':
					this.broadcastMessage(token, parsed);
					break;
				default:
					console.log(`Unknown message type: ${message}`);
					return ctx.websocket.send(JSON.stringify({
						type: 'error',
						message: `Unknown message type: ${parsed.type}`
					}));
			}
			// broadcast the message to all connected clients
			(this.clients).forEach((client) => {
				if (client.readyState === client.OPEN) {
					console.log(token);
					client.send(JSON.stringify({ type: 'message', token: token, message: message.toString() }));
				}
			});
		});

		this.sendUsernames();

		ctx.websocket.on('close', () => {
			console.log('Client disconnected');
			(this.clients).delete(token);
			this.sendUsernames();
		});

	}

	broadcastMessage(token, message) {
		(this.clients).forEach((client) => {
			if (client.readyState === client.OPEN) {
				const username = auth.getUsernameFromToken(token);
				client.send(JSON.stringify({ username, ...message }));
			}
		});
	}

	sendUsernames() {
		if (this.clients?.size === 0) return;
		// const message = JSON.stringify({ type: 'usernames', usernames: this.usernames });
		const content = Array.from(this.clients.keys()).map(token => auth.getUsernameFromToken(token));
		(this.clients).forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify({ type: 'usernames', content }));
			}
		})
	}
}

module.exports = WebSocketManager;