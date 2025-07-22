import React from "react";
import { useAppContext } from "../../context/AppContext";
import Button from "../ui/Button";

const SpectatorView = () => {
	const { state, actions } = useAppContext();
	const { gameState, websocket } = state;

	// Send spectator command to server
	const sendSpectatorCommand = (command, data = {}) => {
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

	// Handle joining as player
	const handleJoinAsPlayer = () => {
		sendSpectatorCommand("join_as_player");
	};

	// Handle requesting to join next round
	const handleJoinNextRound = () => {
		sendSpectatorCommand("request_join_next_round");
	};

	// Get current game statistics
	const getGameStats = () => {
		if (!gameState) return null;

		const playerCount = Object.keys(gameState.players || {}).length;
		const maxPlayers = 8;
		const roundNumber = gameState.roundNumber || 1;

		return { playerCount, maxPlayers, roundNumber };
	};

	const stats = getGameStats();

	return (
		<div className="mb-6">
			<div className="bg-purple-700 rounded-lg p-4 border-2 border-purple-500">
				{/* Spectator Header */}
				<div className="text-center mb-4">
					<h2 className="text-xl font-bold text-white mb-2">
						👀 Spectator Mode
					</h2>
					<p className="text-purple-200 text-sm">
						You're watching this blackjack game. You can join when there's an
						open spot!
					</p>
				</div>

				{/* Game Information */}
				{stats && (
					<div className="grid grid-cols-3 gap-4 mb-4 text-center text-white">
						<div>
							<div className="text-2xl font-bold">{stats.playerCount}</div>
							<div className="text-sm text-purple-200">Players</div>
						</div>
						<div>
							<div className="text-2xl font-bold">
								{stats.maxPlayers - stats.playerCount}
							</div>
							<div className="text-sm text-purple-200">Open Spots</div>
						</div>
						<div>
							<div className="text-2xl font-bold">{stats.roundNumber}</div>
							<div className="text-sm text-purple-200">Round</div>
						</div>
					</div>
				)}

				{/* Join Controls */}
				<div className="space-y-3">
					{/* Join Immediately (if space available) */}
					{stats && stats.playerCount < stats.maxPlayers && (
						<div className="text-center">
							{gameState?.state === "waiting" ||
							gameState?.state === "round_complete" ? (
								<div>
									<Button
										onClick={handleJoinAsPlayer}
										variant="primary"
										size="lg"
										className="w-full mb-2">
										Join Game Now
									</Button>
									<p className="text-purple-200 text-xs">
										Join this round and start playing immediately
									</p>
								</div>
							) : (
								<div>
									<Button
										onClick={handleJoinNextRound}
										variant="secondary"
										size="lg"
										className="w-full mb-2">
										Join Next Round
									</Button>
									<p className="text-purple-200 text-xs">
										Game in progress. You'll join when this round ends.
									</p>
								</div>
							)}
						</div>
					)}

					{/* Game Full */}
					{stats && stats.playerCount >= stats.maxPlayers && (
						<div className="text-center">
							<div className="bg-purple-800 rounded-lg p-3 mb-3">
								<p className="text-white font-semibold">Game Full</p>
								<p className="text-purple-200 text-sm">
									All 8 player spots are taken
								</p>
							</div>
							<Button
								onClick={handleJoinNextRound}
								variant="outline"
								size="md"
								className="w-full">
								Join Waiting List
							</Button>
							<p className="text-purple-200 text-xs mt-2">
								You'll be notified when a spot opens up
							</p>
						</div>
					)}
				</div>

				{/* Spectator Features */}
				<div className="mt-4 pt-4 border-t border-purple-600">
					<h4 className="text-white font-semibold mb-2">Spectator Features</h4>
					<ul className="text-purple-200 text-sm space-y-1">
						<li>• Watch live gameplay and chat with other viewers</li>
						<li>• See all player hands and game statistics</li>
						<li>• Learn strategies by watching experienced players</li>
						<li>• Join the game when a spot becomes available</li>
					</ul>
				</div>

				{/* Current Game State Info */}
				{gameState && (
					<div className="mt-3 pt-3 border-t border-purple-600">
						<div className="text-center text-purple-200 text-sm">
							Current State:{" "}
							<span className="text-white font-medium">
								{gameState.state.replace("_", " ").toUpperCase()}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SpectatorView;
