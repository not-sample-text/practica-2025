import { useState, useCallback } from "react";

/**
 * Custom hook for managing chat state and interactions
 */
export const useChat = () => {
	const [activeChats, setActiveChats] = useState([{ chatname: "broadcast" }]);
	const [newMessages, setNewMessages] = useState([]);
	const [roomNotifications, setRoomNotifications] = useState(new Map());

	const addPrivateChat = useCallback(
		(username) => {
			const chatExists = activeChats.some((chat) => chat.chatname === username);
			if (!chatExists) {
				setActiveChats((prev) => [...prev, { chatname: username }]);
			}
		},
		[activeChats]
	);

	const closeChat = useCallback((chatname) => {
		if (chatname !== "broadcast") {
			setActiveChats((prev) =>
				prev.filter((chat) => chat.chatname !== chatname)
			);
		}
	}, []);

	const markMessageAsRead = useCallback((username) => {
		setNewMessages((prev) => prev.filter((u) => u !== username));
	}, []);

	const addNewMessage = useCallback((username) => {
		setNewMessages((prev) => [...prev.filter((u) => u !== username), username]);
	}, []);

	const addRoomNotification = useCallback((roomName) => {
		setRoomNotifications((prev) => {
			const newMap = new Map(prev);
			const currentCount = newMap.get(roomName) || 0;
			newMap.set(roomName, currentCount + 1);
			return newMap;
		});
	}, []);

	const clearRoomNotifications = useCallback((roomName) => {
		setRoomNotifications((prev) => {
			const newMap = new Map(prev);
			newMap.delete(roomName);
			return newMap;
		});
	}, []);

	return {
		activeChats,
		newMessages,
		roomNotifications,
		addPrivateChat,
		closeChat,
		markMessageAsRead,
		addNewMessage,
		addRoomNotification,
		clearRoomNotifications
	};
};
