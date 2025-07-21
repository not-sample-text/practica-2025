// WebSocket handling

const auth = require("./auth");

class WebSocketManager {

	constructor() {
		this.clients = new Map();
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send("Invalid or expired token");
			ctx.websocket.close();
			return;
		}

		if (this.userAlreadyConnected(token)) {
			const currentUsername = auth.getUsernameFromToken(token);
			console.log(`User  ${currentUsername} is already connected. Disconnecting previous session.`);
			this.forceDisconnectClient(currentUsername);
		}

		(this.clients).set(token, ctx.websocket);
		console.log(`Socket client «${token}» added`);

		ctx.websocket.on('message', (message) => {
			// do something with the message from client
			console.log(`Received from client »»» `, message);

			let parsed = { type: 'message', chatname: "", content: message.toString() };
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
				case 'private':
					this.privateMessage(token, parsed);
					break;
				case 'challenge':
					this.sendGameData(parsed);
					break;
				case 'game':
					this.sendGameData(parsed);
					break;
				default:
					console.log(`Unknown message type: ${message}`);
					return ctx.websocket.send(JSON.stringify({
						type: 'error',
						message: `Unknown message type: ${parsed.type}`
					}));
			}

		});

		this.sendUsernames();

		ctx.websocket.on('close', () => {
			console.log('Client disconnected');
			(this.clients).delete(token);
			this.sendUsernames();
		});

	}
	privateMessage(token, message) {

		const sender = auth.getUsernameFromToken(token); // username expeditor
		const recipient = message.to;
		const messageToSend = {
			type: 'private',
			sender: sender,
			to: recipient,
			content: message.content
		};

		// send message to recipient and sender
		(this.clients).forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) === recipient || auth.getUsernameFromToken(tokenTo) === sender) {
				if (socket.readyState === socket.OPEN) {
					socket.send(JSON.stringify(messageToSend));
				}
			}
		});
	}

	broadcastMessage(token, message) {
		const username = auth.getUsernameFromToken(token); // username expeditor
		const messageToSend = {
			type: 'broadcast',
			sender: username,
			to: 'broadcast',
			content: message.content
		}

		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify(messageToSend));
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

	// for sending game related data between users
	sendGameData(gameData) {

		const recipient = gameData.to;
		// send gameData to the requested user
		(this.clients).forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) === recipient) {
				if (socket.readyState === socket.OPEN) {
					socket.send(JSON.stringify(gameData));
				}
			}
		});

	}


	userAlreadyConnected(token) {
		const currentUsername = auth.getUsernameFromToken(token);

		for (const [token, session] of this.clients) {

			const clientUsername = auth.getUsernameFromToken(token);
			if (clientUsername === currentUsername) {
				return true;
			}
		}
		return false;
	}

	forceDisconnectClient(username) {
		for (const [token, socket] of this.clients) {

			const clientUsername = auth.getUsernameFromToken(token);

			if (clientUsername === username) {
				// Close the connection if it's still open
				if ([socket.OPEN, socket.CONNECTING].includes(socket.readyState)) {
					socket.close(1000, 'Forcefully disconnected by server');
				}

				this.clients.delete(token);
				console.log(`Forcefully disconnected client ${username}`);

				break;
			}
		}
	}

}

module.exports = WebSocketManager;
