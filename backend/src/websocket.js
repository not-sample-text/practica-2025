const auth = require("./auth");

class WebSocketManager {

	constructor(pokerGames = null) {
		this.clients = new Map();
		this.rooms = new Map();
		this.pokerGames = pokerGames;
	}

	handleConnection(ctx) {
		const token = ctx.cookies.get("token");

		if (!auth.isValidToken(token)) {
			ctx.websocket.send(JSON.stringify({ type: 'error', message: "Token invalid sau expirat" }));
			ctx.websocket.close();
			return;
		}

		(this.clients).set(token, ctx.websocket);
		console.log(`Socket client «${auth.getUsernameFromToken(token)}» added`);

		ctx.websocket.on('message', (message) => {
			let parsed;
			try {
				parsed = JSON.parse(message.toString());
			} catch (e) {
				console.error('Error parsing message:', e);
				parsed = { type: 'unknown', content: message.toString() };
			}
			
			switch (parsed.type) {
				case 'disconnect':
					ctx.websocket.close();
					break;
				case 'broadcast':
					this.broadcastMessage(token, parsed);
					break;
				case 'private_message':
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
				// --- Secțiunea POKER ---
				case 'poker_action':
					this.handlePokerAction(token, parsed);
					break;
				case 'poker_start_game': // Pornește jocul pentru prima dată
					this.handlePokerStartGame(token, parsed.gameId);
					break;
				case 'poker_start_new_hand': // Pornește mâinile următoare
                    this.handlePokerStartNewHand(token, parsed.gameId);
                    break;
				case 'poker_leave_game':
					this.handlePokerLeaveGame(token, parsed.gameId);
					break;
				case 'poker_get_hand':
					this.handlePokerGetHand(token, parsed.gameId);
					break;
				default:
					console.log(`Unknown message type: ${parsed.type}`);
					this.sendErrorToClient(token, `Tip de mesaj necunoscut: ${parsed.type}`);
			}
		});

		this.sendUsernames();
		this.sendRoomLists();     
        this.sendJoinedRoomsUpdate(token);
        this.sendPokerLobbyUpdate();

		ctx.websocket.on('close', () => {
			const username = auth.getUsernameFromToken(token);
			console.log(`Client disconnected: ${username}`);
			
			// Dacă jucătorul este într-un joc de poker, scoate-l
			if(this.pokerGames){
				for (const [gameId, game] of this.pokerGames.entries()) {
					if (game.playersByToken.has(token)) {
						this.handlePokerLeaveGame(token, gameId);
						break;
					}
				}
			}
			(this.clients).delete(token);
			this.sendUsernames();
		});
	}

