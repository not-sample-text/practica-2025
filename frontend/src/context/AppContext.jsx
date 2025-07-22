import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

// Action types
const ACTIONS = {
	// WebSocket connection
	SET_CONNECTION_STATUS: "SET_CONNECTION_STATUS",
	SET_WEBSOCKET: "SET_WEBSOCKET",

	// Messages
	ADD_MESSAGE: "ADD_MESSAGE",
	SET_MESSAGES: "SET_MESSAGES",
	ADD_HISTORICAL_MESSAGES: "ADD_HISTORICAL_MESSAGES",

	// Users
	SET_USERS: "SET_USERS",

	// Rooms
	SET_AVAILABLE_ROOMS: "SET_AVAILABLE_ROOMS",
	SET_JOINED_ROOMS: "SET_JOINED_ROOMS",
	SET_ROOM_USER_COUNT: "SET_ROOM_USER_COUNT",
	SET_CURRENT_ROOM: "SET_CURRENT_ROOM",

	// Chat state
	SET_ACTIVE_CHAT: "SET_ACTIVE_CHAT",
	SET_UNREAD_COUNTS: "SET_UNREAD_COUNTS",
	ADD_PRIVATE_CHAT: "ADD_PRIVATE_CHAT",
	CLOSE_CHAT: "CLOSE_CHAT",

	// Game state
	SET_GAME_STATE: "SET_GAME_STATE",
	UPDATE_PLAYER_STATE: "UPDATE_PLAYER_STATE",
	SET_GAME_TIMER: "SET_GAME_TIMER",
	SET_DEALER_HAND: "SET_DEALER_HAND",
	SET_PLAYER_HAND: "SET_PLAYER_HAND",
	SET_GAME_ACTIONS: "SET_GAME_ACTIONS",
	SET_CHIPS: "SET_CHIPS",
	SET_CURRENT_BET: "SET_CURRENT_BET",

	// UI state
	SET_LOADING: "SET_LOADING",
	SET_ERROR: "SET_ERROR",
	CLEAR_ERROR: "CLEAR_ERROR"
};

// Initial state
const initialState = {
	// WebSocket
	connectionStatus: "disconnected",
	websocket: null,

	// Messages
	messages: [],

	// Users
	users: [],

	// Rooms
	availableRooms: [],
	joinedRooms: [],
	usersInRooms: new Map(),
	currentRoom: null,

	// Chat
	activeChat: { type: "global", target: null },
	unreadCounts: { global: 0, rooms: {}, private: {} },
	activeChats: [{ chatname: "broadcast" }],

	// Game state
	gameState: null, // Current game state from backend
	playerStates: {}, // Player states by username
	dealerHand: { cards: [], visible: [], total: 0 },
	playerHands: {}, // Player hands by username
	gameTimer: null, // Current timer state
	availableActions: [], // Available player actions
	chips: 1000, // Player's current chips
	currentBet: 0, // Current round bet

	// UI
	loading: false,
	error: null
};

