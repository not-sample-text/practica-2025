/**
 * Authentication utility functions
 */

export const getTokenFromCookie = () => {
	const match = document.cookie.match(/token=([^;]+)/);
	return match ? match[1] : null;
};

export const clearTokenCookie = () => {
	document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const decodeJWTPayload = (token) => {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		return null;
	}
};

export const isTokenValid = () => {
	const token = getTokenFromCookie();
	if (!token) return false;

	const payload = decodeJWTPayload(token);
	if (!payload) return false;

	// Check if token is expired
	const currentTime = Date.now() / 1000;
	return payload.exp > currentTime;
};
