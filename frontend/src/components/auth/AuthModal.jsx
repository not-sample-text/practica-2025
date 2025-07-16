import React, { useState } from "react";
import Modal from "../ui/Modal";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import AuthService from "../../services/authService";

/**
 * Authentication modal container - handles auth logic and form switching
 */
const AuthModal = ({ isOpen, onClose, onSuccess, mode = "login" }) => {
	const [currentMode, setCurrentMode] = useState(mode);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (credentials) => {
		setLoading(true);
		setError("");

		try {
			await AuthService.login(credentials);
			onSuccess();
			onClose();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSignup = async (userData) => {
		setLoading(true);
		setError("");

		try {
			await AuthService.signup(userData);
			onSuccess();
			onClose();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleModeSwitch = () => {
		setCurrentMode(currentMode === "login" ? "signup" : "login");
		setError("");
	};

	const title = currentMode === "login" ? "Autentificare" : "Înregistrare";

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={title}>
			{currentMode === "login" ? (
				<LoginForm
					onSubmit={handleLogin}
					loading={loading}
				/>
			) : (
				<SignupForm
					onSubmit={handleSignup}
					loading={loading}
				/>
			)}

			{error && (
				<div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
					<div className="text-sm text-red-600 dark:text-red-400">{error}</div>
				</div>
			)}

			<div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
				{currentMode === "login" ? "Nu ai cont? " : "Ai deja cont? "}
				<button
					type="button"
					onClick={handleModeSwitch}
					className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
					{currentMode === "login" ? "Înregistrează-te" : "Conectează-te"}
				</button>
			</div>
		</Modal>
	);
};

export default AuthModal;
