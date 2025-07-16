import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing WebSocket connections and chat functionality
 */
export const useWebSocket = (username) => {
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [messages, setMessages] = useState([]);
	const [users, setUsers] = useState([]);
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
					const {
						username: messageUsername,
						type,
						content
					} = JSON.parse(event.data);

					switch (type) {
						case "private":
							setMessages((prev) => [
								...prev,
								{
									content,
									username: messageUsername,
									type: "private",
									sender: username,
									timestamp: Date.now()
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
									timestamp: Date.now()
								}
							]);
							break;
						case "usernames":
							setUsers(content.filter((user) => user !== username));
							break;
						default:
							console.warn("Unknown message type:", {
								username: messageUsername,
								type,
								content
							});
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
		sendMessage,
		connectWebSocket,
		disconnectWebSocket
	};
};
