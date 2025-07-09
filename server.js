// Clean, modular server implementation

const Koa = require("koa");
const serve = require("koa-static");
const route = require("koa-route");
const websockify = require("koa-websocket");

const config = require("./src/server/config");
const handlers = require("./src/server/handlers");
const WebSocketManager = require("./src/server/websocket");

// Initialize application
const app = websockify(new Koa());
const wsManager = new WebSocketManager();

// Serve static files
app.use(serve(__dirname + "/dist"));

// WebSocket route
app.ws.use(route.all("/ws", (ctx) => wsManager.handleConnection(ctx)));

// HTTP routes
app
	.use(handlers.handleMainPage)
	.use(handlers.handleLogin)
	.use(handlers.handleDefault);

// Start server
app.listen(config.port);
console.log(`Server running at http://localhost:${config.port}`);
