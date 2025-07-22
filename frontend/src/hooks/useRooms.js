import { useState, useCallback } from "react";

/**
 * Custom hook for managing room functionality
 */
export const useRooms = (sendMessage) => {
	const [currentRoom, setCurrentRoom] = useState(null);

	const joinRoom = useCallback(
		(roomName) => {
			if (roomName && sendMessage) {
				sendMessage({
					type: "join_room",
					room: roomName
				});
				setCurrentRoom(roomName);
			}
		},
		[sendMessage]
	);

	const leaveRoom = useCallback(
		(roomName) => {
			if (roomName && sendMessage) {
				sendMessage({
					type: "leave_room",
					room: roomName
				});
				if (currentRoom === roomName) {
					setCurrentRoom(null);
				}
			}
		},
		[sendMessage, currentRoom]
	);

	const createRoom = useCallback(
		(roomName) => {
			if (roomName && sendMessage) {
				sendMessage({
					type: "create_room",
					room: roomName
				});
			}
		},
		[sendMessage]
	);

	const selectRoom = useCallback(
		(roomName) => {
			setCurrentRoom(roomName);
			// Also join the room on the backend when selecting it
			if (roomName && sendMessage) {
				sendMessage({
					type: "join_room",
					room: roomName
				});
			}
		},
		[sendMessage]
	);

	return {
		currentRoom,
		joinRoom,
		leaveRoom,
		createRoom,
		selectRoom
	};
};
