import React, { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useChat } from "../hooks/useChat";
import { useRooms } from "../hooks/useRooms";
import { useAppContext } from "../context/AppContext";
import Navbar from "./layout/Navbar";
import ChatSidebar from "./chat/ChatSidebar";
import ChatDisplay from "./chat/ChatDisplay";
import BlackjackTable from "./game/BlackjackTable";
import AuthService from "../services/authService";
import { clearTokenCookie } from "../utils/auth";

/**
 * Dashboard component - responsible for the authenticated user experience
 */
const Dashboard = ({ user, onLogout }) => {
	const [showChats, setShowChats] = useState(true);
	const [isChatCollapsed, setIsChatCollapsed] = useState(false);
	const [activeChat, setActiveChatState] = useState({
		type: "global",
		target: null
	});

	// Get app context for game state
	const { state } = useAppContext();
	const { currentRoom: gameCurrentRoom, gameState } = state;

	const {
		connectionStatus,
		messages,
		users,
		sendMessage,
		requestHistoricalMessages,
		unreadCounts,
		markChatAsRead,
		setActiveChat,
		connectWebSocket,
		availableRooms,
		joinedRooms,
		usersInRooms
	} = useWebSocket(user?.username);

	const { currentRoom, joinRoom, leaveRoom, createRoom, selectRoom } =
		useRooms(sendMessage);

	const {
		activeChats,
		newMessages,
		roomNotifications,
		addPrivateChat,
		closeChat,
		markMessageAsRead,
		addRoomNotification,
		clearRoomNotifications
	} = useChat();

	const handleUserClick = (username) => {
		markMessageAsRead(username);
		addPrivateChat(username);
		setActiveChatState({
			type: "private",
			target: username
		});
		// Request historical messages for this private chat
		requestHistoricalMessages("private", username);
		// Set active chat for unread tracking
		setActiveChat("private", username);
	};

	const handleRoomSelect = (roomName) => {
		selectRoom(roomName);
		if (clearRoomNotifications) clearRoomNotifications(roomName);
		setActiveChatState({
			type: "room",
			target: roomName
		});
		// Request historical messages for this room
		requestHistoricalMessages("room", roomName);
		// Set active chat for unread tracking
		setActiveChat("room", roomName);
	};

	const handleGlobalChatSelect = () => {
		setActiveChatState({
			type: "global",
			target: null
		});
		// Request historical messages for global chat
		requestHistoricalMessages("global", null);
		// Set active chat for unread tracking
		setActiveChat("global", null);
	};

	const handleLogout = async () => {
		try {
			await AuthService.logout();
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			clearTokenCookie();
			onLogout();
		}
	};

	const handleToggleChats = () => {
		setShowChats(!showChats);
	};

	// Check if current room is a game room
	const isGameRoom = currentRoom && gameState && gameState.room === currentRoom;

	const handleToggleChatCollapse = () => {
		setIsChatCollapsed(!isChatCollapsed);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-stone-900 flex">
			{/* Chat Sidebar */}
			{showChats && (
				<ChatSidebar
					username={user?.username}
					messages={messages}
					sendMessage={sendMessage}
					connectionStatus={connectionStatus}
					users={users}
					activeChats={activeChats}
					onUserClick={handleUserClick}
					newMessages={newMessages}
					availableRooms={availableRooms}
					joinedRooms={joinedRooms}
					usersInRooms={usersInRooms}
					onJoinRoom={joinRoom}
					onCreateRoom={createRoom}
					onLeaveRoom={leaveRoom}
					currentRoom={currentRoom}
					onRoomSelect={handleRoomSelect}
					roomNotifications={roomNotifications}
					onClearRoomNotifications={clearRoomNotifications}
					isCollapsed={isChatCollapsed}
					onToggleCollapse={handleToggleChatCollapse}
					onGlobalChatSelect={handleGlobalChatSelect}
					activeChat={activeChat}
					unreadCounts={unreadCounts}
					markChatAsRead={markChatAsRead}
					setActiveChat={setActiveChat}
				/>
			)}

			{/* Main Content */}
			<div
				className={`flex-1 flex ${
					showChats ? (isChatCollapsed ? "ml-16" : "ml-80") : "ml-0"
				}`}>
				{/* Left Side - Game Content */}
				<div className="flex-1 flex flex-col">
					<Navbar
						user={user}
						connectionStatus={connectionStatus}
						onReconnect={connectWebSocket}
						onToggleUsers={handleToggleChats}
						onLogout={handleLogout}
						showUsers={showChats}
					/>

					<div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
						{/* Game Room - Show BlackjackTable */}
						{isGameRoom ? (
							<BlackjackTable />
						) : (
							<>
								{/* Welcome Message */}
								<div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm p-6 mb-6">
									<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										Welcome,{" "}
										<span className="text-indigo-600 dark:text-indigo-400">
											{user?.username || "Unknown"}
										</span>
										!
									</h1>
									<p className="text-gray-600 dark:text-gray-300 mt-2">
										Enjoy your gaming experience and connect with friends!
									</p>
								</div>

								{/* Game Center */}
								<div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm p-6">
									<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
										Game Center
									</h2>
									<div className="space-y-4">
										<p className="text-gray-600 dark:text-gray-300">
											Welcome to the Game Center! Here you can:
										</p>
										<ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
											<li>Create or join Blackjack game rooms</li>
											<li>Chat with other players in real-time</li>
											<li>Participate in multiplayer card games</li>
											<li>Spectate ongoing games to learn strategies</li>
										</ul>
										<div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
											<h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
												🎮 Ready to Play Blackjack?
											</h3>
											<p className="text-blue-700 dark:text-blue-300 text-sm">
												Join any chat room and click "Start Blackjack" to turn
												it into a game room!
											</p>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Right Side - Chat Display */}
				{showChats && !isChatCollapsed && (
					<div className="w-96 border-l border-gray-200 dark:border-stone-600">
						<ChatDisplay
							chatType={activeChat.type}
							chatTarget={activeChat.target}
							username={user?.username}
							messages={messages}
							sendMessage={sendMessage}
							connectionStatus={connectionStatus}
							onLeaveRoom={leaveRoom}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
