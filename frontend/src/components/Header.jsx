import React, { useState, useEffect } from "react";

const getTokenFromCookie = () => {
	const match = document.cookie.match(/token=([^;]+)/);
	return match ? match[1] : null;
};

const decodeJWTPayload = (token) => {
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

const Header = ({ onLogout }) => {
	const [token] = useState(decodeJWTPayload(getTokenFromCookie()));
	const [messages, setMessages] = useState([]);
	const [messageInput, setMessageInput] = useState("");
	const [ws, setWs] = useState(null);

	useEffect(() => {
		// Initialize WebSocket connection
		const websocket = new WebSocket("ws://localhost:3000/ws");

		websocket.onopen = () => {
			console.log("WebSocket connected");
		};

		websocket.onmessage = (event) => {
			// Split the received data: "token–messagetext"
			const [senderToken, messageText] = event.data.split("–");

			// Decode sender's username from their token
			const senderData = decodeJWTPayload(senderToken);
			const senderUsername = senderData?.username || "Unknown";

			// Create complete message object
			const message = {
				username: senderUsername, // <- sender's username, not yours!
				text: messageText,
				timestamp: new Date().toISOString()
			};

			// Add to messages
			setMessages((prev) => [...prev, message]);
		};

		websocket.onclose = () => {
			console.log("WebSocket disconnected");
		};

		setWs(websocket);

		return () => {
			websocket.close();
		};
	}, []);

	const logOut = () => {
		fetch("/logout")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Deconectare eșuată.");
				}
				onLogout(null);
				document.cookie =
					"token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			})
			.catch((error) => {
				console.error("Eroare la deconectare:", error);
			});
	};

	const sendMessage = (e) => {
		if (e.key === "Enter" && messageInput.trim()) {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(messageInput.trim());
			}

			setMessageInput("");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-stone-900">
			{/* Navbar */}
			<nav className="bg-white dark:bg-stone-800 shadow-sm border-b dark:border-stone-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
							Games Hub
						</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-700 dark:text-gray-300">
								Salut,{" "}
								<span className="font-medium">
									{token?.username || "Unknown"}
								</span>
								!
							</span>
							<button
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 rounded-md hover:bg-gray-50 dark:hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								onClick={logOut}>
								Deconectare
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome Message */}
				<div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm p-6 mb-8">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Bun venit,{" "}
						<span className="text-indigo-600 dark:text-indigo-400">
							{token?.username || "Unknown"}
						</span>
						!
					</h1>
					<p className="text-gray-600 dark:text-gray-300 mt-2">
						Bucură-te de experiența de gaming și conectează-te cu prietenii!
					</p>
				</div>

				{/* Main content area - can be expanded later */}
				<div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm p-6 mb-8">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
						Game Center
					</h2>
					<p className="text-gray-600 dark:text-gray-300">
						Game content will go here
					</p>
				</div>
			</div>

			{/* Chat UI */}

			<div className="fixed bottom-0 right-0 w-80 bg-white dark:bg-stone-800 border-l border-t dark:border-stone-700 shadow-lg">
				<div className="bg-gray-50 dark:bg-stone-700 px-4 py-3 border-b dark:border-stone-600">
					<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
						Chat
					</h3>
				</div>
				<div className="h-60 overflow-y-auto p-4 space-y-2">
					{messages.map((msg, index) => {
						const isMyMessage = msg.username === token?.username;

						return (
							<div
								key={index}
								className={`flex ${
									isMyMessage ? "justify-end" : "justify-start"
								}`}>
								<div
									className={`rounded-lg p-3 max-w-xs ${
										isMyMessage
											? "bg-blue-500 text-white rounded-br-none"
											: "bg-gray-100 dark:bg-stone-700 rounded-bl-none"
									}`}>
									{!isMyMessage && (
										<div className="font-medium text-xs text-gray-900 dark:text-gray-100 mb-1">
											{msg.username}
										</div>
									)}
									<div
										className={`${
											isMyMessage
												? "text-white"
												: "text-gray-700 dark:text-gray-300"
										} break-words max-w-60`}>
										{msg.text}
									</div>
									<div
										className={`font-medium text-xs mt-1 ${
											isMyMessage
												? "text-blue-100 text-right"
												: "text-gray-500 dark:text-gray-400 text-right"
										}`}>
										{new Date(msg.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit"
										})}
									</div>
								</div>
							</div>
						);
					})}
				</div>
				<div className="p-4 border-t dark:border-stone-700">
					<input
						type="text"
						className="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						value={messageInput}
						onChange={(e) => setMessageInput(e.target.value)}
						onKeyUp={sendMessage}
						placeholder="Scrie un mesaj către ceilalți"
					/>
				</div>
			</div>
		</div>
	);
};

export default Header;
