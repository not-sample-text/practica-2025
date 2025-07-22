import React, { useState } from "react";
import {
	IconWorld,
	IconHome,
	IconMessage,
	IconChevronDown,
	IconChevronRight,
	IconLayoutSidebarLeftExpand,
	IconLayoutSidebarLeftCollapse,
	IconClipboardList,
	IconUserPlus,
	IconDoorExit
} from "@tabler/icons-react";
import UnreadBadge from "../ui/UnreadBadge";
const ChatSidebar = ({
	username,
	messages,
	sendMessage,
	connectionStatus,
	users,
	activeChats,
	onUserClick,
	newMessages,
	availableRooms,
	joinedRooms,
	usersInRooms,
	onJoinRoom,
	onCreateRoom,
	onLeaveRoom,
	currentRoom,
	onRoomSelect,
	roomNotifications,
	onClearRoomNotifications,
	isCollapsed,
	onToggleCollapse,
	onGlobalChatSelect,
	activeChat,
	unreadCounts,
	markChatAsRead,
	setActiveChat
}) => {
	const [expandedSections, setExpandedSections] = useState({
		global: true,
		rooms: true,
		private: true
	});

	const toggleSection = (section) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	const getUnreadCount = (type, item = null) => {
		if (!unreadCounts) return 0;

		switch (type) {
			case "global":
				return unreadCounts.global || 0;
			case "rooms":
				if (item) {
					return unreadCounts.rooms?.[item] || 0;
				}
				// Total room notifications
				return Object.values(unreadCounts.rooms || {}).reduce(
					(sum, count) => sum + count,
					0
				);
			case "private":
				if (item) {
					return unreadCounts.private?.[item] || 0;
				}
				// Total private notifications
				return Object.values(unreadCounts.private || {}).reduce(
					(sum, count) => sum + count,
					0
				);
			default:
				return 0;
		}
	};

	const renderUnreadBadge = (count) => {
		return <UnreadBadge count={count} />;
	};

	const renderCollapsedView = () => (
		<div className="w-16 h-screen bg-white dark:bg-stone-800 border-r border-gray-200 dark:border-stone-600 flex flex-col items-center py-4 space-y-4">
			<button
				onClick={onToggleCollapse}
				className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
				title="Expand Chat">
				<IconLayoutSidebarLeftExpand size={20} />
			</button>

			{/* Global Chat Icon */}
			<div className="relative">
				<button
					onClick={() => toggleSection("global")}
					className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					title="Global Chat">
					<IconWorld size={20} />
				</button>
				{renderUnreadBadge(getUnreadCount("global"))}
			</div>

			{/* Rooms Icon */}
			<div className="relative">
				<button
					onClick={() => toggleSection("rooms")}
					className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					title="Chat Rooms">
					<IconHome size={20} />
				</button>
				{renderUnreadBadge(getUnreadCount("rooms"))}
			</div>

			{/* Private Chats Icon */}
			<div className="relative">
				<button
					onClick={() => toggleSection("private")}
					className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					title="Private Chats">
					<IconMessage size={20} />
				</button>
				{renderUnreadBadge(getUnreadCount("private"))}
			</div>
		</div>
	);

	const renderExpandedView = () => (
		<div className="w-80 h-screen bg-white dark:bg-stone-800 border-r border-gray-200 dark:border-stone-600 flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 dark:border-stone-600 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Chats
				</h2>
				<button
					onClick={onToggleCollapse}
					className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
					title="Collapse Chat">
					<IconLayoutSidebarLeftCollapse size={18} />
				</button>
			</div>

			{/* Chat Sections */}
			<div className="flex-1 overflow-y-auto">
				{/* Global Chat Section */}
				<div className="border-b border-gray-200 dark:border-stone-600">
					<button
						onClick={() => {
							toggleSection("global");
							if (onGlobalChatSelect) onGlobalChatSelect();
							if (setActiveChat) setActiveChat("global", null);
						}}
						className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
							activeChat?.type === "global"
								? "bg-indigo-100 dark:bg-indigo-900"
								: "hover:bg-gray-50 dark:hover:bg-stone-700"
						}`}>
						<div className="flex items-center space-x-3">
							<IconWorld
								size={20}
								className="text-blue-500"
							/>
							<span className="font-medium text-gray-900 dark:text-gray-100">
								Global Chat
							</span>
						</div>
						<div className="flex items-center space-x-2">
							{renderUnreadBadge(getUnreadCount("global"))}
						</div>
					</button>
				</div>

				{/* Rooms Section */}
				<div className="border-b border-gray-200 dark:border-stone-600">
					<button
						onClick={() => toggleSection("rooms")}
						className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors">
						<div className="flex items-center space-x-3">
							<IconHome
								size={20}
								className="text-green-500"
							/>
							<span className="font-medium text-gray-900 dark:text-gray-100">
								Rooms ({joinedRooms.length})
							</span>
						</div>
						<div className="flex items-center space-x-2">
							{renderUnreadBadge(getUnreadCount("rooms"))}
							{expandedSections.rooms ? (
								<IconChevronDown size={16} />
							) : (
								<IconChevronRight size={16} />
							)}
						</div>
					</button>

					{expandedSections.rooms && (
						<div className="px-4 pb-4 space-y-2">
							{/* Create Room */}
							<div className="flex space-x-2">
								<input
									type="text"
									placeholder="Room name..."
									className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100"
									onKeyUp={(e) => {
										if (e.key === "Enter" && e.target.value.trim()) {
											onCreateRoom(e.target.value.trim());
											e.target.value = "";
										}
									}}
								/>
								<button
									onClick={() => {
										const input = document.querySelector(
											'input[placeholder="Room name..."]'
										);
										if (input.value.trim()) {
											onCreateRoom(input.value.trim());
											input.value = "";
										}
									}}
									className="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
									<IconUserPlus size={16} />
								</button>
							</div>

							{/* Joined Rooms */}
							{joinedRooms.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
										My Rooms
									</h4>
									{joinedRooms.map((room) => (
										<button
											key={room}
											onClick={() => {
												onRoomSelect(room);
												if (onClearRoomNotifications)
													onClearRoomNotifications(room);
												if (setActiveChat) setActiveChat("room", room);
											}}
											className={`w-full p-2 text-left text-sm rounded transition-colors flex items-center justify-between ${
												activeChat?.type === "room" &&
												activeChat?.target === room
													? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
													: "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-300"
											}`}>
											<span># {room}</span>
											{renderUnreadBadge(getUnreadCount("rooms", room))}
										</button>
									))}
								</div>
							)}

							{/* Available Rooms */}
							{availableRooms.filter((room) => !joinedRooms.includes(room))
								.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
										Available Rooms
									</h4>
									{availableRooms
										.filter((room) => !joinedRooms.includes(room))
										.map((room) => (
											<button
												key={room}
												onClick={() => onJoinRoom(room)}
												className="w-full p-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stone-600 rounded transition-colors">
												# {room}
											</button>
										))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Private Chats Section */}
				<div>
					<button
						onClick={() => toggleSection("private")}
						className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors">
						<div className="flex items-center space-x-3">
							<IconMessage
								size={20}
								className="text-purple-500"
							/>
							<span className="font-medium text-gray-900 dark:text-gray-100">
								Private Chats
							</span>
						</div>
						<div className="flex items-center space-x-2">
							{renderUnreadBadge(getUnreadCount("private"))}
							{expandedSections.private ? (
								<IconChevronDown size={16} />
							) : (
								<IconChevronRight size={16} />
							)}
						</div>
					</button>

					{expandedSections.private && (
						<div className="px-4 pb-4 space-y-2">
							{/* Active Private Chats */}
							{activeChats.filter((chat) => chat.chatname !== "broadcast")
								.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
										Active Chats
									</h4>
									{activeChats
										.filter((chat) => chat.chatname !== "broadcast")
										.map((chat) => (
											<button
												key={chat.chatname}
												onClick={() => {
													onUserClick(chat.chatname);
													if (setActiveChat)
														setActiveChat("private", chat.chatname);
												}}
												className={`w-full p-2 text-left text-sm rounded transition-colors flex items-center justify-between ${
													activeChat?.type === "private" &&
													activeChat?.target === chat.chatname
														? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
														: "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-300"
												}`}>
												<span>@ {chat.chatname}</span>
												{renderUnreadBadge(
													getUnreadCount("private", chat.chatname)
												)}
											</button>
										))}
								</div>
							)}

							{/* Available Users */}
							{users && users.length > 0 && (
								<div>
									<h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
										Active Users ({users.length})
									</h4>
									{users.map((user, idx) => (
										<button
											key={user || idx}
											onClick={() => onUserClick(user)}
											className={`w-full p-2 text-left text-sm rounded transition-colors flex items-center justify-between ${
												activeChat?.type === "private" &&
												activeChat?.target === user
													? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
													: "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-600 dark:text-gray-400"
											}`}>
											<span>@ {user}</span>
											{renderUnreadBadge(getUnreadCount("private", user))}
										</button>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<div className="fixed left-0 top-0 z-30">
			{isCollapsed ? renderCollapsedView() : renderExpandedView()}
		</div>
	);
};

export default ChatSidebar;
