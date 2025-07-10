import React, { useState } from "react";

const Login = ({ onLogin, onClose, isSignup = false }) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [error, setError] = useState("");
	const [usernameError, setUsernameError] = useState("");
	const [passwordError, setPasswordError] = useState("");

	const validateForm = () => {
		let isValid = true;
		setUsernameError("");
		setPasswordError("");
		setError("");

		if (!username || username.length < 3) {
			setUsernameError("Numele trebuie să aibă cel puțin 3 caractere.");
			isValid = false;
		}

		if (!password || password.length < 6) {
			setPasswordError("Parola trebuie să aibă cel puțin 6 caractere.");
			isValid = false;
		}

		if (isSignup && password !== passwordConfirm) {
			setPasswordError("Parolele nu se potrivesc.");
			isValid = false;
		}

		return isValid;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const endpoint = isSignup ? "/signup" : "/login";
		const body = isSignup
			? { username, password, password_confirm: passwordConfirm }
			: { username, password };

		fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(
						isSignup
							? "Înregistrare eșuată."
							: "Autentificare eșuată. Verificați datele."
					);
				}
				return response.json();
			})
			.then(() => {
				onLogin();
			})
			.catch((error) => {
				setError(error.message);
			});
	};

	return (
		<div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-lg font-semibold text-gray-900">
						{isSignup ? "Înregistrare" : "Autentificare"}
					</h2>
					<button
						type="button"
						className="text-gray-400 hover:text-gray-600 transition-colors"
						onClick={onClose}>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div className="p-6">
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						<div>
							<label
								htmlFor="nume"
								className="block text-sm font-medium text-gray-700 mb-1">
								Nume
							</label>
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								id="nume"
								name="username"
								placeholder="Nume"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
							{usernameError && (
								<div className="mt-1 text-sm text-red-600">{usernameError}</div>
							)}
						</div>

						<div>
							<label
								htmlFor="parola"
								className="block text-sm font-medium text-gray-700 mb-1">
								Parolă
							</label>
							<input
								type="password"
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								id="parola"
								name="password"
								placeholder="Parola"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
							{passwordError && (
								<div className="mt-1 text-sm text-red-600">{passwordError}</div>
							)}
						</div>

						{isSignup && (
							<div>
								<label
									htmlFor="parola-confirm"
									className="block text-sm font-medium text-gray-700 mb-1">
									Confirmă Parola
								</label>
								<input
									type="password"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									id="parola-confirm"
									name="password_confirm"
									placeholder="Confirmă Parola"
									value={passwordConfirm}
									onChange={(e) => setPasswordConfirm(e.target.value)}
									required
								/>
							</div>
						)}

						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-md">
								<div className="text-sm text-red-600">{error}</div>
							</div>
						)}

						<button
							type="submit"
							className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
							{isSignup ? "Înregistrează-te" : "Conectare"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;
