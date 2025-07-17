const auth = require("./auth");

class WebSocketManager {

	constructor() {
		this.clients = new Map();
		this.rooms = new Map();
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

		ctx.websocket.on('message', (message) => {
			// do something with the message from client
			console.log(`Received from client »»» `, message);

			let parsed = { type: 'message', content: message.toString() };
			try {
				parsed = JSON.parse(message.toString());
			} catch (e) { console.error('Error parsing message:', e); }
			console.log('Parsed Err', parsed);
			switch (parsed.type) {
				case 'disconnect':
					console.log('Client disconnected');
					ctx.websocket.close();
					break;
				case 'broadcast':
					this.broadcastMessage(token, parsed);
					break;
				case 'private_message':
					console.log('Private message received', parsed);
					this.sendPrivateMessage(token, parsed);
					break;
				case 'create_room':
					this.createRooms(token, parsed.room);
					break;
				case 'join_room':
					this.joinRoom(token, parsed.room);
					break;
				case 'leave_room':
					this.leaveRoom(token, parsed.room);
					break;
				case 'sendRoomMessage':
					this.sendRoomMessage(token, parsed.room, parsed.text)	;
					break;
				default:
					console.log(`Unknown message type: ${message}`);
					return ctx.websocket.send(JSON.stringify({
						type: 'error',
						message: `Unknown message type: ${parsed.type}`
					}));
			}
			// broadcast the message to all connected clients
			// (this.clients).forEach((client) => {
			// 	if (client.readyState === client.OPEN) {
			// 		console.log(token);
			// 		client.send(JSON.stringify({ type: 'message', token: token, message: message.toString() }));
			// 	}
			// });
		});

		this.sendUsernames();
		this.sendRoomLists();     // NOU: Lista camerelor disponibile
        this.sendJoinedRoomsUpdate(token);

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

	sendPrivateMessage(token, message) {
		const senderUsername = auth.getUsernameFromToken(token);
		const recipientUsername = message.to;
		const messageToSend = {
			type:'private_message',
			sender: senderUsername,
			to: recipientUsername,
			text: message.text
		};

		const senderClient = this.clients.get(token);
		if(senderClient && senderClient.readyState === senderClient.OPEN){
			senderClient.send(JSON.stringify(messageToSend))
		}
		this.clients.forEach((client, token)=>{
			const clientUsername =auth.getUsernameFromToken(token);
			if(clientUsername === recipientUsername && client.readyState === client.OPEN){
				client.send(JSON.stringify(messageToSend));
			}
		})
	}


	createRooms(token, roomName) {
		if(!roomName || roomName.trim() === '') {
			return;
		}
		const normalRoomName = roomName.trim().toLowerCase();
		if(this.rooms.has(normalRoomName)){
			console.log(`Room ${normalRoomName} already exists`);
			this.joinRoom(token, normalRoomName);
			return;	
		}
		this.rooms.set(normalRoomName, new Set());
		console.log(`Room ${normalRoomName} created`);
		this.joinRoom(token, normalRoomName);
		this.sendRoomLists();
	}

	joinRoom(token, roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const username = auth.getUsernameFromToken(token);

		if(!this.rooms.has(normalRoomName)) {
			this.createRooms(token, normalRoomName);
			return;
		}
		const roomMemebers = this.rooms.get(normalRoomName);
		if(roomMemebers.has(token)){
			console.log(`${username} is already in room ${normalRoomName}`);
			return;
		}

		roomMemebers.add(token);
		console.log(`${username} joined room ${normalRoomName}`);

		this.sendJoinedRoomsUpdate(token);
		this.sendRoomUserCountUpdate(normalRoomName);

	}

	leaveRoom(token, roomName) {
		const normalRoomName = roomName.trim().toLowerCase();
		const username = auth.getUsernameFromToken(token);
		if(!this.rooms.has(normalRoomName)) {
			console.log(`Room ${normalRoomName} does not exist`);
			return;
		}
		const roomMemebers = this.rooms.get(normalRoomName)
		if(!roomMemebers.has(token)) {
			console.log(`${username} is not in room ${normalRoomName}`);
			return;
		}
		this.sendRoomMessage(token, normalRoomName, `${username} has left the room`);
		roomMemebers.delete(token);

		if(roomMemebers.size === 0 ){
			this.rooms.delete(normalRoomName);
			console.log(`Room ${normalRoomName} deleted`);
		}
		this.sendJoinedRoomsUpdate(token);
		this.sendRoomUserCountUpdate(normalRoomName);
	}

	sendRoomMessage(token,roomName, text) {
		const normalRoomName = roomName.trim().toLowerCase();
		const senderUsername = auth.getUsernameFromToken(token);
		if(!this.rooms.has(normalRoomName)) {
			console.log(`Room ${normalRoomName} does not exist`);
			const senderSocket = this.clients.get(token);
			if(senderSocket && senderSocket.readyState === senderSocket.OPEN) {
				senderSocket.send(JSON.stringify({type: 'error', message: `Room ${normalRoomName} does not exist`}));
			}
			return;
		}

		const roomMembers = this.rooms.get(normalRoomName);
		if(!roomMembers.has(token)) {
			const senderSocket = this.clients.get(token);
			if(senderSocket && senderSocket.readyState === senderSocket.OPEN) {
				senderSocket.send(JSON.stringify({type: 'error', message: `You are not in room ${normalRoomName}`}));
			}
			return;
		}
		const messageToClients = { 
			type: 'room_message',
			room: normalRoomName,
			sender: senderUsername,
			text: text,
			timestamp: Date.now() 
		};

		roomMembers.forEach(memberToken => {
        const memberSocket = this.clients.get(memberToken);
        if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
            memberSocket.send(JSON.stringify(messageToClients));
        }
    });
    console.log(`Message from ${senderUsername} in room '${normalRoomName}': ${text}`);
}

	sendRoomLists() {
		const availableRooms = Array.from(this.rooms.keys());
		this.clients.forEach(clientSocket => {
			if(clientSocket.readyState === clientSocket.OPEN){
				clientSocket.send(JSON.stringify({type: 'available_rooms', content: availableRooms}));
			}
		})
	}

	sendJoinedRoomsUpdate(targetToken) {
		const clientSocket = this.clients.get(targetToken);
		if(!clientSocket || clientSocket.readyState !== clientSocket.OPEN) return;
		const joinedRoomsForClient =[]
		this.rooms.forEach((members,roomName) => {
			if(members.has(targetToken)) {
				joinedRoomsForClient.push(roomName);
			}
		})
		clientSocket.send(JSON.stringify({type: 'joined_rooms', content: joinedRoomsForClient}));
	}
	sendRoomUserCountUpdate(roomName){
		const members = this.rooms.get(roomName);
		if(!members)return;
		const count = members.size;
		this.clients.forEach(clientSocket => {
			if(clientSocket.readyState === clientSocket.OPEN){
				clientSocket.send(JSON.stringify({type: 'room_user_count', 
					room: roomName,
					count:count}));
			}
		})
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