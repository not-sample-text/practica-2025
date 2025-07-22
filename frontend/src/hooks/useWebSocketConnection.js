import { useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import webSocketService from "../services/webSocketService";

/**
 * Simplified WebSocket hook that uses context and service
 */
export const useWebSocketConnection = () => {
	const { state, actions, user } = useAppContext();

	// Connect to WebSocket when user is available
	useEffect(() => {
		if (user?.username && state.connectionStatus === "disconnected") {
			actions.setConnectionStatus("connecting");
			webSocketService
				.connect(user.username, { ...actions, user })
				.catch((error) => {
					console.error("Failed to connect to WebSocket:", error);
					actions.setError("Failed to connect to chat server");
				});
		}

		// Cleanup on unmount
		return () => {
			if (user?.username) {
				webSocketService.disconnect();
			}
		};
	}, [user?.username]);

	// Reconnect function
	const reconnect = useCallback(() => {
		if (user?.username) {
			actions.clearError();
			actions.setConnectionStatus("connecting");
			webSocketService
				.connect(user.username, { ...actions, user })
				.catch((error) => {
					console.error("Failed to reconnect to WebSocket:", error);
					actions.setError("Failed to reconnect to chat server");
				});
		}
	}, [user?.username, actions]);

	// Message sending functions
	const sendMessage = useCallback((messageData) => {
		return webSocketService.sendMessage(messageData);
	}, []);

	const requestHistoricalMessages = useCallback((chatType, identifier) => {
		return webSocketService.requestHistoricalMessages(chatType, identifier);
	}, []);

	const markChatAsRead = useCallback((chatType, identifier) => {
		webSocketService.markChatAsRead(chatType, identifier);
	}, []);

	const setActiveChat = useCallback(
		(chatType, identifier) => {
			actions.setActiveChat(chatType, identifier);
			webSocketService.setActiveChat(chatType, identifier);
		},
		[actions]
	);

	return {
		// State
		connectionStatus: state.connectionStatus,
		messages: state.messages,
		users: state.users,
		availableRooms: state.availableRooms,
		joinedRooms: state.joinedRooms,
		usersInRooms: state.usersInRooms,
		unreadCounts: state.unreadCounts,
		error: state.error,

		// Actions
		sendMessage,
		requestHistoricalMessages,
		markChatAsRead,
		setActiveChat,
		reconnect,
		clearError: actions.clearError
	};
};
