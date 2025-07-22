import React, { useState } from "react";
import GlobalChat from "./GlobalChat";
import PrivateChat from "./PrivateChat";
import RoomChat from "./RoomChat";

const ChatContainer = ({
	username,
	messages,
	sendMessage,
	connectionStatus,
	activeChats = [],
	onCloseChat,
	// Room-specific props
	availableRooms = [],
	joinedRooms = [],
	usersInRooms = new Map(),
	onJoinRoom,
	onCreateRoom,
	onLeaveRoom,
	currentRoom,
	onRoomSelect,
	roomNotifications = new Map(),
	onClearRoomNotifications
}) => {
	const [activeTab, setActiveTab] = useState("global");
	const [isMinimized, setIsMinimized] = useState(false);

	const getChatCount = (chatType) => {
		switch (chatType) {
			case "global":
				return messages.filter((msg) => msg.type === "broadcast").length;
			case "rooms":
				return joinedRooms.length;
			default:
				return activeChats.filter((chat) => chat.chatname !== "broadcast")
					.length;
		}
	};

	const getUnreadCount = (chatType) => {
		switch (chatType) {
			case "rooms":
				// Sum up all room notifications
				let totalRoomNotifications = 0;
				roomNotifications.forEach((count) => (totalRoomNotifications += count));
				return totalRoomNotifications;
			case "private":
				// This could be enhanced with actual unread message tracking for private chats
				return 0;
			default:
				return 0;
		}
	};

	const renderChatContent = () => {
		switch (activeTab) {
			case "global":
				return (
					<GlobalChat
						messages={messages}
						sendMessage={sendMessage}
						username={username}
						connectionStatus={connectionStatus}
					/>
				);
			case "rooms":
				return (
					<RoomChat
						messages={messages}
						username={username}
						connectionStatus={connectionStatus}
						sendMessage={sendMessage}
						availableRooms={availableRooms}
						joinedRooms={joinedRooms}
						usersInRooms={usersInRooms}
						onJoinRoom={onJoinRoom}
						onCreateRoom={onCreateRoom}
						onLeaveRoom={onLeaveRoom}
						currentRoom={currentRoom}
						onRoomSelect={onRoomSelect}
						roomNotifications={roomNotifications}
						onClearRoomNotifications={onClearRoomNotifications}
					/>
				);
			case "private":
				return (
					<div className="flex flex-col h-full">
						{activeChats.filter((chat) => chat.chatname !== "broadcast")
							.length === 0 ? (
							<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
								<div className="text-center">
									<div className="text-6xl mb-4">💬</div>
									<h4 className="text-xl">No private chats open</h4>
									<p className="text-sm mt-2">
										Click on a user from the sidebar to start a private chat
									</p>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4">
								{activeChats
									.filter((chat) => chat.chatname !== "broadcast")
									.map((chat) => (
										<div
											key={chat.chatname}
											className="relative">
											<button
												onClick={() => onCloseChat(chat.chatname)}
												className="absolute top-2 right-2 z-10 p-1 text-gray-500 hover:text-red-500 bg-white dark:bg-stone-800 rounded-full shadow-sm">
												✕
											</button>
											<PrivateChat
												messages={messages}
												sendMessage={sendMessage}
												username={username}
												connectionStatus={connectionStatus}
												chatPartner={chat.chatname}
											/>
										</div>
									))}
							</div>
						)}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className={`fixed bottom-0 right-0 w-full max-w-4xl bg-white dark:bg-stone-800 rounded-t-lg shadow-lg border border-gray-200 dark:border-stone-600 flex flex-col transition-all duration-300 ${
				isMinimized ? "h-12" : "h-96"
			}`}>
			{/* Chat Tabs */}
			<div className="flex border-b border-gray-200 dark:border-stone-600">
				<button
					onClick={() => setActiveTab("global")}
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "global"
							? "bg-indigo-600 text-white"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
					}`}>
					Global
					{getUnreadCount("global") > 0 && (
						<span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
							{getUnreadCount("global")}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("rooms")}
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "rooms"
							? "bg-indigo-600 text-white"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
					}`}>
					Rooms ({joinedRooms.length})
					{getUnreadCount("rooms") > 0 && (
						<span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
							{getUnreadCount("rooms")}
						</span>
					)}
				</button>
				<button
					onClick={() => setActiveTab("private")}
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "private"
							? "bg-indigo-600 text-white"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
					}`}>
					Private (
					{activeChats.filter((chat) => chat.chatname !== "broadcast").length})
					{getUnreadCount("private") > 0 && (
						<span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
							{getUnreadCount("private")}
						</span>
					)}
				</button>

				{/* Minimize/Maximize Button */}
				<button
					onClick={() => setIsMinimized(!isMinimized)}
					className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
					{isMinimized ? "⬆️" : "⬇️"}
				</button>
			</div>

			{/* Chat Content */}
			{!isMinimized && (
				<div className="flex-1 overflow-hidden">{renderChatContent()}</div>
			)}
		</div>
	);
};

export default ChatContainer;
