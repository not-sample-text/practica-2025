import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import webSocketService from "../services/webSocketService";

/**
 * Simplified rooms hook using context and service
 */
export const useRoomsManager = () => {
	const { state, actions } = useAppContext();

	const joinRoom = useCallback(
		(roomName) => {
			if (roomName && webSocketService.joinRoom(roomName)) {
				actions.setCurrentRoom(roomName);
			}
		},
		[actions]
	);

	const leaveRoom = useCallback(
		(roomName) => {
			if (roomName && webSocketService.leaveRoom(roomName)) {
				if (state.currentRoom === roomName) {
					actions.setCurrentRoom(null);
				}
			}
		},
		[state.currentRoom, actions]
	);

	const createRoom = useCallback((roomName) => {
		if (roomName) {
			webSocketService.createRoom(roomName);
		}
	}, []);

	const selectRoom = useCallback(
		(roomName) => {
			actions.setCurrentRoom(roomName);
		},
		[actions]
	);

	const sendRoomMessage = useCallback((roomName, content) => {
		return webSocketService.sendRoomMessage(roomName, content);
	}, []);

	return {
		// State
		currentRoom: state.currentRoom,
		availableRooms: state.availableRooms,
		joinedRooms: state.joinedRooms,
		usersInRooms: state.usersInRooms,

		// Actions
		joinRoom,
		leaveRoom,
		createRoom,
		selectRoom,
		sendRoomMessage
	};
};
