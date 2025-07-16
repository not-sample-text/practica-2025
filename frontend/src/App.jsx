import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./components/layout/LandingPage";
import Dashboard from "./components/Dashboard";
import AuthModal from "./components/auth/AuthModal";
import LoadingSpinner from "./components/ui/LoadingSpinner";

/**
 * Main App component - responsible only for routing between authenticated and unauthenticated states
 */
function App() {
	const { isLoggedIn, user, loading, login, logout } = useAuth();
	const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" });

	const handleShowLogin = () => {
		setAuthModal({ isOpen: true, mode: "login" });
	};

	const handleShowSignup = () => {
		setAuthModal({ isOpen: true, mode: "signup" });
	};

	const handleCloseAuthModal = () => {
		setAuthModal({ isOpen: false, mode: "login" });
	};

	const handleModeChange = (newMode) => {
		setAuthModal((prev) => ({ ...prev, mode: newMode }));
	};

	const handleAuthSuccess = () => {
		// Refresh auth state by getting updated token
		const token = document.cookie.match(/token=([^;]+)/)?.[1];
		if (token) {
			// Decode the token to get user info
			try {
				const parts = token.split(".");
				const base64Url = parts[1];
				const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
				const jsonPayload = decodeURIComponent(
					atob(base64)
						.split("")
						.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
						.join("")
				);
				const userData = JSON.parse(jsonPayload);
				login(userData);
			} catch (e) {
				console.error("Error decoding token:", e);
			}
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-stone-900 flex items-center justify-center">
				<LoadingSpinner
					size="large"
					text="Initializing application..."
				/>
			</div>
		);
	}

	if (isLoggedIn && user) {
		return (
			<Dashboard
				user={user}
				onLogout={logout}
			/>
		);
	}

	return (
		<>
			<LandingPage
				onShowLogin={handleShowLogin}
				onShowSignup={handleShowSignup}
			/>
			<AuthModal
				isOpen={authModal.isOpen}
				onClose={handleCloseAuthModal}
				onSuccess={handleAuthSuccess}
				mode={authModal.mode}
				onModeChange={handleModeChange}
			/>
		</>
	);
}

export default App;
