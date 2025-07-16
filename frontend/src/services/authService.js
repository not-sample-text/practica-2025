/**
 * API service for authentication and user management
 */

class AuthService {
	static async login(credentials) {
		const response = await fetch("/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(credentials)
		});

		if (!response.ok) {
			throw new Error("Autentificare eșuată. Verificați datele.");
		}

		return response.json();
	}

	static async signup(userData) {
		const response = await fetch("/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(userData)
		});

		if (!response.ok) {
			throw new Error("Înregistrare eșuată.");
		}

		return response.json();
	}

	static async logout() {
		const response = await fetch("/logout");

		if (!response.ok) {
			throw new Error("Logout failed.");
		}

		return response.json();
	}
}

export default AuthService;
