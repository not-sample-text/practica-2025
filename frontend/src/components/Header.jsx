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
			const message = JSON.parse(event.data);
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
			})
			.catch((error) => {
				console.error("Eroare la deconectare:", error);
			});
	};

	const sendMessage = (e) => {
		if (e.key === "Enter" && messageInput.trim()) {
			const message = {
				username: token?.username || "Unknown",
				text: messageInput.trim(),
				timestamp: new Date().toISOString()
			};

			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(message));
			}

			setMessageInput("");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Navbar */}
			<nav className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h2 className="text-xl font-bold text-gray-900">Games Hub</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-700">
								Salut,{" "}
								<span className="font-medium">
									{token?.username || "Unknown"}
								</span>
								!
							</span>
							<button
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<h1 className="text-2xl font-bold text-gray-900">
						Bun venit,{" "}
						<span className="text-blue-600">
							{token?.username || "Unknown"}
						</span>
						!
					</h1>
					<p className="text-gray-600 mt-2">
						Bucură-te de experiența de gaming și conectează-te cu prietenii!
					</p>
				</div>

				{/* Main content area - can be expanded later */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Game Center
					</h2>
					<p className="text-gray-600">Game content will go here</p>
				</div>
			</div>

			{/* Chat UI */}
			<div className="fixed bottom-0 right-0 w-80 bg-white border-l border-t shadow-lg">
				<div className="bg-gray-50 px-4 py-3 border-b">
					<h3 className="text-sm font-medium text-gray-900">Chat</h3>
				</div>
				<div className="h-60 overflow-y-auto p-4 space-y-2">
					{messages.map((msg, index) => (
						<div
							key={index}
							className="bg-gray-100 rounded-lg p-3">
							<span className="font-medium text-gray-900">{msg.username}:</span>
							<span className="text-gray-700 ml-2">{msg.text}</span>
						</div>
					))}
				</div>
				<div className="p-4 border-t">
					<input
						type="text"
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
