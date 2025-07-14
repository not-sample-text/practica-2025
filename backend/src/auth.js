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



const registerUser = async (username, password) => {
    const errors = {};
    
    if (!username || username.length < 3) { errors.username = "..."; }
    if (!password || password.length < 6) { errors.password = "..."; }
    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    try {
        const fileContent = await fs.readFile('users.json', "utf-8");
        const users = JSON.parse(fileContent);
        if (users[username]) {
            errors.username = "Utilizatorul există deja.";
            return { errors };
        }
        users[username] = { username, password };

        await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    
        return { errors: {} };

    } catch (e) {
        errors.server = "A apărut o eroare internă pe server.";
        return { errors };
    }
};
const authenticateUser = async (username, password) => {
	const errors = {};
	const users = JSON.parse(await fs.readFile('users.json', "utf-8"));
	if(!users[username]) {
		errors.authenticateUser = "Utilizatorul nu exista.";
		return { errors };

	}
	if(users[username].password !== password) {
		errors.authenticateUser = "Parola este incorecta.";
		return { errors };
	}
	return { errors: {} };
};

module.exports = {
	isValidToken,
	getUsernameFromToken,
	createToken,
	registerUser,
	authenticateUser

};
