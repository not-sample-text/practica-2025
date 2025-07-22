import React, { useState, useEffect, useRef } from "react";

const GlobalChat = ({ messages, sendMessage, username, connectionStatus }) => {
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(scrollToBottom, [messages]);

	const handleSendMessage = () => {
		if (newMessage.trim() && connectionStatus === "connected") {
			sendMessage({
				type: "broadcast",
				content: newMessage
			});
			setNewMessage("");
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const globalMessages = messages.filter((msg) => msg.type === "broadcast");

	return (
		<div className="flex flex-col h-full bg-white dark:bg-stone-800 rounded-lg shadow-lg">
			<div className="flex-1 p-4 overflow-y-auto">
				{globalMessages.length === 0 ? (
					<div className="text-center text-gray-500 dark:text-gray-400 mt-8">
						<p className="text-lg">
							<span className="mr-2">💬</span>
							No messages yet. Start the conversation!
						</p>
					</div>
				) : (
					globalMessages.map((message, index) => {
						const isCurrentUser = message.username === username;
						return (
							<div
								key={index}
								className={`flex mb-3 ${
									isCurrentUser ? "justify-end" : "justify-start"
								}`}>
								<div
									className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
										isCurrentUser
											? "bg-indigo-600 dark:bg-indigo-700 text-white"
											: "bg-gray-100 dark:bg-stone-700 text-gray-900 dark:text-gray-100"
									}`}>
									{!isCurrentUser && (
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
											{message.username}
										</div>
									)}
									<div className="text-sm">{message.content}</div>
									<div className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-1">
										{new Date(message.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit"
										})}
									</div>
								</div>
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t border-gray-200 dark:border-stone-600">
				<div className="flex space-x-2">
					<input
						type="text"
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyUp={handleKeyPress}
						placeholder="Type a message to everyone..."
						disabled={connectionStatus !== "connected"}
						className="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
					/>
					<button
						onClick={handleSendMessage}
						disabled={connectionStatus !== "connected" || !newMessage.trim()}
						className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors">
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default GlobalChat;