// Reducer
function appReducer(state, action) {
	switch (action.type) {
		case ACTIONS.SET_CONNECTION_STATUS:
			return { ...state, connectionStatus: action.payload };

		case ACTIONS.SET_WEBSOCKET:
			return { ...state, websocket: action.payload };

		case ACTIONS.ADD_MESSAGE:
			return {
				...state,
				messages: [...state.messages, action.payload]
			};

		case ACTIONS.SET_MESSAGES:
			return { ...state, messages: action.payload };

		case ACTIONS.ADD_HISTORICAL_MESSAGES:
			return {
				...state,
				messages: [
					...state.messages.filter((msg) => {
						const { chatType, identifier } = action.payload;
						if (chatType === "global") {
							return msg.type !== "broadcast";
						} else if (chatType === "room") {
							return !(msg.type === "room_message" && msg.room === identifier);
						} else if (chatType === "private") {
							return !(
								msg.type === "private" &&
								(msg.sender === identifier || msg.chatname === identifier)
							);
						}
						return true;
					}),
					...action.payload.messages
				]
			};

		case ACTIONS.SET_USERS:
			return { ...state, users: action.payload };

		case ACTIONS.SET_AVAILABLE_ROOMS:
			return { ...state, availableRooms: action.payload };

		case ACTIONS.SET_JOINED_ROOMS:
			return { ...state, joinedRooms: action.payload };

		case ACTIONS.SET_ROOM_USER_COUNT:
			return {
				...state,
				usersInRooms: new Map(state.usersInRooms).set(
					action.payload.room,
					action.payload.count
				)
			};

		case ACTIONS.SET_CURRENT_ROOM:
			return { ...state, currentRoom: action.payload };

		case ACTIONS.SET_ACTIVE_CHAT:
			return { ...state, activeChat: action.payload };

		case ACTIONS.SET_UNREAD_COUNTS:
			return { ...state, unreadCounts: action.payload };

		case ACTIONS.ADD_PRIVATE_CHAT:
			const chatExists = state.activeChats.some(
				(chat) => chat.chatname === action.payload
			);
			if (!chatExists) {
				return {
					...state,
					activeChats: [...state.activeChats, { chatname: action.payload }]
				};
			}
			return state;

		case ACTIONS.CLOSE_CHAT:
			if (action.payload !== "broadcast") {
				return {
					...state,
					activeChats: state.activeChats.filter(
						(chat) => chat.chatname !== action.payload
					)
				};
			}
			return state;

		case ACTIONS.SET_GAME_STATE:
			return { ...state, gameState: action.payload };

		case ACTIONS.UPDATE_PLAYER_STATE:
			return {
				...state,
				playerStates: {
					...state.playerStates,
					[action.payload.username]: action.payload.state
				}
			};

		case ACTIONS.SET_GAME_TIMER:
			return { ...state, gameTimer: action.payload };

		case ACTIONS.SET_DEALER_HAND:
			return { ...state, dealerHand: action.payload };

		case ACTIONS.SET_PLAYER_HAND:
			return {
				...state,
				playerHands: {
					...state.playerHands,
					[action.payload.username]: action.payload.hand
				}
			};

		case ACTIONS.SET_GAME_ACTIONS:
			return { ...state, availableActions: action.payload };

		case ACTIONS.SET_CHIPS:
			return { ...state, chips: action.payload };

		case ACTIONS.SET_CURRENT_BET:
			return { ...state, currentBet: action.payload };

		case ACTIONS.SET_LOADING:
			return { ...state, loading: action.payload };

		case ACTIONS.SET_ERROR:
			return { ...state, error: action.payload };

		case ACTIONS.CLEAR_ERROR:
			return { ...state, error: null };

		default:
			return state;
	}
}

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
	const [state, dispatch] = useReducer(appReducer, initialState);
	const { user } = useAuth();

	// Action creators
	const actions = {
		setConnectionStatus: (status) =>
			dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: status }),

		setWebSocket: (websocket) =>
			dispatch({ type: ACTIONS.SET_WEBSOCKET, payload: websocket }),

		addMessage: (message) =>
			dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message }),

		setMessages: (messages) =>
			dispatch({ type: ACTIONS.SET_MESSAGES, payload: messages }),

		addHistoricalMessages: (chatType, identifier, messages) =>
			dispatch({
				type: ACTIONS.ADD_HISTORICAL_MESSAGES,
				payload: { chatType, identifier, messages }
			}),

		setUsers: (users) => dispatch({ type: ACTIONS.SET_USERS, payload: users }),

		setAvailableRooms: (rooms) =>
			dispatch({ type: ACTIONS.SET_AVAILABLE_ROOMS, payload: rooms }),

		setJoinedRooms: (rooms) =>
			dispatch({ type: ACTIONS.SET_JOINED_ROOMS, payload: rooms }),

		setRoomUserCount: (room, count) =>
			dispatch({ type: ACTIONS.SET_ROOM_USER_COUNT, payload: { room, count } }),

		setCurrentRoom: (room) =>
			dispatch({ type: ACTIONS.SET_CURRENT_ROOM, payload: room }),

		setActiveChat: (type, target) =>
			dispatch({ type: ACTIONS.SET_ACTIVE_CHAT, payload: { type, target } }),

		setUnreadCounts: (counts) =>
			dispatch({ type: ACTIONS.SET_UNREAD_COUNTS, payload: counts }),

		addPrivateChat: (username) =>
			dispatch({ type: ACTIONS.ADD_PRIVATE_CHAT, payload: username }),

		closeChat: (chatname) =>
			dispatch({ type: ACTIONS.CLOSE_CHAT, payload: chatname }),

		// Game actions
		setGameState: (gameState) =>
			dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState }),

		updatePlayerState: (username, state) =>
			dispatch({
				type: ACTIONS.UPDATE_PLAYER_STATE,
				payload: { username, state }
			}),

		setGameTimer: (timer) =>
			dispatch({ type: ACTIONS.SET_GAME_TIMER, payload: timer }),

		setDealerHand: (hand) =>
			dispatch({ type: ACTIONS.SET_DEALER_HAND, payload: hand }),

		setPlayerHand: (username, hand) =>
			dispatch({ type: ACTIONS.SET_PLAYER_HAND, payload: { username, hand } }),

		setGameActions: (actions) =>
			dispatch({ type: ACTIONS.SET_GAME_ACTIONS, payload: actions }),

		setChips: (chips) => dispatch({ type: ACTIONS.SET_CHIPS, payload: chips }),

		setCurrentBet: (bet) =>
			dispatch({ type: ACTIONS.SET_CURRENT_BET, payload: bet }),

		setLoading: (loading) =>
			dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),

		setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),

		clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR })
	};

	return (
		<AppContext.Provider value={{ state, actions, user }}>
			{children}
		</AppContext.Provider>
	);
};

// Custom hook to use the context
export const useAppContext = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useAppContext must be used within AppProvider");
	}
	return context;
};

export { ACTIONS };