	broadcastMessage(token, message) {
		const username = auth.getUsernameFromToken(token);
		const messageToSend = JSON.stringify({ username, ...message });
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(messageToSend);
			}
		});
	}

	sendPrivateMessage(token, message) {
		const senderUsername = auth.getUsernameFromToken(token);
		const recipientUsername = message.to;
		const messageToSend = JSON.stringify({
			type:'private_message',
			sender: senderUsername,
			to: recipientUsername,
			text: message.text
		});

		const senderClient = this.clients.get(token);
		if(senderClient && senderClient.readyState === senderClient.OPEN){
			senderClient.send(messageToSend);
		}
		
		for (const [clientToken, clientSocket] of this.clients.entries()) {
			if (auth.getUsernameFromToken(clientToken) === recipientUsername && clientSocket.readyState === clientSocket.OPEN) {
				clientSocket.send(messageToSend);
			}
		}
	}

	createRooms(token, roomName) {
		if(!roomName || roomName.trim() === '') return;
		
		const normalRoomName = roomName.trim().toLowerCase();
		if(this.rooms.has(normalRoomName)){
			console.log(`Room ${normalRoomName} already exists, joining.`);
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
		const roomMembers = this.rooms.get(normalRoomName);
		if(roomMembers.has(token)){
			console.log(`${username} is already in room ${normalRoomName}`);
			return;
		}

		roomMembers.add(token);
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
		const roomMembers = this.rooms.get(normalRoomName)
		if(!roomMembers.has(token)) {
			console.log(`${username} is not in room ${normalRoomName}`);
			return;
		}
		this.sendRoomMessage(token, normalRoomName, `${username} has left the room.`);
		roomMembers.delete(token);

		if(roomMembers.size === 0 ){
			this.rooms.delete(normalRoomName);
			console.log(`Room ${normalRoomName} deleted.`);
			this.sendRoomLists();
		} else {
            this.sendRoomUserCountUpdate(normalRoomName);
        }
		this.sendJoinedRoomsUpdate(token);
	}

	sendRoomMessage(token, roomName, text) {
		const normalRoomName = roomName.trim().toLowerCase();
		const senderUsername = auth.getUsernameFromToken(token);
		
		if(!this.rooms.has(normalRoomName)) {
			return this.sendErrorToClient(token, `Room ${normalRoomName} does not exist.`);
		}

		const roomMembers = this.rooms.get(normalRoomName);
		if(!roomMembers.has(token)) {
			return this.sendErrorToClient(token, `You are not in room ${normalRoomName}.`);
		}
		
		const messageToClients = JSON.stringify({ 
			type: 'room_message',
			room: normalRoomName,
			sender: senderUsername,
			text: text,
			timestamp: Date.now() 
		});

		roomMembers.forEach(memberToken => {
			const memberSocket = this.clients.get(memberToken);
			if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
				memberSocket.send(messageToClients);
			}
		});
		console.log(`Message from ${senderUsername} in room '${normalRoomName}': ${text}`);
	}

	sendRoomLists() {
		const availableRooms = Array.from(this.rooms.keys());
		const message = JSON.stringify({type: 'available_rooms', content: availableRooms});
		this.clients.forEach(clientSocket => {
			if(clientSocket.readyState === clientSocket.OPEN){
				clientSocket.send(message);
			}
		})
	}

	sendJoinedRoomsUpdate(targetToken) {
		const clientSocket = this.clients.get(targetToken);
		if(!clientSocket || clientSocket.readyState !== clientSocket.OPEN) return;
		
		const joinedRoomsForClient =[];
		this.rooms.forEach((members, roomName) => {
			if(members.has(targetToken)) {
				joinedRoomsForClient.push(roomName);
			}
		});
		clientSocket.send(JSON.stringify({type: 'joined_rooms', content: joinedRoomsForClient}));
	}
    
	sendRoomUserCountUpdate(roomName){
		const members = this.rooms.get(roomName);
		if(!members) return;
		const count = members.size;
		const message = JSON.stringify({type: 'room_user_count', room: roomName, count: count});
		this.clients.forEach(clientSocket => {
			if(clientSocket.readyState === clientSocket.OPEN){
				clientSocket.send(message);
			}
		});
	}

	sendUsernames() {
		if (this.clients.size === 0) return;
		const content = Array.from(this.clients.keys()).map(token => auth.getUsernameFromToken(token));
		const message = JSON.stringify({ type: 'usernames', content });
		this.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(message);
			}
		});
	}

	// --- Metode POKER ---

	handlePokerAction(token, data) {
		const { gameId, action, amount } = data;
		const game = this.pokerGames?.get(gameId);
		if (!game) {
			return this.sendErrorToClient(token, "Jocul nu a fost găsit.");
		}

		try {
			game.handlePlayerAction(token, action, amount);
			this.broadcastPokerGameState(gameId);
			if(game.round !== 'showdown' && game.players.length > 0 && game.currentPlayerIndex !== -1) {
				const currentPlayer = game.players[game.currentPlayerIndex];
				if (currentPlayer) {
					this.handlePokerGetHand(currentPlayer.token, gameId);
				}
			}
			this.sendPokerLobbyUpdate();
		} catch (error) {
			this.sendErrorToClient(token, error.message);
		}
	}

	handlePokerStartGame(token, gameId) {
		const game = this.pokerGames?.get(gameId);
		if (!game) {
			return this.sendErrorToClient(token, "Jocul nu a fost găsit.");
		}

		if (auth.getUsernameFromToken(token) !== game.creatorUsername) {
			return this.sendErrorToClient(token, "Doar creatorul mesei poate porni jocul.");
		}

		try {
			game.startGame();
			this.broadcastPokerGameState(gameId);
			game.players.forEach(player => {
				if (player.status !== 'out') {
					this.handlePokerGetHand(player.token, gameId);
				}
			});
			this.sendPokerLobbyUpdate();
		} catch (error) {
			this.sendErrorToClient(token, error.message);
		}
	}
	
	handlePokerStartNewHand(token, gameId) {
		const game = this.pokerGames?.get(gameId);
		if (!game) {
			return this.sendErrorToClient(token, "Jocul nu a fost găsit.");
		}
	
		if (auth.getUsernameFromToken(token) !== game.creatorUsername) {
			return this.sendErrorToClient(token, "Doar creatorul mesei poate porni o mână nouă.");
		}
	
		try {
			game.startNewHand();
			this.broadcastPokerGameState(gameId);
			game.players.forEach(player => {
				if (player.status !== 'out') {
					this.handlePokerGetHand(player.token, gameId);
				}
			});
			this.sendPokerLobbyUpdate();
		} catch (error) {
			this.sendErrorToClient(token, error.message);
		}
	}

	handlePokerLeaveGame(token, gameId) {
		const game = this.pokerGames?.get(gameId);
		if (!game) return;

		game.removePlayer(token);
		
		if (game.players.length === 0) {
			this.pokerGames.delete(gameId);
			console.log(`Jocul ${gameId} a fost șters deoarece nu mai are jucători.`);
		} else {
			this.broadcastPokerGameState(gameId);
		}

		const client = this.clients.get(token);
		if (client && client.readyState === client.OPEN) {
			client.send(JSON.stringify({ type: 'poker_left_game', gameId: gameId }));
		}

		this.sendPokerLobbyUpdate();
	}

	handlePokerGetHand(token, gameId) {
		const game = this.pokerGames?.get(gameId);
		if (!game) return;

		const hand = game.getHandForPlayer(token);
        if (hand) {
            const client = this.clients.get(token);
            if (client && client.readyState === client.OPEN) {
                client.send(JSON.stringify({
                    type: 'poker_hand',
                    gameId: gameId,
                    hand: hand
                }));
            }
        }
	}

	broadcastPokerGameState(gameId) {
		const game = this.pokerGames?.get(gameId);
		if (!game) return;
		
		const gameState = game.getGameState();
		const message = JSON.stringify({ type: 'poker_game_state', gameState: gameState });
		
		game.playersByToken.forEach((player, token) => {
			const client = this.clients.get(token);
			if (client && client.readyState === client.OPEN) {
				client.send(message);
			}
		});
	}
	
	broadcastPokerLobbyUpdate() {
		if (!this.pokerGames) return;
		
		const gamesList = Array.from(this.pokerGames.values()).map(game => game.getGameState());
		const message = JSON.stringify({ type: 'poker_lobby_update', games: gamesList });
		
		this.clients.forEach(client => {
			if (client.readyState === client.OPEN) {
				client.send(message);
			}
		});
	}

	sendPokerLobbyUpdate() {
		this.broadcastPokerLobbyUpdate();
	}

	sendErrorToClient(token, message) {
		const client = this.clients.get(token);
		if (client && client.readyState === client.OPEN) {
			client.send(JSON.stringify({ type: 'error', message: message }));
		}
	}
}

module.exports = WebSocketManager;