import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";

export const useBlackjack = () => {
	const { state, actions } = useAppContext();
	const {
		gameState,
		playerStates,
		dealerHand,
		playerHands,
		gameTimer,
		availableActions,
		chips,
		currentBet,
		websocket
	} = state;

	// Helper function to send game messages
	const sendGameMessage = useCallback(
		(type, data = {}) => {
			if (websocket && websocket.readyState === WebSocket.OPEN) {
				const message = { type, ...data };
				websocket.send(JSON.stringify(message));
				return true;
			}
			actions.setError("Connection lost. Please try again.");
			return false;
		},
		[websocket, actions]
	);

	// Game actions
	const gameActions = {
		// Room management
		createGameRoom: useCallback(
			(roomName, maxPlayers = 8) => {
				return sendGameMessage("create_game_room", { roomName, maxPlayers });
			},
			[sendGameMessage]
		),

		startGame: useCallback(() => {
			return sendGameMessage("start_game");
		}, [sendGameMessage]),

		// Betting actions
		placeBet: useCallback(
			(amount) => {
				if (amount < 10) {
					actions.setError("Minimum bet is 10 chips");
					return false;
				}
				if (amount > chips) {
					actions.setError("Not enough chips");
					return false;
				}
				return sendGameMessage("place_bet", { amount });
			},
			[sendGameMessage, chips, actions]
		),

		// Player actions
		hit: useCallback(() => {
			return sendGameMessage("player_action", { action: "hit" });
		}, [sendGameMessage]),

		stand: useCallback(() => {
			return sendGameMessage("player_action", { action: "stand" });
		}, [sendGameMessage]),

		double: useCallback(() => {
			return sendGameMessage("player_action", { action: "double" });
		}, [sendGameMessage]),

		split: useCallback(() => {
			return sendGameMessage("player_action", { action: "split" });
		}, [sendGameMessage]),

		insurance: useCallback(() => {
			return sendGameMessage("player_action", { action: "insurance" });
		}, [sendGameMessage]),

		// Chip management
		addChips: useCallback(
			(amount = 1000) => {
				return sendGameMessage("add_chips", { amount });
			},
			[sendGameMessage]
		),

		// Spectator actions
		joinAsPlayer: useCallback(() => {
			return sendGameMessage("join_as_player");
		}, [sendGameMessage]),

		joinAsSpectator: useCallback(() => {
			return sendGameMessage("join_as_spectator");
		}, [sendGameMessage])
	};

	// Game state helpers
	const gameHelpers = {
		// Check if current user is in the game
		isPlayer: useCallback(
			(username) => {
				return playerStates[username]?.role === "player";
			},
			[playerStates]
		),

		isSpectator: useCallback(
			(username) => {
				return (
					!playerStates[username] ||
					playerStates[username]?.role === "spectator"
				);
			},
			[playerStates]
		),

		// Check if it's a player's turn
		isPlayerTurn: useCallback(
			(username) => {
				return gameState?.currentPlayer === username;
			},
			[gameState]
		),

		// Get player state
		getPlayerState: useCallback(
			(username) => {
				return playerStates[username] || null;
			},
			[playerStates]
		),

		// Get player hand
		getPlayerHand: useCallback(
			(username) => {
				return playerHands[username] || { cards: [], total: 0 };
			},
			[playerHands]
		),

		// Check if player can bet
		canBet: useCallback(
			(username) => {
				const playerState = playerStates[username];
				return (
					gameState?.state === "betting" &&
					playerState?.state === "betting" &&
					chips >= 10
				);
			},
			[gameState, playerStates, chips]
		),

		// Check if player can act
		canAct: useCallback(
			(username) => {
				return (
					gameState?.currentPlayer === username && availableActions.length > 0
				);
			},
			[gameState, availableActions]
		),

		// Get all players
		getAllPlayers: useCallback(() => {
			return Object.entries(playerStates)
				.filter(([_, state]) => state.role === "player")
				.map(([username, state]) => ({ username, ...state }));
		}, [playerStates]),

		// Get game statistics
		getGameStats: useCallback(() => {
			const players = gameHelpers.getAllPlayers();
			return {
				playerCount: players.length,
				maxPlayers: 8,
				roundNumber: gameState?.roundNumber || 1,
				state: gameState?.state || "waiting",
				cardsRemaining: gameState?.cardsRemaining || 0
			};
		}, [gameState, gameHelpers]),

		// Check if game is active
		isGameActive: useCallback(() => {
			return (
				gameState &&
				["betting", "dealing", "playing", "dealer_turn"].includes(
					gameState.state
				)
			);
		}, [gameState]),

		// Check if round is complete
		isRoundComplete: useCallback(() => {
			return gameState?.state === "round_complete";
		}, [gameState]),

		// Calculate hand value (for display purposes)
		calculateHandValue: useCallback((cards) => {
			if (!cards || cards.length === 0) return 0;

			let total = 0;
			let aces = 0;

			for (const card of cards) {
				if (card.value === "ACE") {
					aces++;
					total += 11;
				} else if (["KING", "QUEEN", "JACK"].includes(card.value)) {
					total += 10;
				} else {
					total += parseInt(card.value);
				}
			}

			// Adjust for aces
			while (total > 21 && aces > 0) {
				total -= 10;
				aces--;
			}

			return total;
		}, []),

		// Check for blackjack
		isBlackjack: useCallback((cards, total) => {
			return cards.length === 2 && total === 21;
		}, []),

		// Check for bust
		isBusted: useCallback((total) => {
			return total > 21;
		}, [])
	};

	// Process game events (called from WebSocket handler)
	const processGameEvent = useCallback(
		(event) => {
			switch (event.type) {
				case "game_state_update":
					actions.setGameState(event.gameState);
					break;

				case "player_state_update":
					actions.updatePlayerState(event.username, event.playerState);
					break;

				case "hand_update":
					if (event.hand.type === "dealer") {
						actions.setDealerHand(event.hand);
					} else {
						actions.setPlayerHand(event.username, event.hand);
					}
					break;

				case "timer_update":
					actions.setGameTimer(event.timer);
					break;

				case "actions_available":
					actions.setGameActions(event.actions);
					break;

				case "chips_update":
					actions.setChips(event.chips);
					break;

				case "bet_update":
					actions.setCurrentBet(event.bet);
					break;

				default:
					console.log("Unknown game event:", event);
			}
		},
		[actions]
	);

	return {
		// Game state
		gameState,
		playerStates,
		dealerHand,
		playerHands,
		gameTimer,
		availableActions,
		chips,
		currentBet,

		// Actions
		...gameActions,

		// Helpers
		...gameHelpers,

		// Event processing
		processGameEvent
	};
};

export default useBlackjack;
