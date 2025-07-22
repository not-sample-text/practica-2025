import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import {
	IconWorld,
	IconHome,
	IconMessage,
	IconMessages
} from "@tabler/icons-react";
import Button from "../ui/Button";

const ChatDisplay = ({
	chatType = "global", // 'global', 'room', 'private'
	chatTarget = null, // room name or username for private chat
	username,
	messages,
	sendMessage,
	connectionStatus,
	onLeaveRoom = null
}) => {
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef(null);
	const { state, actions } = useAppContext();
	const { websocket, gameState } = state;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = () => {
		if (!newMessage.trim() || connectionStatus !== "connected") return;

		let messageData;
		switch (chatType) {
			case "global":
				messageData = {
					type: "broadcast",
					content: newMessage
				};
				break;
			case "room":
				messageData = {
					type: "sendRoomMessage",
					room: chatTarget?.toLowerCase(), // Normalize to match backend
					content: newMessage
				};
				break;
			case "private":
				messageData = {
					type: "private",
					chatname: chatTarget,
					content: newMessage
				};
				break;
			default:
				return;
		}

		sendMessage(messageData);
		setNewMessage("");
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const getFilteredMessages = useMemo(() => {
		switch (chatType) {
			case "global":
				return messages.filter((msg) => msg.type === "broadcast");
			case "room":
				return messages.filter(
					(msg) =>
						msg.type === "room_message" &&
						msg.room?.toLowerCase() === chatTarget?.toLowerCase()
				);
			case "private":
				return messages.filter((msg) => {
					if (msg.type !== "private") return false;

					// Check if this is a conversation between current user and chatTarget
					const isConversationParticipant =
						(msg.sender === username && msg.chatname === chatTarget) ||
						(msg.sender === chatTarget && msg.chatname === username) ||
						(msg.sender === username && msg.username === chatTarget) ||
						(msg.sender === chatTarget && msg.username === username) ||
						// Legacy format compatibility
						((msg.username === username || msg.username === chatTarget) &&
							(msg.chatname === username || msg.chatname === chatTarget));

					return isConversationParticipant;
				});
			default:
				return [];
		}
	}, [messages, chatType, chatTarget, username]);

	const getChatTitle = () => {
		switch (chatType) {
			case "global":
				return (
					<div className="flex items-center gap-2">
						<IconWorld
							size={20}
							className="text-blue-500"
						/>
						<span>Global Chat</span>
					</div>
				);
			case "room":
				return (
					<div className="flex items-center gap-2">
						<IconHome
							size={20}
							className="text-green-500"
						/>
						<span>{chatTarget}</span>
					</div>
				);
			case "private":
				return (
					<div className="flex items-center gap-2">
						<IconMessage
							size={20}
							className="text-purple-500"
						/>
						<span>{chatTarget}</span>
					</div>
				);
			default:
				return "Chat";
		}
	};

	const getPlaceholder = () => {
		switch (chatType) {
			case "global":
				return "Type a message to everyone...";
			case "room":
				return `Send a message in ${chatTarget}...`;
			case "private":
				return `Message ${chatTarget}...`;
			default:
				return "Type a message...";
		}
	};

	// Game functionality
	const handleStartBlackjack = () => {
		if (websocket && websocket.readyState === WebSocket.OPEN) {
			websocket.send(
				JSON.stringify({
					type: "start_room_game",
					room: chatTarget?.toLowerCase(), // Normalize to match backend
					gameType: "blackjack"
				})
			);
		} else {
			actions.setError("Connection lost. Please try again.");
		}
	};

	// Check if this room has an active game
	const isGameRoom = gameState && gameState.room === chatTarget;
	const canStartGame =
		chatType === "room" && !isGameRoom && connectionStatus === "connected";

	const filteredMessages = getFilteredMessages;

	return (
		<div className="flex flex-col h-screen bg-white dark:bg-stone-800">
			{/* Chat Header */}
			<div className="p-4 border-b border-gray-200 dark:border-stone-600">
				<div className="flex items-center justify-between mb-2">
					<div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						{getChatTitle()}
					</div>
					<div className="flex items-center gap-2">
						{/* Game Status Indicator */}
						{isGameRoom && (
							<span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
								🃏 Game Active
							</span>
						)}
						{chatType === "room" && onLeaveRoom && (
							<button
								onClick={() => onLeaveRoom(chatTarget)}
								className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
								Leave Room
							</button>
						)}
					</div>
				</div>

				{/* Game Controls */}
				{canStartGame && (
					<div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-blue-900 dark:text-blue-100">
									🎮 Start a Game
								</p>
								<p className="text-xs text-blue-700 dark:text-blue-300">
									Turn this room into a Blackjack game room
								</p>
							</div>
							<Button
								onClick={handleStartBlackjack}
								variant="primary"
								size="sm">
								Start Blackjack
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 p-4 overflow-y-auto">
				{filteredMessages.length === 0 ? (
					<div className="text-center text-gray-500 dark:text-gray-400 mt-8">
						<div className="flex flex-col items-center">
							<IconMessages
								size={48}
								className="mb-4 text-gray-400"
							/>
							<p className="text-lg">
								{chatType === "global" &&
									"No messages yet. Start the conversation!"}
								{chatType === "room" &&
									`No messages in ${chatTarget} yet. Be the first!`}
								{chatType === "private" &&
									`No messages with ${chatTarget} yet.`}
							</p>
						</div>
					</div>
				) : (
					filteredMessages.map((message, index) => {
						const isCurrentUser =
							(chatType === "global" && message.username === username) ||
							(chatType === "room" && message.sender === username) ||
							(chatType === "private" && message.sender === username);

						const displayName =
							chatType === "room"
								? message.sender
								: chatType === "private"
								? message.sender === username
									? "You"
									: message.sender
								: message.username;

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
											{displayName}
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

			{/* Message Input */}
			<div className="p-4 border-t border-gray-200 dark:border-stone-600">
				<div className="flex space-x-2">
					<input
						type="text"
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyUp={handleKeyPress}
						placeholder={getPlaceholder()}
						disabled={connectionStatus !== "connected"}
						className="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
					/>
					<button
						onClick={handleSendMessage}
						disabled={!newMessage.trim() || connectionStatus !== "connected"}
						className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors">
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatDisplay;
