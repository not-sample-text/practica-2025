import { useState, useEffect } from "react";
import {
	getTokenFromCookie,
	decodeJWTPayload,
	isTokenValid
} from "../utils/auth";

/**
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuthStatus = () => {
			const token = getTokenFromCookie();
			const valid = isTokenValid();

			if (valid && token) {
				const userData = decodeJWTPayload(token);
				setUser(userData);
				setIsLoggedIn(true);
			} else {
				setUser(null);
				setIsLoggedIn(false);
			}

			setLoading(false);
		};

		checkAuthStatus();
	}, []);

	const login = (userData) => {
		setUser(userData);
		setIsLoggedIn(true);
	};

	const logout = () => {
		setUser(null);
		setIsLoggedIn(false);
	};

	return {
		isLoggedIn,
		user,
		loading,
		login,
		logout
	};
};
