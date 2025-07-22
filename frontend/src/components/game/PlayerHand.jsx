import React from "react";
import Card from "./Card";

const PlayerHand = ({
	player,
	hand,
	isCurrentPlayer,
	isActivePlayer,
	gameState
}) => {
	const { username, state, chips, bet, isConnected } = player;

	// Default hand if not provided
	const playerHand = hand || { cards: [], total: 0 };
	const { cards, total } = playerHand;

	// Determine player status styling
	const getPlayerStatusColor = () => {
		if (!isConnected) return "bg-gray-600";
		if (isActivePlayer) return "bg-yellow-600";
		if (isCurrentPlayer) return "bg-blue-600";
		return "bg-green-600";
	};

	const getPlayerStatusText = () => {
		if (!isConnected) return "Disconnected";
		if (state === "busted") return "Busted";
		if (state === "standing") return "Standing";
		if (state === "betting") return "Betting";
		if (state === "playing") return "Playing";
		if (state === "waiting") return "Waiting";
		return state;
	};

	// Check for special hand conditions
	const hasBlackjack = total === 21 && cards.length === 2;
	const isBusted = total > 21;

	// Get border styling based on player state
	const getBorderStyling = () => {
		let classes = "border-2 rounded-lg p-4 ";

		if (!isConnected) {
			classes += "border-gray-400 opacity-50";
		} else if (isActivePlayer) {
			classes += "border-yellow-400 shadow-lg shadow-yellow-400/50";
		} else if (isCurrentPlayer) {
			classes += "border-blue-400";
		} else {
			classes += "border-green-400";
		}

		return classes;
	};

	return (
		<div className={getBorderStyling()}>
			{/* Player Header */}
			<div
				className={`${getPlayerStatusColor()} rounded-t-lg px-3 py-2 -mx-4 -mt-4 mb-4`}>
				<div className="flex justify-between items-center text-white text-sm">
					<div className="font-semibold">
						{username}
						{isCurrentPlayer && " (You)"}
					</div>
					<div className="text-right">
						<div>{getPlayerStatusText()}</div>
						{!isConnected && (
							<div className="text-xs text-gray-200">Offline</div>
						)}
					</div>
				</div>
			</div>

			{/* Player Info */}
			<div className="text-white text-sm mb-3 space-y-1">
				<div>Chips: {chips || 0}</div>
				{bet > 0 && <div className="text-yellow-300">Bet: {bet}</div>}
			</div>

			{/* Cards Display */}
			{cards.length > 0 ? (
				<div className="space-y-3">
					<div className="flex flex-wrap gap-1 justify-center">
						{cards.map((card, index) => (
							<Card
								key={index}
								card={card}
							/>
						))}
					</div>

					{/* Hand Total and Status */}
					<div className="text-center text-white">
						<div className="text-lg font-semibold">Total: {total}</div>

						{hasBlackjack && (
							<div className="text-yellow-300 font-bold text-sm">
								BLACKJACK! 🎉
							</div>
						)}

						{isBusted && (
							<div className="text-red-400 font-bold text-sm">BUSTED! 💥</div>
						)}

						{state === "standing" && !hasBlackjack && !isBusted && (
							<div className="text-blue-300 text-sm">Standing</div>
						)}
					</div>
				</div>
			) : (
				<div className="text-center text-gray-300 py-8">
					{gameState === "waiting" ? "Waiting for game..." : "No cards yet"}
				</div>
			)}

			{/* Active Player Indicator */}
			{isActivePlayer && gameState === "playing" && (
				<div className="mt-3 text-center">
					<div className="inline-flex items-center space-x-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
						<div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
						<span>Player's Turn</span>
					</div>
				</div>
			)}

			{/* Betting Indicator */}
			{state === "betting" && gameState === "betting" && (
				<div className="mt-3 text-center">
					<div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
						<div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
						<span>Placing Bet</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default PlayerHand;
