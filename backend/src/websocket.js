// WebSocket handling

const auth = require("./auth");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
			ctx.websocket.close();
			return;
		}

		this.clients.set(token, ctx.websocket);
		this.sendUsernames();

	ctx.websocket.on("message", (message) => {
		let parsed = { type: 'message', chatname: "", content: message.toString() };
		try {
			parsed = JSON.parse(message.toString());
		} catch (e) { }
		switch (parsed.type) {
			case 'disconnect':
				ctx.websocket.close();
				break;
			case 'broadcast':
				this.broadcastMessage(token, parsed);
				break;
			case 'invite':
				this.sendInvite(token, parsed.gamewith, parsed.gamename);
				break;
			case 'invitationresponse':
				this.invitationResponse(token, parsed.gamewith, parsed.response);
				break;

			case 'private':
				this.privateMessage(token, parsed.chatname, parsed);
				break;

			case 'move':
				this.handleMove(token, parsed.gameWith, parsed.move);
				break;
			default:
				ctx.websocket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${parsed.type}` }));
		}
	});

		ctx.websocket.on("close", () => {
			this.clients.delete(token);
			this.sendUsernames();
		});
	}

	privateMessage(token, chatname, message) {
		// Send to recipient
		this.clients.forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== chatname) return;
			if (socket.readyState === socket.OPEN) {
				const username = auth.getUsernameFromToken(token);
				socket.send(JSON.stringify({ username, ...message }));
			}
		});
		// Also send to sender
		const senderSocket = this.clients.get(token);
		if (senderSocket && senderSocket.readyState === senderSocket.OPEN) {
			const username = auth.getUsernameFromToken(token);
			senderSocket.send(JSON.stringify({ username, ...message }));
		}
	}

	sendInvite(token, gamewith, gamename = "") {
		const senderUsername = auth.getUsernameFromToken(token);
		this.clients.forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== gamewith) return;
			if (socket.readyState === socket.OPEN) {
				socket.send(JSON.stringify({ type: 'invite', from: senderUsername, game: gamename }));
			}
		});
	}

	handleMove(token, gameWith, move) {	
		const senderUsername = auth.getUsernameFromToken(token);
		this.clients.forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== gameWith) return;
			if (socket.readyState === socket.OPEN) {
				socket.send(JSON.stringify({
					type: 'move',
					move
				}));
			}
		});
	}

	broadcastMessage(token, message) {
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				const username = auth.getUsernameFromToken(token);
				client.send(JSON.stringify({ username, ...message }));
			}
		});
	}

	sendUsernames() {
		if (this.clients.size === 0) return;
		const content = Array.from(this.clients.keys()).map(token => auth.getUsernameFromToken(token));
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify({ type: 'usernames', content }));
			}
		});
	}

	invitationResponse(token, gameWith, response) {
	const senderUsername = auth.getUsernameFromToken(token);
	if (response === 'decline') {
	  // Notify only the sender with a custom message
	  this.clients.forEach((socket, tokenTo) => {
		if (auth.getUsernameFromToken(tokenTo) !== gameWith) return;
		if (socket.readyState === socket.OPEN) {
		  socket.send(JSON.stringify({
			type: 'invitationresponse',
			from: senderUsername,
			response,
			message: `${senderUsername} declined your invite.`
		  }));
		}
	  });
	  return;
	}
  // Notify the invitee with invitationresponse (for possible UI logic)
  this.clients.forEach((socket, tokenTo) => {
	if (auth.getUsernameFromToken(tokenTo) !== gameWith) return;
	if (socket.readyState === socket.OPEN) {
	  socket.send(JSON.stringify({ type: 'invitationresponse', from: senderUsername, response }));
	}
  });

  // If accepted, notify both users to start the game
  if (response === "accept") {
	// Notify the invitee
	this.clients.forEach((socket, tokenTo) => {
	  if (auth.getUsernameFromToken(tokenTo) === gameWith && socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify({ type: 'startgame', from: senderUsername, game: 'tictactoe' }));
	  }
	});
	// Notify the inviter
	this.clients.forEach((socket, tokenTo) => {
	  if (auth.getUsernameFromToken(tokenTo) === senderUsername && socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify({ type: 'startgame', from: gameWith, game: 'tictactoe' }));
	  }
	});
  }
  }
}




module.exports = WebSocketManager;
