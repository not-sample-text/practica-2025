import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import webSocketService from "../services/webSocketService";

/**
 * Simplified chat hook using context and service
 */
export const useChatManager = () => {
	const { state, actions } = useAppContext();

	const addPrivateChat = useCallback(
		(username) => {
			actions.addPrivateChat(username);
		},
		[actions]
	);

	const closeChat = useCallback(
		(chatname) => {
			actions.closeChat(chatname);
		},
		[actions]
	);

	const sendBroadcastMessage = useCallback((content) => {
		return webSocketService.sendBroadcastMessage(content);
	}, []);

	const sendPrivateMessage = useCallback((username, content) => {
		return webSocketService.sendPrivateMessage(username, content);
	}, []);

	// Helper function to get unread count for specific chat
	const getUnreadCount = useCallback(
		(type, identifier) => {
			const { unreadCounts } = state;
			if (!unreadCounts) return 0;

			switch (type) {
				case "global":
					return unreadCounts.global || 0;
				case "room":
					return unreadCounts.rooms?.[identifier] || 0;
				case "private":
					return unreadCounts.private?.[identifier] || 0;
				default:
					return 0;
			}
		},
		[state.unreadCounts]
	);

	// Helper function to get room notifications count
	const getRoomNotifications = useCallback(
		(roomName) => {
			return getUnreadCount("room", roomName);
		},
		[getUnreadCount]
	);

	// Helper function to clear room notifications
	const clearRoomNotifications = useCallback((roomName) => {
		webSocketService.markChatAsRead("room", roomName);
	}, []);

	return {
		// State
		activeChats: state.activeChats,
		activeChat: state.activeChat,
		unreadCounts: state.unreadCounts,

		// Actions
		addPrivateChat,
		closeChat,
		sendBroadcastMessage,
		sendPrivateMessage,

		// Helpers
		getUnreadCount,
		getRoomNotifications,
		clearRoomNotifications
	};
};
