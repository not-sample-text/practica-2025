const Koa = require("koa");
const fs = require("fs");
const serve = require("koa-static");
const app = new Koa();
const jwt = require("jsonwebtoken");
const secretKey = "564798ty9GJHB%^&*(KJNLK";

// Serve static files
app.use(serve(__dirname));

app
	.use(async (ctx, next) => {
		console.log(`Request URL: ${ctx.url}`);
		let username = null;
		if (["/", "/index.html"].includes(ctx.url)) {
			const token = ctx.cookies.get("token");
			if (token) {
				try {
					username = jwt.verify(token, secretKey).username;
				} catch (err) {
					// Token invalid or expired, treat as not logged in
					username = null;
				}
			}
			const responseHtml = username ? "./welcome.html" : "./index.html";
			const content = fs.readFileSync(responseHtml, "utf-8");
			const response = content.replace("@username", username || "Guest");
			return (ctx.body = response);
		}
		await next(); // Call the next middleware
	})
	.use(async (ctx, next) => {
		if (ctx.url.includes("/login")) {
			const { username, password } = ctx.query;
			const content = fs.readFileSync("./welcome.html", "utf-8");
			const response = content.replace("@username", username);
			const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
			ctx.cookies.set("token", token);
			return (ctx.body = response);
		}
		await next(); // Call the next middleware
	})
	.use(async (ctx) => {
		ctx.body = "Hello World";
	});

app.listen(3000);
console.log("http://localhost:3000");
