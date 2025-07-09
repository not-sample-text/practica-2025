const Koa = require("koa");
const fs = require("fs");
const serve = require("koa-static");
const jwt = require("jsonwebtoken");
const route = require("koa-route");
const websockify = require("koa-websocket");

const clients = new Map(); // Store connected clients
const option = {
	httpOnly: false, // accesibil din browser
	secure: false, // nu cere HTTPS
	sameSite: "lax", // ok pe localhost
	path: "/" // disponibil pe toată aplicația
};
const secretKey = "564798ty9GJHB%^&*(KJNLK";
const app = websockify(new Koa());

// Serve static files
app.use(serve(__dirname));

app.ws.use(
	route.all("/ws", function (ctx) {
		const token = ctx.cookies.get("token");
		let username = null;
		try {
			username = jwt.verify(token, secretKey).username;
		} catch (err) {
			ctx.websocket.send("token–Invalid or expired token");
			ctx.websocket.close();
			return;
		}
		clients.set(token, ctx.websocket);
		console.log(`Socket client «${token}» added`);
		ctx.websocket.send(
			`token–Hello ${username}, welcome to the WebSocket server!`
		);
		ctx.websocket.on("message", function (message) {
			clients.forEach((client) => {
				if (client.readyState === client.OPEN) {
					client.send(`${token}–${message}`);
				}
			});
		});
	})
);

app
	.use(async (ctx, next) => {
		let username = null;
		if (["/", "/index.html"].includes(ctx.url)) {
			const token = ctx.cookies.get("token");
			if (token) {
				try {
					username = jwt.verify(token, secretKey).username;
				} catch (err) {
					username = null;
				}
			}
			const responseHtml = username ? "./welcome.html" : "./index.html";
			const content = fs.readFileSync(responseHtml, "utf-8");
			const response = content.replace("@username", username || "Guest");
			return (ctx.body = response);
		}
		await next();
	})
	.use(async (ctx, next) => {
		if (ctx.url.includes("/login")) {
			const { username, password } = ctx.query;
			const content = fs.readFileSync("./welcome.html", "utf-8");
			const response = content.replace("@username", username);
			const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
			ctx.cookies.set("token", token, option);
			return (ctx.body = response);
		}
		await next();
	})
	.use(async (ctx) => {
		ctx.body = "Hello World";
	});

app.listen(3000);
console.log("http://localhost:3000");
