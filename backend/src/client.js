const { getUsernameFromToken } = require("./auth");

class Client{
	constructor(ws, token, room) {
		this._ws = ws;
		this._token = token;
		this._room;
	}

	get token() {
		return this._token;
	}

	get username() {
		return getUsernameFromToken(this._token);
	}

	get ws() {
		return this._ws;
	}

	get room() {
		return this._room
	}
	
	set room(newRoom) {
		this._room = newRoom
	}
}

module.exports = Client;