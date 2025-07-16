/**
 * Form validation utilities
 */

export const validateUsername = (username) => {
	if (!username || username.length < 3) {
		return "Numele trebuie să aibă cel puțin 3 caractere.";
	}
	return "";
};

export const validatePassword = (password) => {
	if (!password || password.length < 6) {
		return "Parola trebuie să aibă cel puțin 6 caractere.";
	}
	return "";
};

export const validatePasswordConfirmation = (password, passwordConfirm) => {
	if (password !== passwordConfirm) {
		return "Parolele nu se potrivesc.";
	}
	return "";
};

export const validateLoginForm = (username, password) => {
	const errors = {};

	const usernameError = validateUsername(username);
	if (usernameError) errors.username = usernameError;

	const passwordError = validatePassword(password);
	if (passwordError) errors.password = passwordError;

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
};

export const validateSignupForm = (username, password, passwordConfirm) => {
	const errors = {};

	const usernameError = validateUsername(username);
	if (usernameError) errors.username = usernameError;

	const passwordError = validatePassword(password);
	if (passwordError) errors.password = passwordError;

	const confirmError = validatePasswordConfirmation(password, passwordConfirm);
	if (confirmError) errors.passwordConfirm = confirmError;

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
};
