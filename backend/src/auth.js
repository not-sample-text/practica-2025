// Authentication utilities

const jwt = require("jsonwebtoken");
const config = require("./config");
const fs = require("fs/promises");

const isValidToken = (token) => {
	try {
		jwt.verify(token, config.secretKey);
		return true;
	} catch (err) {
		return false;
	}
};

const getUsernameFromToken = (token) => {
	try {
		return jwt.verify(token, config.secretKey).username;
	} catch (err) {
		return null;
	}
};

const createToken = (username) => {
	return jwt.sign({ username }, config.secretKey, { expiresIn: "1h" });
};

const validateLoginInput = async (username, password, onlyAuth = false) => {
	const { Filter } = await import("bad-words");
	const filter = new Filter();
	const errors = {};
	if (!/^[\w]{3,20}$/.test(username || "")) {
		errors.username =
			"Numele de utilizator trebuie să aibă între 3 și 20 de caractere și să conțină doar litere, cifre și underscore.";
	} else if (filter.isProfane(username)) {
		errors.username = "Numele de utilizator conține cuvinte nepotrivite.";
	}
	if (!password || password.length < 8) {
		errors.password = "Parola trebuie să aibă cel puțin 8 caractere.";
	}
	const users = JSON.parse(await fs.readFile('users.json', "utf-8"));
	if (!users[username]) {
		errors.username = "Utilizatorul nu există.";
	} else if (users[username].password !== password) {
		errors.password = "Parola incorectă.";
	}
	return errors;
};

const validateRegisterInput = async (username, password) => {
	const { Filter } = await import("bad-words");
	const filter = new Filter();
	const errors = {};
	if (!/^[\w]{3,20}$/.test(username || "")) {
		errors.username =
			"Numele de utilizator trebuie să aibă între 3 și 20 de caractere și să conțină doar litere, cifre și underscore.";
	} else if (filter.isProfane(username)) {
		errors.username = "Numele de utilizator conține cuvinte nepotrivite.";
	}
	if (!password || password.length < 8) {
		errors.password = "Parola trebuie să aibă cel puțin 8 caractere.";
	}
	const users = JSON.parse(await fs.readFile('users.json', "utf-8"));
	if (users[username]) {
		errors.username = "Utilizatorul există deja.";
	}
	return errors;
};

module.exports = {
	isValidToken,
	getUsernameFromToken,
	createToken,
	validateLoginInput,
	validateRegisterInput
};
