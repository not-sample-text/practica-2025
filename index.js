const Koa = require("koa");
const fs = require("fs");
const serve = require("koa-static");
const jwt = require("jsonwebtoken");
const route = require("koa-route");
const websockify = require("koa-websocket");

const clients = new Map(); // Store connected clients
const option = {
	httpOnly: false, // accessible from browser
	secure: false, // does not require HTTPS
	sameSite: "lax", // compatible with localhost
	path: "/" // available across the application
};
const secretKey = "564798ty9GJHB%^&*(KJNLK";
const app = websockify(new Koa());

// Serve static files
app.use(serve(__dirname + "/dist"));

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
			console.log("Response headers:", ctx.response.headers);
			console.log(
				`Route ${ctx.url}: Token received: ${
					token ? token.substring(0, 20) + "..." : "none"
				}`
			);
			if (token) {
				try {
					username = jwt.verify(token, secretKey).username;
					console.log(`Token verified for user: ${username}`);
				} catch (err) {
					console.log(`Token verification failed: ${err.message}`);
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
			console.log(
				"Login route hit with method:",
				ctx.method,
				"and URL:",
				ctx.url
			);
			// Support both GET (form) and POST (AJAX/fetch)
			let username, password;
			if (ctx.method === "POST") {
				const body = await new Promise((resolve, reject) => {
					let data = "";
					ctx.req.on("data", (chunk) => (data += chunk));
					ctx.req.on("end", () => resolve(JSON.parse(data)));
					ctx.req.on("error", reject);
				});
				username = body.username;
				password = body.password;
			} else {
				username = ctx.query.username;
				password = ctx.query.password;
			}
			console.log("Parsed username:", username, "Parsed password:", password);
			// Username validation
			const { Filter } = await import("bad-words");
			const filter = new Filter();
			const error = {};
			if (!/^[\w]{3,20}$/.test(username || "")) {
				error.username =
					"Numele de utilizator trebuie să aibă între 3 și 20 de caractere și să conțină doar litere, cifre și underscore.";
			} else if (filter.isProfane(username)) {
				error.username = "Numele de utilizator conține cuvinte nepotrivite.";
			}
			if (!password || password.length < 8) {
				error.password = "Parola trebuie să aibă cel puțin 8 caractere.";
			}
			console.log("Validation errors:", error);
			if (Object.keys(error).length > 0) {
				if (ctx.method === "POST") {
					ctx.body = { success: false, error };
				} else {
					ctx.body = `<h1>Eroare</h1><p>${
						error.username || error.password
					}</p><a href='/'>Înapoi</a>`;
				}
				console.log("Response body being sent:", ctx.body);
				return;
			}
			const content = fs.readFileSync("./welcome.html", "utf-8");
			const response = content.replace("@username", username);
			const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
			console.log(`Login successful for user: ${username}, setting cookie`);
			ctx.cookies.set("token", token, option);
			console.log(`Cookie set with token: ${token.substring(0, 20)}...`);
			console.log("Set-Cookie header:", ctx.response.headers["set-cookie"]);
			if (ctx.method === "POST") {
				ctx.body = { success: true };
				console.log('Response body on success:', ctx.body);
				return;
			} else {
				return (ctx.body = response);
			}
		}
		await next();
	})
	.use(async (ctx) => {
		ctx.body = "Hello World";
	});

app.listen(3000);
console.log("http://localhost:3000");
