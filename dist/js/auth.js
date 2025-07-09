// Authentication and form handling for login page

class AuthHandler {
	constructor() {
		this.aggressiveValidation = false;
		this.lastServerError = "";
		this.init();
	}

	init() {
		document.addEventListener("DOMContentLoaded", () => {
			this.initializeModals();
			this.initializeLoginForm();
		});
	}

	initializeModals() {
		const modals = {
			login: {
				modal: document.getElementById("loginModal"),
				open: document.getElementById("openLoginModal"),
				close: document.getElementById("closeLoginModal")
			},
			signup: {
				modal: document.getElementById("signupModal"),
				open: document.getElementById("openSignupModal"),
				close: document.getElementById("closeSignupModal")
			}
		};

		Object.values(modals).forEach(({ modal, open, close }) => {
			open?.addEventListener("click", () => this.showModal(modal));
			close?.addEventListener("click", () => this.hideModal(modal));
			modal?.addEventListener("click", (e) => {
				if (e.target === modal) this.hideModal(modal);
			});
		});
	}

	showModal(modal) {
		modal.classList.remove("hidden");
		document.body.style.overflow = "hidden";
	}

	hideModal(modal) {
		modal.classList.add("hidden");
		document.body.style.overflow = "auto";
	}

	validateUsername(username) {
		if (!/^\w{3,20}$/.test(username)) {
			return "Numele de utilizator trebuie să aibă între 3 și 20 de caractere și poate conține doar litere, cifre și underscore (_).";
		}
		return "";
	}

	calculatePasswordStrength(password) {
		let score = 0;
		if (password.length > 12) score++;
		if (/[a-z]/.test(password)) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;
		return score;
	}

	getPasswordStrengthLabel(score) {
		const labels = [
			"Foarte slabă",
			"Slabă",
			"Mediu",
			"Puternică",
			"Foarte puternică"
		];
		return labels[score - 1] || "";
	}

	showError(element, message) {
		element.textContent = message;
		element.classList.remove("hidden");
	}

	hideError(element) {
		element.classList.add("hidden");
	}

	initializeLoginForm() {
		const form = document.getElementById("loginForm");
		const usernameInput = document.getElementById("nume");
		const passwordInput = document.getElementById("parola");
		const usernameError = document.getElementById("login-username-error");
		const passwordError = document.getElementById("login-password-error");
		const passwordStrength = document.getElementById("login-password-strength");

		if (!form) return;

		form.addEventListener("submit", (e) =>
			this.handleSubmit(
				e,
				usernameInput,
				passwordInput,
				usernameError,
				passwordError
			)
		);
		usernameInput?.addEventListener("input", () =>
			this.handleUsernameInput(usernameInput, usernameError)
		);
		usernameInput?.addEventListener("keyup", () =>
			this.handleUsernameInput(usernameInput, usernameError)
		);
		passwordInput?.addEventListener("input", () =>
			this.handlePasswordInput(passwordInput, passwordStrength)
		);
	}

	validateForm(usernameInput, passwordInput, usernameError, passwordError) {
		let hasError = false;

		const usernameErrorMsg = this.validateUsername(usernameInput.value);
		if (usernameErrorMsg) {
			this.showError(usernameError, usernameErrorMsg);
			this.aggressiveValidation = true;
			hasError = true;
		} else {
			this.hideError(usernameError);
		}

		if (!passwordInput.value) {
			this.showError(passwordError, "Parola este obligatorie.");
			hasError = true;
		} else {
			this.hideError(passwordError);
		}

		return !hasError;
	}

	async handleSubmit(
		e,
		usernameInput,
		passwordInput,
		usernameError,
		passwordError
	) {
		e.preventDefault();

		if (
			!this.validateForm(
				usernameInput,
				passwordInput,
				usernameError,
				passwordError
			)
		) {
			return;
		}

		try {
			const response = await fetch("/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: usernameInput.value,
					password: passwordInput.value
				})
			});

			if (response.ok) {
				const data = await response.json();
				if (!data.error) {
					setTimeout(() => (window.location.href = "/"), 100);
				}
			}
		} catch (error) {
			// Handle error gracefully
		}
	}

	handleUsernameInput(usernameInput, usernameError) {
		if (this.lastServerError) {
			this.hideError(usernameError);
			this.lastServerError = "";
			this.aggressiveValidation = true;
		}

		if (this.aggressiveValidation) {
			const error = this.validateUsername(usernameInput.value);
			if (error) {
				this.showError(usernameError, error);
			} else {
				this.hideError(usernameError);
			}
		}
	}

	handlePasswordInput(passwordInput, passwordStrength) {
		const score = this.calculatePasswordStrength(passwordInput.value);
		if (passwordInput.value) {
			passwordStrength.textContent = `Putere parolă: ${score}/5 (${this.getPasswordStrengthLabel(
				score
			)})`;
		} else {
			passwordStrength.textContent = "";
		}
	}
}

// Initialize the auth handler
new AuthHandler();
