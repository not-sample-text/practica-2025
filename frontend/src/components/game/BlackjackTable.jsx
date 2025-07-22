import React from "react";
import { useAppContext } from "../../context/AppContext";
import DealerHand from "./DealerHand";
import PlayerHand from "./PlayerHand";
import BettingInterface from "./BettingInterface";
import PlayerActions from "./PlayerActions";
import GameTimer from "./GameTimer";
import GameControls from "./GameControls";
import SpectatorView from "./SpectatorView";

const BlackjackTable = () => {
	const { state, user } = useAppContext();
	const {
		gameState,
		playerStates,
		dealerHand,
		playerHands,
		gameTimer,
		availableActions,
		chips,
		currentBet,
		currentRoom
	} = state;

	// Check if current user is a player or spectator
	const isPlayer = playerStates[user?.username]?.role === "player";
	const isSpectator = !isPlayer;
	const currentPlayerState = playerStates[user?.username];

	// Get all players for display
	const players = Object.entries(playerStates)
		.filter(([_, state]) => state.role === "player")
		.map(([username, state]) => ({ username, ...state }));

	// Check if it's the current user's turn
	const isCurrentPlayerTurn = gameState?.currentPlayer === user?.username;

	if (!gameState) {
		return (
			<div className="min-h-screen bg-green-800 p-4">
				<div className="max-w-6xl mx-auto">
					<div className="bg-green-700 rounded-lg p-6 text-center">
						<h2 className="text-2xl font-bold text-white mb-4">
							Blackjack Room: {currentRoom}
						</h2>
						<p className="text-green-200 mb-6">Waiting for game to start...</p>
						<GameControls />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-green-800 p-4">
			<div className="max-w-6xl mx-auto">
				{/* Game Header */}
				<div className="text-center mb-6">
					<h1 className="text-3xl font-bold text-white mb-2">
						Blackjack - {currentRoom}
					</h1>
					<div className="flex justify-center items-center space-x-6 text-white">
						<span className="text-lg">State: {gameState.state}</span>
						<span className="text-lg">Round: {gameState.roundNumber || 1}</span>
						{gameTimer && <GameTimer />}
					</div>
				</div>

				{/* Spectator View */}
				{isSpectator && <SpectatorView />}

				{/* Dealer Section */}
				<div className="mb-8">
					<DealerHand
						hand={dealerHand}
						gameState={gameState.state}
					/>
				</div>

				{/* Players Section */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
					{players.map((player) => (
						<PlayerHand
							key={player.username}
							player={player}
							hand={playerHands[player.username]}
							isCurrentPlayer={player.username === user?.username}
							isActivePlayer={gameState.currentPlayer === player.username}
							gameState={gameState.state}
						/>
					))}
				</div>

				{/* Current Player Controls */}
				{isPlayer && (
					<div className="bg-green-700 rounded-lg p-6">
						<div className="flex justify-between items-center mb-4">
							<div className="text-white">
								<span className="text-lg font-semibold">
									Your Chips: {chips}
								</span>
								{currentBet > 0 && (
									<span className="ml-4 text-yellow-300">
										Current Bet: {currentBet}
									</span>
								)}
							</div>
							<div className="text-white">
								Status: {currentPlayerState?.state || "waiting"}
							</div>
						</div>

						{/* Betting Interface */}
						{gameState.state === "betting" &&
							currentPlayerState?.state === "betting" && <BettingInterface />}

						{/* Player Actions */}
						{isCurrentPlayerTurn && availableActions.length > 0 && (
							<PlayerActions actions={availableActions} />
						)}

						{/* Game Controls */}
						{(gameState.state === "waiting" ||
							gameState.state === "round_complete") && <GameControls />}
					</div>
				)}

				{/* Game Info Bar */}
				<div className="mt-6 bg-green-600 rounded-lg p-4">
					<div className="flex justify-between items-center text-white text-sm">
						<div>Players: {players.length}/8</div>
						<div>Minimum Bet: 10 chips</div>
						<div>
							Deck Cards Remaining: {gameState.cardsRemaining || "Unknown"}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BlackjackTable;
