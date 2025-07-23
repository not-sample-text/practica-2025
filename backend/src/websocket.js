const auth = require("./auth");
const GameHandler = require("./GameHandler");

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.groupChats = new Map();

    this.gameHandler = new GameHandler(this.sendToUser.bind(this));

    setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000);
  }

  handleConnection(ctx) {
    const token = ctx.cookies.get("token");

    if (!auth.isValidToken(token)) {
      ctx.websocket.send("token-Invalid or expired token");
      ctx.websocket.close();
      return;
    }

    const username = auth.getUsernameFromToken(token);
    console.log(`Socket client «${username}» (${token}) connected`);

    this.clients.set(token, ctx.websocket);

    setTimeout(() => {
      this.sendUsernames();
    }, 100);

    ctx.websocket.on("message", (message) => {
      console.log(`Received from client ${username} »»» `, message);

      let parsed = { type: "message", content: message.toString() };
      try {
        parsed = JSON.parse(message.toString());
      } catch (e) {
        console.error("Failed to parse message:", e);
      }

      switch (parsed.type) {
        case "disconnect":
          ctx.websocket.close();
          break;
        case "broadcast":
        case "global":
          this.broadcastMessage(token, parsed);
          break;
        case "private":
          this.privateMessage(token, parsed.recipient || parsed.chatname, parsed);
          break;
        case "group":
          this.groupMessage(token, parsed);
          break;
        case "create_group":
          this.createGroupChat(token, parsed);
          break;
        case "join_group":
          this.joinGroupChat(token, parsed.groupId);
          break;
        case "leave_group":
          this.leaveGroupChat(token, parsed.groupId);
          break;

        // Forward to GameHandler
        case "game_invitation":
          this.gameHandler.handleGameInvitation(username, parsed);
          break;
        case "accept_game_invitation":
          this.gameHandler.handleAcceptGameInvitation(username, parsed);
          break;
        case "decline_game_invitation":
          this.gameHandler.handleDeclineGameInvitation(username, parsed);
          break;
        case "game_move":
          this.gameHandler.handleGameMove(username, parsed);
          break;
        case "rematch_request": 
          this.gameHandler.handleRematchRequest(username, parsed);
          break;
        case "rematch_accept":
          this.gameHandler.handleRematchAccept(username, parsed);
          break;

        default:
          ctx.websocket.send(JSON.stringify({
            type: "error",
            message: `Unknown message type: ${parsed.type}`,
          }));
      }
    });

    ctx.websocket.on("close", () => {
      console.log(`Client ${username} disconnected`);
      this.clients.delete(token);
      this.gameHandler.cleanupUserGames(username);
      setTimeout(() => this.sendUsernames(), 100);
    });

    ctx.websocket.on("error", (error) => {
      console.error(`WebSocket error for ${username}:`, error);
      this.clients.delete(token);
      this.gameHandler.cleanupUserGames(username);
      setTimeout(() => this.sendUsernames(), 100);
    });
  }

  // ---- Messaging ----

  privateMessage(token, recipient, message) {
    const senderUsername = auth.getUsernameFromToken(token);
    console.log(`Private message from ${senderUsername} to ${recipient}: ${message.content}`);

    let recipientFound = false;

    this.clients.forEach((socket, tokenTo) => {
      const recipientUsername = auth.getUsernameFromToken(tokenTo);
      if (recipientUsername === recipient && socket.readyState === socket.OPEN) {
        recipientFound = true;
        socket.send(JSON.stringify({
          type: "private",
          username: senderUsername,
          content: message.content,
          timestamp: Date.now(),
          recipient
        }));
      }
    });

    const senderSocket = this.clients.get(token);
    if (senderSocket && senderSocket.readyState === senderSocket.OPEN) {
      senderSocket.send(JSON.stringify({
        type: "private_sent",
        username: senderUsername,
        content: message.content,
        timestamp: Date.now(),
        recipient,
        delivered: recipientFound
      }));
    }

    if (!recipientFound) {
      console.log(`Recipient ${recipient} not found or not connected`);
    }
  }

  broadcastMessage(token, message) {
    const senderUsername = auth.getUsernameFromToken(token);

    this.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          type: "broadcast",
          username: senderUsername,
          content: message.content,
          timestamp: Date.now(),
        }));
      }
    });
  }

  // ---- Group Chats ----

  createGroupChat(token, data) {
    const groupId = data.groupId || `group_${Date.now()}`;
    const senderUsername = auth.getUsernameFromToken(token);

    this.groupChats.set(groupId, {
      id: groupId,
      name: data.groupName || `Group ${groupId}`,
      creator: senderUsername,
      participants: [senderUsername, ...(data.participants || [])],
      created: Date.now()
    });

    const groupInfo = this.groupChats.get(groupId);
    this.notifyGroupParticipants(groupId, {
      type: "group_created",
      groupId,
      groupName: groupInfo.name,
      participants: groupInfo.participants,
      creator: senderUsername
    });

    console.log(`Group chat created: ${groupId} by ${senderUsername}`);
  }

  joinGroupChat(token, groupId) {
    const username = auth.getUsernameFromToken(token);
    const group = this.groupChats.get(groupId);

    if (!group) {
      this.sendToClient(token, {
        type: "error",
        message: "Group chat not found"
      });
      return;
    }

    if (!group.participants.includes(username)) {
      group.participants.push(username);
      this.notifyGroupParticipants(groupId, {
        type: "user_joined",
        groupId,
        username,
        participants: group.participants
      });
    }
  }

  leaveGroupChat(token, groupId) {
    const username = auth.getUsernameFromToken(token);
    const group = this.groupChats.get(groupId);

    if (!group) return;

    group.participants = group.participants.filter((p) => p !== username);

    if (group.participants.length === 0) {
      this.groupChats.delete(groupId);
    } else {
      this.notifyGroupParticipants(groupId, {
        type: "user_left",
        groupId,
        username,
        participants: group.participants
      });
    }
  }

  groupMessage(token, message) {
    const senderUsername = auth.getUsernameFromToken(token);
    const groupId = message.groupId;
    const group = this.groupChats.get(groupId);

    if (!group) {
      this.sendToClient(token, {
        type: "error",
        message: "Group chat not found"
      });
      return;
    }

    if (!group.participants.includes(senderUsername)) {
      this.sendToClient(token, {
        type: "error",
        message: "You are not a participant in this group"
      });
      return;
    }

    this.notifyGroupParticipants(groupId, {
      type: "group",
      groupId,
      groupName: group.name,
      username: senderUsername,
      content: message.content,
      timestamp: Date.now()
    });
  }

  notifyGroupParticipants(groupId, message) {
    const group = this.groupChats.get(groupId);
    if (!group) return;

    this.clients.forEach((socket, token) => {
      const username = auth.getUsernameFromToken(token);
      if (group.participants.includes(username) && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }

  sendToClient(token, message) {
    const client = this.clients.get(token);
    if (client && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  sendToUser(username, message) {
    this.clients.forEach((socket, token) => {
      const clientUsername = auth.getUsernameFromToken(token);
      if (clientUsername === username && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(message));
        console.log(`Sent to ${username}:`, message.type);
      }
    });
  }

  sendUsernames() {
    if (!this.clients || this.clients.size === 0) return;

    const activeClients = new Map();
    this.clients.forEach((client, token) => {
      if (client.readyState === client.OPEN) {
        activeClients.set(token, client);
      }
    });

    this.clients = activeClients;

    const usernames = Array.from(this.clients.keys())
      .map((token) => auth.getUsernameFromToken(token))
      .filter(Boolean);

    console.log(`Sending usernames to ${this.clients.size} clients:`, usernames);

    this.clients.forEach((client, token) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(JSON.stringify({
            type: "usernames",
            content: usernames
          }));
        } catch (error) {
          console.error(`Failed to send usernames to ${auth.getUsernameFromToken(token)}:`, error);
          this.clients.delete(token);
        }
      }
    });
  }

  cleanupDeadConnections() {
    const activeClients = new Map();
    this.clients.forEach((client, token) => {
      if (client.readyState === client.OPEN) {
        activeClients.set(token, client);
      } else {
        const username = auth.getUsernameFromToken(token);
        if (username) {
          this.gameHandler.cleanupUserGames(username);
        }
      }
    });

    if (activeClients.size !== this.clients.size) {
      this.clients = activeClients;
      this.sendUsernames();
    }
  }
}

module.exports = WebSocketManager;