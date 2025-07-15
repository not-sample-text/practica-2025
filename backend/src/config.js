// Server configuration and constants

module.exports = {
	port: 80,
	secretKey: "564798ty9GJHB%^&*(KJNLK",
	cookieOptions: {
		httpOnly: false,
		secure: false,
		sameSite: "lax",
		path: "/"
	},
	files: {
		welcome: "./welcome.html",
		index: "./index.html"
	}
};
