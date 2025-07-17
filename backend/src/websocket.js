const auth = require("./auth");

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.groupChats = new Map(); // Store group chat information
  }

  handleConnection(ctx) {
    const token = ctx.cookies.get("token");

    if (!auth.isValidToken(token)) {
      ctx.websocket.send("token-Invalid or expired token");
      ctx.websocket.close();
      return;
    }

    this.clients.set(token, ctx.websocket);
    console.log(`Socket client «${token}» added`);

    ctx.websocket.on('message', (message) => {
      console.log(`Received from client »»» `, message);

      let parsed = { type: 'message', chatname: "", content: message.toString() };
      try {
        parsed = JSON.parse(message.toString());
      } catch (e) {
        console.error('Failed to parse message:', e);
      }

      console.log('Parsed message', parsed);

      switch (parsed.type) {
        case 'disconnect':
          console.log('Client disconnected');
          ctx.websocket.close();
          break;
        case 'broadcast':
        case 'global':
          this.broadcastMessage(token, parsed);
          break;
        case 'private':
          this.privateMessage(token, parsed.recipient || parsed.chatname, parsed);
          break;
        case 'group':
          this.groupMessage(token, parsed);
          break;
        case 'create_group':
          this.createGroupChat(token, parsed);
          break;
        case 'join_group':
          this.joinGroupChat(token, parsed.groupId);
          break;
        case 'leave_group':
          this.leaveGroupChat(token, parsed.groupId);
          break;
        default:
          console.log(`Unknown message type: ${parsed.type}`);
          return ctx.websocket.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${parsed.type}`
          }));
      }
    });

    this.sendUsernames();

    ctx.websocket.on('close', () => {
      console.log('Client disconnected');
      this.clients.delete(token);
      this.sendUsernames();
    });
  }

  privateMessage(token, recipient, message) {
    const senderUsername = auth.getUsernameFromToken(token);
    
    this.clients.forEach((socket, tokenTo) => {
      const recipientUsername = auth.getUsernameFromToken(tokenTo);
      
      // Send to recipient
      if (recipientUsername === recipient && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: 'private',
          username: senderUsername,
          content: message.content,
          timestamp: Date.now()
        }));
      }
      
      // Send back to sender for confirmation
      if (tokenTo === token && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: 'private',
          username: senderUsername,
          content: message.content,
          timestamp: Date.now(),
          isOwnMessage: true
        }));
      }
    });
  }

  broadcastMessage(token, message) {
    const senderUsername = auth.getUsernameFromToken(token);
    
    this.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          type: 'broadcast',
          username: senderUsername,
          content: message.content,
          timestamp: Date.now()
        }));
      }
    });
  }

  createGroupChat(token, data) {
    const groupId = data.groupId || `group_${Date.now()}`;
    const senderUsername = auth.getUsernameFromToken(token);
    
    // Create group chat
    this.groupChats.set(groupId, {
      id: groupId,
      name: data.groupName || `Group ${groupId}`,
      creator: senderUsername,
      participants: [senderUsername, ...(data.participants || [])],
      created: Date.now()
    });

    // Notify all participants about the new group
    const groupInfo = this.groupChats.get(groupId);
    this.notifyGroupParticipants(groupId, {
      type: 'group_created',
      groupId: groupId,
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
        type: 'error',
        message: 'Group chat not found'
      });
      return;
    }

    if (!group.participants.includes(username)) {
      group.participants.push(username);
      
      // Notify all participants
      this.notifyGroupParticipants(groupId, {
        type: 'user_joined',
        groupId: groupId,
        username: username,
        participants: group.participants
      });
    }
  }

  leaveGroupChat(token, groupId) {
    const username = auth.getUsernameFromToken(token);
    const group = this.groupChats.get(groupId);
    
    if (!group) return;

    group.participants = group.participants.filter(p => p !== username);
    
    // If no participants left, delete the group
    if (group.participants.length === 0) {
      this.groupChats.delete(groupId);
    } else {
      // Notify remaining participants
      this.notifyGroupParticipants(groupId, {
        type: 'user_left',
        groupId: groupId,
        username: username,
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
        type: 'error',
        message: 'Group chat not found'
      });
      return;
    }

    // Check if sender is a participant
    if (!group.participants.includes(senderUsername)) {
      this.sendToClient(token, {
        type: 'error',
        message: 'You are not a participant in this group'
      });
      return;
    }

    // Send message to all group participants
    this.notifyGroupParticipants(groupId, {
      type: 'group',
      groupId: groupId,
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

  sendUsernames() {
    if (this.clients?.size === 0) return;

    const usernames = Array.from(this.clients.keys()).map(token => 
      auth.getUsernameFromToken(token)
    );

    this.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ 
          type: 'usernames', 
          content: usernames 
        }));
      }
    });
  }

  // Helper method to get active groups for a user
  getUserGroups(username) {
    const userGroups = [];
    this.groupChats.forEach((group, groupId) => {
      if (group.participants.includes(username)) {
        userGroups.push({
          id: groupId,
          name: group.name,
          participants: group.participants,
          created: group.created
        });
      }
    });
    return userGroups;
  }

  // Method to get group info
  getGroupInfo(groupId) {
    return this.groupChats.get(groupId);
  }
}

module.exports = WebSocketManager;