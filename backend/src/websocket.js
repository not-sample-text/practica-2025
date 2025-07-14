// WebSocket handling

const auth = require("./auth");

class WebSocketManager {

	constructor() {
		this.clients = new Map();
		this.usernames = [];
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send("token-Invalid or expired token");
			ctx.websocket.close();
			return;
		}

		(this.clients).set(token, ctx.websocket);
		console.log(`Socket client «${token}» added`);
		const username = auth.getUsernameFromToken(token);
		this.usernames.push(username);

		ctx.websocket.on('message', (message) => {
			// do something with the message from client
			console.log(`Received ws from client: ${message}`);

			const parsed = JSON.parse(message);

			switch (parsed.type) {
				case 'getUsers':
					ctx.websocket.send(JSON.stringify({
						type: 'usernames',
						usernames: this.usernames
					}));
					break;
				case 'disconnect':
					console.log('Client disconnected');
					ctx.websocket.close();
					break;
			}

			
			// broadcast the message to all connected clients
			(this.clients).forEach((client) => {
				if (client.readyState === client.OPEN) {
					console.log(token);
					client.send(JSON.stringify({ type: 'message', token: token, message: message.toString() }));
				}
			});
		});

		if (usernames.length !== 0)
			this.sendUsernames();

		ctx.websocket.on('close', () => {
			console.log('Client disconnected');

			for (const [token, clientWs] of (this.clients).entries()) {
				if (clientWs === ctx.websocket) {
					(this.clients).delete(token);
					const index = (this.usernames).indexOf(username);
					if (index !== -1) {
						this.usernames.splice(index, 1);
					}
					break;
				}
			}
			this.sendUsernames();
		});

	}

	broadcastMessage(senderToken, message) {
		
		(this.clients).forEach((client) => {
			if (client.readyState === client.OPEN) {
				console.log(token);
				client.send(JSON.stringify({ type: 'message', token: senderToken, message: message.toString() }));
			}
		});
	}

	sendUsernames() {
		if (!this.clients || this.clients.size === 0) return;
		const message = JSON.stringify({ type: 'usernames', usernames: this.usernames });
		
		(this.clients).forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(message);
			}
		})
	}


}

module.exports = WebSocketManager;
