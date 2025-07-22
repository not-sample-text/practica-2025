import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing WebSocket connections and chat functionality
 */
export const useWebSocket = (username) => {
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [messages, setMessages] = useState([]);
	const [users, setUsers] = useState([]);
	const [availableRooms, setAvailableRooms] = useState([]);
	const [joinedRooms, setJoinedRooms] = useState([]);
	const [usersInRooms, setUsersInRooms] = useState(new Map());
	const [unreadCounts, setUnreadCounts] = useState({
		global: 0,
		rooms: {},
		private: {}
	});
	const websocketRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);

	const connectWebSocket = useCallback(() => {
		// Clear any existing reconnect timeout
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Close existing connection
		if (websocketRef.current) {
			websocketRef.current.close();
		}

		const wsUrl = "ws://localhost:3000/ws";
		console.log("Connecting to WebSocket at:", wsUrl);

		try {
			websocketRef.current = new WebSocket(wsUrl);

			websocketRef.current.onopen = () => {
				console.log("WebSocket connected");
				setConnectionStatus("connected");
			};

			websocketRef.current.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					const {
						username: messageUsername,
						type,
						content,
						sender,
						room,
						text,
						count
					} = data;

					switch (type) {
						case "historical_messages":
							// Replace existing messages for this chat type with historical data
							setMessages((prev) => {
								// Filter out messages from this chat type/identifier
								const filteredMessages = prev.filter((msg) => {
									if (data.chatType === "global") {
										return msg.type !== "broadcast";
									} else if (data.chatType === "room") {
										return !(
											msg.type === "room_message" &&
											msg.room === data.identifier
										);
									} else if (data.chatType === "private") {
										return !(
											msg.type === "private" &&
											(msg.sender === data.identifier ||
												msg.chatname === data.identifier)
										);
									}
									return true;
								});

								// Add historical messages
								return [...filteredMessages, ...data.messages];
							});
							break;
						case "private":
							setMessages((prev) => [
								...prev,
								{
									content,
									username: messageUsername,
									type: "private",
									sender: username,
									timestamp: new Date().toISOString()
								}
							]);
							break;
						case "broadcast":
							setMessages((prev) => [
								...prev,
								{
									content,
									username: messageUsername,
									type: "broadcast",
									timestamp: new Date().toISOString()
								}
							]);
							break;
						case "usernames":
							setUsers(content.filter((user) => user !== username));
							break;
						case "room_message":
							setMessages((prev) => [
								...prev,
								{
									type: "room_message",
									room,
									sender,
									content: text,
									timestamp: data.timestamp || new Date().toISOString()
								}
							]);
							break;
						case "available_rooms":
							setAvailableRooms(content || []);
							break;
						case "joined_rooms":
							setJoinedRooms(content || []);
							break;
						case "room_user_count":
							setUsersInRooms((prev) => {
								const newMap = new Map(prev);
								newMap.set(room, count);
								return newMap;
							});
							break;
						case "unread_counts":
							setUnreadCounts(
								data.counts || {
									global: 0,
									rooms: {},
									private: {}
								}
							);
							break;
						case "error":
							console.error("WebSocket error:", data.message);
							break;
						default:
							console.warn("Unknown message type:", data);
							break;
					}
				} catch (e) {
					console.error("Error parsing WebSocket message:", e);
				}
			};

			websocketRef.current.onclose = (event) => {
				console.log("WebSocket disconnected", event);
				setConnectionStatus("disconnected");

				// Auto-reconnect after 3 seconds if not intentionally closed
				if (!event.wasClean && username) {
					reconnectTimeoutRef.current = setTimeout(() => {
						console.log("Attempting to reconnect...");
						connectWebSocket();
					}, 3000);
				}
			};

			websocketRef.current.onerror = (error) => {
				console.error("WebSocket error:", error);
				setConnectionStatus("error");
			};
		} catch (error) {
			console.error("Failed to create WebSocket connection:", error);
			setConnectionStatus("error");
		}
	}, [username]);

	const disconnectWebSocket = useCallback(() => {
		// Clear reconnect timeout
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (websocketRef.current) {
			websocketRef.current.close();
			websocketRef.current = null;
		}
		setConnectionStatus("disconnected");
	}, []);

	const sendMessage = useCallback((messageData) => {
		if (
			websocketRef.current &&
			websocketRef.current.readyState === WebSocket.OPEN
		) {
			try {
				websocketRef.current.send(JSON.stringify(messageData));
			} catch (error) {
				console.error("Error sending message:", error);
			}
		} else {
			console.warn(
				"WebSocket is not connected. Message not sent:",
				messageData
			);
		}
	}, []);

	const requestHistoricalMessages = useCallback((chatType, identifier) => {
		if (
			websocketRef.current &&
			websocketRef.current.readyState === WebSocket.OPEN
		) {
			try {
				websocketRef.current.send(
					JSON.stringify({
						type: "get_messages",
						chatType,
						identifier
					})
				);
			} catch (error) {
				console.error("Error requesting historical messages:", error);
			}
		}
	}, []);

	const markChatAsRead = useCallback((chatType, identifier) => {
		if (
			websocketRef.current &&
			websocketRef.current.readyState === WebSocket.OPEN
		) {
			try {
				websocketRef.current.send(
					JSON.stringify({
						type: "mark_chat_read",
						chatType,
						identifier
					})
				);
			} catch (error) {
				console.error("Error marking chat as read:", error);
			}
		}
	}, []);

	const setActiveChat = useCallback((chatType, identifier) => {
		if (
			websocketRef.current &&
			websocketRef.current.readyState === WebSocket.OPEN
		) {
			try {
				websocketRef.current.send(
					JSON.stringify({
						type: "set_active_chat",
						chatType,
						identifier
					})
				);
			} catch (error) {
				console.error("Error setting active chat:", error);
			}
		}
	}, []);

	useEffect(() => {
		if (username) {
			connectWebSocket();
		}

		return () => {
			disconnectWebSocket();
		};
	}, [username, connectWebSocket, disconnectWebSocket]);

	return {
		connectionStatus,
		messages,
		users,
		availableRooms,
		joinedRooms,
		usersInRooms,
		unreadCounts,
		sendMessage,
		requestHistoricalMessages,
		markChatAsRead,
		setActiveChat,
		connectWebSocket,
		disconnectWebSocket
	};
};
