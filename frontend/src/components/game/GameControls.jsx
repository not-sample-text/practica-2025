import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Button from "../ui/Button";

const GameControls = ({ variant = "game" }) => {
	const { state, actions, user } = useAppContext();
	const { websocket, gameState, currentRoom, chips } = state;
	const [isCreatingRoom, setIsCreatingRoom] = useState(false);

	// Send game command to server
	const sendGameCommand = (command, data = {}) => {
		const message = {
			type: command,
			...data
		};

		if (websocket && websocket.readyState === WebSocket.OPEN) {
			websocket.send(JSON.stringify(message));
		} else {
			actions.setError("Connection lost. Please try again.");
		}
	};

	// Handle starting a new game
	const handleStartGame = () => {
		sendGameCommand("start_game");
	};

	// Handle creating a new game room
	const handleCreateGameRoom = () => {
		setIsCreatingRoom(true);
		sendGameCommand("create_game_room", {
			roomName: `${user.username}'s Blackjack`,
			maxPlayers: 8
		});

		// Reset creating state after a delay
		setTimeout(() => setIsCreatingRoom(false), 2000);
	};

	// Handle adding chips (refill)
	const handleAddChips = () => {
		sendGameCommand("add_chips", { amount: 1000 });
	};

	// Handle leaving game room
	const handleLeaveRoom = () => {
		if (currentRoom) {
			sendGameCommand("leave_room", { room: currentRoom });
		}
	};

	// Handle joining as spectator
	const handleJoinAsSpectator = () => {
		// This would typically be handled by the room joining logic
		// For now, just send a message to indicate spectator intent
		sendGameCommand("join_as_spectator");
	};

	// Check if user can start game (room owner/admin)
	const canStartGame = () => {
		// This would need to be determined by backend state
		// For now, assume any player can start if game is in waiting state
		return (
			gameState?.state === "waiting" || gameState?.state === "round_complete"
		);
	};

	// Check if user needs chips
	const needsChips = chips < 10;

	// Get styling based on variant
	const getContainerClass = () => {
		if (variant === "dashboard") {
			return "space-y-4";
		}
		return "space-y-4";
	};

	const getTextClass = (type = "primary") => {
		if (variant === "dashboard") {
			switch (type) {
				case "primary":
					return "text-gray-900 dark:text-gray-100";
				case "secondary":
					return "text-gray-600 dark:text-gray-300";
				case "accent":
					return "text-blue-600 dark:text-blue-400";
				default:
					return "text-gray-900 dark:text-gray-100";
			}
		}
		// Game variant (default)
		switch (type) {
			case "primary":
				return "text-white";
			case "secondary":
				return "text-green-200";
			case "accent":
				return "text-yellow-300";
			default:
				return "text-white";
		}
	};

	return (
		<div className={getContainerClass()}>
			{/* No Game State - Show Room Creation */}
			{!gameState && (
				<div className="text-center space-y-4">
					<Button
						onClick={handleCreateGameRoom}
						disabled={isCreatingRoom}
						variant="primary"
						size="lg">
						{isCreatingRoom ? "Creating Room..." : "Create Blackjack Room"}
					</Button>
					<p className={`text-sm ${getTextClass("secondary")}`}>
						Create a new blackjack room to start playing
					</p>
				</div>
			)}

			{/* Game Waiting State */}
			{gameState?.state === "waiting" && (
				<div className="text-center space-y-4">
					<div className={getTextClass("primary") + " mb-4"}>
						<h3 className="text-xl font-semibold mb-2">Ready to Play?</h3>
						<p className={getTextClass("secondary")}>
							Waiting for players to join. Minimum 1 player needed to start.
						</p>
					</div>

					{canStartGame() && (
						<Button
							onClick={handleStartGame}
							variant="primary"
							size="lg">
							Start Game
						</Button>
					)}

					{needsChips && (
						<Button
							onClick={handleAddChips}
							variant="warning"
							size="md">
							Add 1000 Chips (Free Refill)
						</Button>
					)}
				</div>
			)}

			{/* Round Complete State */}
			{gameState?.state === "round_complete" && (
				<div className="text-center space-y-4">
					<div className="text-white mb-4">
						<h3 className="text-xl font-semibold mb-2">Round Complete!</h3>
						<p className="text-green-200">Ready for the next round?</p>
					</div>

					{canStartGame() && (
						<Button
							onClick={handleStartGame}
							variant="primary"
							size="lg">
							Start Next Round
						</Button>
					)}

					{needsChips && (
						<Button
							onClick={handleAddChips}
							variant="warning"
							size="md">
							Add 1000 Chips (Free Refill)
						</Button>
					)}
				</div>
			)}

			{/* Spectator Controls */}
			{gameState && !gameState.players?.[user?.username] && (
				<div className="text-center space-y-4">
					<div className="text-white mb-4">
						<h3 className="text-lg font-semibold mb-2">Spectating</h3>
						<p className="text-green-200 text-sm">
							You're watching this game. Join the next round to play!
						</p>
					</div>

					<Button
						onClick={handleJoinAsSpectator}
						variant="secondary"
						size="md">
						Request to Join Next Round
					</Button>
				</div>
			)}

			{/* General Controls */}
			<div className="flex justify-center space-x-3">
				{/* Chip Refill Button */}
				{needsChips && gameState && (
					<Button
						onClick={handleAddChips}
						variant="warning"
						size="sm">
						🪙 Get Chips
					</Button>
				)}

				{/* Leave Room Button */}
				{currentRoom && (
					<Button
						onClick={handleLeaveRoom}
						variant="outline"
						size="sm">
						Leave Room
					</Button>
				)}
			</div>

			{/* Game Rules Summary */}
			<div className="text-xs text-green-200 text-center space-y-1 border-t border-green-600 pt-3">
				<p>
					<strong>Quick Rules:</strong>
				</p>
				<p>• Get closer to 21 than dealer without going over</p>
				<p>• Face cards = 10, Aces = 1 or 11</p>
				<p>• Blackjack (21 with 2 cards) pays 3:2</p>
				<p>• Minimum bet: 10 chips</p>
			</div>
		</div>
	);
};

export default GameControls;
