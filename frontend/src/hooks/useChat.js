import { useState, useCallback } from "react";

/**
 * Custom hook for managing chat state and interactions
 */
export const useChat = () => {
	const [activeChats, setActiveChats] = useState([{ chatname: "broadcast" }]);
	const [newMessages, setNewMessages] = useState([]);

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

	return {
		activeChats,
		newMessages,
		addPrivateChat,
		closeChat,
		markMessageAsRead,
		addNewMessage
	};
};
