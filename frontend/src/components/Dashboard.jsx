import React, { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useChat } from "../hooks/useChat";
import Navbar from "./layout/Navbar";
import Chat from "./Chat";
import ActiveUsers from "./ActiveUsers";
import AuthService from "../services/authService";
import { clearTokenCookie } from "../utils/auth";

/**
 * Dashboard component - responsible for the authenticated user experience
 */
const Dashboard = ({ user, onLogout }) => {
	const [showUsers, setShowUsers] = useState(true);

	const { connectionStatus, messages, users, sendMessage, connectWebSocket } =
		useWebSocket(user?.username);

	const {
		activeChats,
		newMessages,
		addPrivateChat,
		closeChat,
		markMessageAsRead
	} = useChat();

	const handleUserClick = (username) => {
		markMessageAsRead(username);
		addPrivateChat(username);
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

	const handleToggleUsers = () => {
		setShowUsers(!showUsers);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-stone-900">
			<Navbar
				user={user}
				connectionStatus={connectionStatus}
				onReconnect={connectWebSocket}
				onToggleUsers={handleToggleUsers}
				onLogout={handleLogout}
				showUsers={showUsers}
			/>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Main Content Area */}
					<div className="lg:col-span-3 space-y-6">
						{/* Welcome Message */}
						<div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm p-6">
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
							<p className="text-gray-600 dark:text-gray-300">
								Game content will go here
							</p>
						</div>

						{/* Chat Areas */}
						<div className="space-y-4">
							{activeChats.map((chat) => (
								<Chat
									key={chat.chatname}
									chatname={chat.chatname}
									username={user?.username}
									messages={messages}
									sendMessage={sendMessage}
									connectionStatus={connectionStatus}
									onClose={
										chat.chatname !== "broadcast"
											? () => closeChat(chat.chatname)
											: null
									}
								/>
							))}
						</div>
					</div>

					{/* Sidebar */}
					{showUsers && (
						<div className="lg:col-span-1">
							<ActiveUsers
								users={users}
								newMessages={newMessages}
								onUserClick={handleUserClick}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
