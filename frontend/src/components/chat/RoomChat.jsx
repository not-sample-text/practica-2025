import React, { useState, useEffect, useRef } from "react";

const RoomChat = ({
	messages,
	username,
	connectionStatus,
	sendMessage,
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
	const [newMessage, setNewMessage] = useState("");
	const [newRoomName, setNewRoomName] = useState("");
	const messagesEndRef = useRef(null);

	const currentRoomUserCount = usersInRooms.get(currentRoom) || 0;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const currentRoomMessages = React.useMemo(() => {
		if (!currentRoom) return [];
		return messages.filter(
			(msg) =>
				msg.type === "room_message" &&
				msg.room?.toLowerCase() === currentRoom.toLowerCase()
		);
	}, [messages, currentRoom]);

	useEffect(() => {
		scrollToBottom();
	}, [currentRoomMessages, currentRoom]);

	useEffect(() => {
		setNewMessage("");
	}, [currentRoom]);

	const handleSendMessage = () => {
		if (newMessage.trim() && connectionStatus === "connected" && currentRoom) {
			const messageObject = {
				type: "sendRoomMessage",
				room: currentRoom,
				content: newMessage
			};
			sendMessage(messageObject);
			setNewMessage("");
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleCreateRoom = () => {
		if (newRoomName.trim()) {
			onCreateRoom(newRoomName.trim());
			setNewRoomName("");
		}
	};

	const handleJoinRoom = (roomToJoin) => {
		onJoinRoom(roomToJoin);
	};

	const handleLeaveRoom = () => {
		if (currentRoom && onLeaveRoom) {
			onLeaveRoom(currentRoom);
		}
	};

	const isUserInCurrentRoom = currentRoom && joinedRooms.includes(currentRoom);

	return (
		<div className="flex h-full">
			{/* Sidebar */}
			<aside className="flex flex-col flex-shrink-0 w-72 p-4 bg-white dark:bg-stone-800 border-r border-gray-200 dark:border-stone-600">
				<h5 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
					🏠 Rooms
				</h5>

				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Create a new room
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							placeholder="Room name..."
							value={newRoomName}
							onChange={(e) => setNewRoomName(e.target.value)}
							onKeyUp={(e) => e.key === "Enter" && handleCreateRoom()}
							disabled={connectionStatus !== "connected"}
						/>
						<button
							className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
							onClick={handleCreateRoom}
							disabled={
								connectionStatus !== "connected" || !newRoomName.trim()
							}>
							➕
						</button>
					</div>
				</div>

				<hr className="border-gray-200 dark:border-stone-600 mb-4" />

				<h6 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
					My Rooms
				</h6>
				<ul className="mb-4 space-y-1 max-h-48 overflow-y-auto">
					{joinedRooms && joinedRooms.length > 0 ? (
						joinedRooms.map((room) => {
							const notificationCount = roomNotifications.get(room) || 0;
							return (
								<li key={room}>
									<button
										onClick={() => {
											if (onRoomSelect) onRoomSelect(room);
											if (onClearRoomNotifications)
												onClearRoomNotifications(room);
										}}
										className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
											currentRoom === room
												? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
												: "hover:bg-gray-100 dark:hover:bg-stone-700 text-gray-700 dark:text-gray-300"
										}`}>
										<span className="flex items-center">
											💬 {room}
											{notificationCount > 0 && (
												<span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
													{notificationCount}
												</span>
											)}
										</span>
										{currentRoom === room && currentRoomUserCount > 0 && (
											<span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
												{currentRoomUserCount}
											</span>
										)}
									</button>
								</li>
							);
						})
					) : (
						<span className="text-sm text-gray-500 dark:text-gray-400 italic px-2">
							No rooms joined yet.
						</span>
					)}
				</ul>

				<hr className="border-gray-200 dark:border-stone-600 mb-4" />

				<h6 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
					Available Rooms
				</h6>
				<ul className="space-y-1 flex-1 max-h-64 overflow-y-auto">
					{availableRooms && availableRooms.length > 0 ? (
						availableRooms
							.filter((room) => !joinedRooms.includes(room))
							.map((room) => (
								<li key={room}>
									<button
										className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-md transition-colors flex items-center"
										onClick={() => handleJoinRoom(room)}
										disabled={connectionStatus !== "connected"}>
										🚪 {room}
									</button>
								</li>
							))
					) : (
						<span className="text-sm text-gray-500 dark:text-gray-400 italic px-2">
							No available rooms.
						</span>
					)}
				</ul>
			</aside>

			{/* Main Chat Area */}
			<main className="flex-1 flex flex-col">
				{currentRoom ? (
					<div className="flex flex-col h-full bg-gray-50 dark:bg-stone-900">
						<header className="p-4 border-b border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-800 flex items-center justify-between">
							<h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Room: {currentRoom}
							</h4>
							{isUserInCurrentRoom && currentRoomUserCount > 0 && (
								<span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
									👥 {currentRoomUserCount} Users
								</span>
							)}
							<div className="ml-auto">
								{!isUserInCurrentRoom ? (
									<button
										className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full font-medium transition-colors"
										onClick={() => handleJoinRoom(currentRoom)}
										disabled={connectionStatus !== "connected"}>
										➡️ Join Room
									</button>
								) : (
									<button
										className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-full font-medium transition-colors"
										onClick={handleLeaveRoom}
										disabled={connectionStatus !== "connected"}>
										⬅️ Leave Room
									</button>
								)}
							</div>
						</header>

						{isUserInCurrentRoom ? (
							<>
								<div className="flex-1 p-4 overflow-y-auto">
									{currentRoomMessages.length === 0 ? (
										<div className="text-center text-gray-500 dark:text-gray-400 mt-8">
											<p className="text-lg">
												<span className="mr-2">💬</span>
												No messages in this room yet. Be the first!
											</p>
										</div>
									) : (
										currentRoomMessages.map((message, index) => {
											const isCurrentUser = message.sender === username;
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
																: "bg-white dark:bg-stone-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-stone-600"
														}`}>
														{!isCurrentUser && (
															<div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
																{message.sender}
															</div>
														)}
														<div className="text-sm">{message.content}</div>
														<div className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-1">
															{new Date(message.timestamp).toLocaleTimeString(
																[],
																{
																	hour: "2-digit",
																	minute: "2-digit"
																}
															)}
														</div>
													</div>
												</div>
											);
										})
									)}
									<div ref={messagesEndRef} />
								</div>
								<footer className="p-4 border-t border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-800">
									<div className="flex space-x-2">
										<input
											type="text"
											value={newMessage}
											onChange={(e) => setNewMessage(e.target.value)}
											onKeyUp={handleKeyPress}
											placeholder={`Send a message in ${currentRoom}...`}
											disabled={connectionStatus !== "connected"}
											className="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
										/>
										<button
											onClick={handleSendMessage}
											disabled={
												connectionStatus !== "connected" || !newMessage.trim()
											}
											className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors">
											📤
										</button>
									</div>
								</footer>
							</>
						) : (
							<div className="flex h-full justify-center items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-stone-900">
								<div className="text-center">
									<div className="text-6xl mb-4">🚪</div>
									<h4 className="text-xl mb-4">
										You're not in this room. Join to start chatting!
									</h4>
									<button
										className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
										onClick={() => handleJoinRoom(currentRoom)}
										disabled={connectionStatus !== "connected"}>
										➡️ Join {currentRoom}
									</button>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex h-full justify-center items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-stone-900">
						<div className="text-center">
							<div className="text-6xl mb-4">🏠</div>
							<h4 className="text-xl">
								Choose a room from the list or create a new one.
							</h4>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default RoomChat;
