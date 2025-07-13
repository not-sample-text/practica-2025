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

        if(!auth.isValidToken(token)) {
            console.log("Invalid token, closing connection.");
            ctx.websocket.close(1008, "Invalid token");
            return;
        }

        const username = auth.getUsernameFromToken(token);
        console.log(`Valid token for user: ${username}. Connection established.`);
        // FIX: Use the connection as the key and username as the value.
        this.clients.set(ctx.websocket, username);
        
        ctx.websocket.on("error", (error) => {
            console.error("WebSocket server error:", error);
            this.clients.delete(ctx.websocket);
        });

        ctx.websocket.on("message", (message) => {
            // This now correctly gets the username associated with the connection.
            const senderUsername = this.clients.get(ctx.websocket);
            console.log("Received message:", message.toString(), "from user:", senderUsername);
            
            try {
                const parsedMessage = JSON.parse(message.toString());
                this.broadcastMessage(senderUsername, parsedMessage.content);
            } catch (e) {
                console.error("Failed to parse or broadcast message:", e);
            }
        });

        ctx.websocket.on("close", () => {
            const closedUser = this.clients.get(ctx.websocket);
            console.log("WebSocket connection closed for user:", closedUser);
            this.clients.delete(ctx.websocket);
        });
    }

    broadcastMessage(senderUsername, messageContent) {
        const payload = JSON.stringify({
            sender: senderUsername,
            content: messageContent,
            timestamp: new Date().toLocaleTimeString("ro-RO")
        });

        // FIX: The map is now (connection -> username).
        // The forEach gives us (value, key) which is (username, clientConnection).
        this.clients.forEach((username, clientConnection) => {
            if (clientConnection.readyState === clientConnection.OPEN) {
                clientConnection.send(payload);
            }
        });
    }
}

module.exports = WebSocketManager;