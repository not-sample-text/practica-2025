// WebSocket handling

const auth = require("./auth");
const Client = require('./client')
const constants = require("../../shared/constants");

class WebSocketManager {
	constructor() {
		this.clients = new Map();
		this.validResponses = new Map([
			['broadcast', this.broadcast.bind(this)],
			['private_broadcast', this.privateBroadcast.bind(this)],
			['refresh_users', this.refreshUsers.bind(this)],
			['load_messages', this.loadMessageHistory.bind(this)]
			// ['disconnect', this.clientDisconnect.bind(this)],
		])
		this.globalRooms = new Map([
			['general', []],
		]);
		this.privateRooms = new Map();
	}

	// response should be { type: 'load_messages', content: '...' } where cotent is the room to load message from
	loadMessageHistory(token, response) {
		const sender = this.clients.get(token)
		const target = response.content;
		if (!sender || !target) return;

		let messages; let room;
		if (this.globalRooms.has(response.content)) {
			room = response.content;
			messages = this.globalRooms.get(response.content);
		} else {
			room = [sender.username, target].sort().join(':');
			messages = this.privateRooms.get(room) || [];
		}

		console.log("Sending a update history event with: ", response)
		sender.room = room;
		sender.ws.send(JSON.stringify({ type: 'update_history', messages: messages }))
		// implement for privat aswell later, if im happy with the global / private rooms system
	}


	refreshUsers(token, response) {
		const content = Array.from(this.clients.values()).map(client => client.username);
		this.clients.forEach((client) => {
			if (client.ws.readyState === WebSocket.OPEN) {
				client.ws.send(JSON.stringify({ type: 'usernames', content }));
			}
		})

	}

	// response: { type: 'broadcast', content: 'sample text', chatContext: 'general' }
	// content => text being sent
	// chatContext => which room to send it in
	broadcast(token, response) {
		console.log("BROADCAST RESPONSE: ", response);
		this.globalRooms.has(response.chatContext) ?
			this.roomBroadcast(token, response) :
			this.privateBroadcast(token, response);

	}

	privateBroadcast(token, response) {
		const sender = this.clients.get(token)
		if (!sender) return

		if (sender.username === response.chatContext) {
			console.log(`${sender} tried to send a message to himself`)
			return
		}

		// could make this a method if we need getTokenFromUsername more..
		let target;
		for (const [key, value] of this.clients) {
			if (auth.getUsernameFromToken(key) === response.chatContext) {
				target = value;
				break;
			}
		}

		if (!target) return;

		const room = [sender.username, target.username].sort().join(':');

		sender.ws.send(JSON.stringify({ username: sender.username, ...response }))
		console.log("Target: ", target.room, " Sender: ", sender.room);
		// if person is in 'general' while somebody sends them a message
		// don't show that message (only when they switch and load full chat OR they are in thew room aswell)
		if (target.room === room) {
			target.ws.send(JSON.stringify({ username: sender.username, ...response }))
		}
		else {
			target.ws.send(JSON.stringify({ type: 'mark_unread', content:sender.username}))
		}

		let messages = this.privateRooms.get(room) ?? [];
		messages.push({ username: sender.username, content: response.content })

		this.privateRooms.set(room, messages);
	}

	roomBroadcast(token, response) {
		const sender = this.clients.get(token)
		if (!sender) return;

		const messages = this.globalRooms.get(response.chatContext) || [];
		messages.push({ username: sender.username, content: response.content })
		this.globalRooms.set(response.chatContext, messages);

		this.clients.forEach((client, key) => {
			if (client.ws.readyState === WebSocket.OPEN) {
				client.ws.send(JSON.stringify({ username: sender.username, messages: messages, ...response }));
			}
		})
	}

	routeResponse(token, message) {
		let response
		try {
			response = JSON.parse(message.toString());
		} catch {
			console.log("Invalid message: ", message)
			return;
		}

		if (!response || !response.type) return;

		const handler = this.validResponses.get(response.type);
		if (handler) {
			handler(token, response);
		}
		else {
			console.log("Unknown response received: ", response.type)
			return;
		}
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send("token-Invalid or expired token");
			ctx.websocket.close();
			return;
		}

		let client = new Client(ctx.websocket, token, constants.DEFAULT_JOIN_ROOM);
		this.clients.set(token, client);

		this.refreshUsers(1, 1);
		ctx.websocket.on('message', (message) => {
			this.routeResponse(token, message);
		});

		this.sendUsernames();

		ctx.websocket.on('close', () => {
			console.log('Client disconnected');
			(this.clients).delete(token);
			this.sendUsernames();
		});

	}
	privateMessage(token, chatname, message) {
		(this.clients).forEach((socket, tokenTo) => {
			if (auth.getUsernameFromToken(tokenTo) !== chatname) return; // skip if not the intended recipient
			if (socket.readyState === socket.OPEN) {
				const username = auth.getUsernameFromToken(token); // username expeditor
				socket.send(JSON.stringify({ username, ...message }));
			}
		});
	}

	broadcastMessage(token, message) {
		(this.clients).forEach((client) => {
			if (client.readyState === client.OPEN) {
				const username = auth.getUsernameFromToken(token); // username expeditor
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
