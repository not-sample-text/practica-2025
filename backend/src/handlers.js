// Request handlers

const fs = require("fs");
const auth = require("./auth");
const config = require("./config");

const parseRequestBody = (ctx) => {
	return new Promise((resolve, reject) => {
		let data = "";
		ctx.req.on("data", (chunk) => (data += chunk));
		ctx.req.on("end", () => {
			try {
				resolve(JSON.parse(data));
			} catch (e) {
				reject(e);
			}
		});
		ctx.req.on("error", reject);
	});
};

const handleMainPage = async (ctx, next) => {
	if (!["/", "/index.html"].includes(ctx.url)) {
		await next();
		return;
	}

	const token = ctx.cookies.get("token");
	const username = auth.getUsernameFromToken(token);
	const templateFile = username ? config.files.welcome : config.files.index;
	const content = fs.readFileSync(templateFile, "utf-8");

	ctx.body = content.replace("@username", username || "Guest");
};

const handleLogin = async (ctx, next) => {
	if (!ctx.url.includes("/login")) {
		await next();
		return;
	}

	let username, password;

	if (ctx.method === "POST") {
		const body = await parseRequestBody(ctx);
		username = body.username;
		password = body.password;
	} else {
		username = ctx.query.username;
		password = ctx.query.password;
	}

	const errors = await auth.validateLoginInput(username, password);

	if (Object.keys(errors).length > 0) {
		if (ctx.method === "POST") {
			ctx.body = { success: false, error: errors };
		} else {
			ctx.body = `<h1>Eroare</h1><p>${
				errors.username || errors.password
			}</p><a href='/'>Înapoi</a>`;
		}
		return;
	}

	const content = fs.readFileSync(config.files.welcome, "utf-8");
	const response = content.replace("@username", username);
	const token = auth.createToken(username);

	ctx.cookies.set("token", token, config.cookieOptions);

	if (ctx.method === "POST") {
		ctx.body = { success: true };
	} else {
		ctx.body = response;
	}
};

const handleDefault = async (ctx) => {
	ctx.body = "Hello World";
};

module.exports = {
	handleMainPage,
	handleLogin,
	handleDefault
};
