// Clean, modular server implementation

const Koa = require("koa");
const serve = require("koa-static");
const route = require("koa-route");
const websockify = require("koa-websocket");
const bodyParser = require('koa-bodyparser');

const config = require("./src/config");
const handlers = require("./src/handlers");
const WebSocketManager = require("./src/websocket");
const routes = require("./src/routes");

// Initialize application
const app = websockify(new Koa());
const wsManager = new WebSocketManager();

// Serve static files
app.use(serve(__dirname + "/dist"));

// WebSocket route
app.ws.use(route.all("/ws", (ctx) => wsManager.handleConnection(ctx)));

// HTTP routes
app
	.use(bodyParser())
	.use(routes.routes())
	.use(routes.allowedMethods())
	.use(handlers.handleMainPage)
	.use(handlers.handleLogin)
	.use(handlers.handleRegister) 
	.use(handlers.handleDefault);

// Start server
app.listen(config.port);
console.log(`Server running at http://localhost:${config.port}`);
