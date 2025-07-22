import React, { useState, useEffect, useRef } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import ConnectionStatus from "./ui/ConnectionStatus";

/**
 * Chat component - responsible only for chat UI and message display
 */
const Chat = ({
	chatname = "broadcast",
	username,
	messages,
	sendMessage,
	connectionStatus,
	onClose,
	forceMinimized = false
}) => {
	const [newMessage, setNewMessage] = useState("");
	const [isChatMinimized, setIsChatMinimized] = useState(false);
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Effect to handle forced minimization
	useEffect(() => {
		if (forceMinimized) {
			setIsChatMinimized(true);
		}
	}, [forceMinimized]);

	const handleSendMessage = () => {
		if (newMessage.trim() && connectionStatus === "connected") {
			sendMessage({
				type: chatname === "broadcast" ? "broadcast" : "private",
				chatname,
				content: newMessage
			});
			setNewMessage("");
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const filteredMessages =
		chatname === "broadcast"
			? messages.filter((msg) => msg.type === "broadcast")
			: messages.filter(
					(msg) =>
						msg.type === "private" &&
						(msg.username === chatname || msg.sender === username)
			  );

	return (
		<div
			className={`bg-white dark:bg-stone-800 h-96 rounded-lg shadow-lg fixed right-0 flex flex-col transition-all duration-300 w-80
				${isChatMinimized ? "-bottom-80" : "bottom-0"}`}>
			{/* Chat Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-stone-600">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					{chatname === "broadcast" ? "Public Chat" : `${chatname}`}
				</h3>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setIsChatMinimized(!isChatMinimized)}
						className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none">
						<svg
							className={`w-4 h-4 transform transition-transform ${
								isChatMinimized ? "rotate-180" : ""
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{onClose && (
						<button
							onClick={onClose}
							className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					)}
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{filteredMessages.length === 0 ? (
					<div className="text-center text-gray-500 dark:text-gray-400 mt-8">
						{chatname === "broadcast"
							? "No messages yet. Start the conversation!"
							: `No messages with ${chatname} yet.`}
					</div>
				) : (
					filteredMessages.map((message, index) => (
						<div
							key={index}
							className={`flex ${
								message.username === username ? "justify-end" : "justify-start"
							}`}>
							<div
								className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
									message.username === username
										? "bg-indigo-600 dark:bg-indigo-700 text-white"
										: "bg-gray-100 dark:bg-stone-700 text-gray-900 dark:text-gray-100"
								}`}>
								{message.username !== username && (
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
					))
				)}
				<div ref={messagesEndRef} />
			</div>
			{/* Message Input */}
			<div className="p-4 border-t border-gray-200 dark:border-stone-600">
				<div className="flex space-x-2">
					<input
						type="text"
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyUp={handleKeyPress}
						placeholder={`Message ${
							chatname === "broadcast" ? "everyone" : chatname
						}...`}
						disabled={connectionStatus !== "connected"}
						className="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
					/>
					<Button
						onClick={handleSendMessage}
						disabled={!newMessage.trim() || connectionStatus !== "connected"}
						variant="primary"
						size="medium">
						Send
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Chat;
