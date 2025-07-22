import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Button from "../ui/Button";

const BettingInterface = () => {
	const { state, actions } = useAppContext();
	const { chips, currentBet, websocket } = state;
	const [selectedBet, setSelectedBet] = useState(0);

	// Predefined chip values for quick betting
	const chipValues = [10, 25, 50, 100, 250, 500];

	// Handle chip selection
	const handleChipSelect = (value) => {
		const newBet = Math.min(selectedBet + value, chips);
		setSelectedBet(newBet);
	};

	// Handle custom bet input
	const handleCustomBet = (event) => {
		const value = parseInt(event.target.value) || 0;
		const maxBet = Math.min(value, chips);
		setSelectedBet(maxBet);
	};

	// Handle bet placement
	const handlePlaceBet = () => {
		if (selectedBet < 10) {
			actions.setError("Minimum bet is 10 chips");
			return;
		}

		if (selectedBet > chips) {
			actions.setError("Not enough chips");
			return;
		}

		// Send bet to server
		const message = {
			type: "place_bet",
			amount: selectedBet
		};

		if (websocket && websocket.readyState === WebSocket.OPEN) {
			websocket.send(JSON.stringify(message));
			actions.setCurrentBet(selectedBet);
			setSelectedBet(0);
		} else {
			actions.setError("Connection lost. Please try again.");
		}
	};

	// Handle bet clearing
	const handleClearBet = () => {
		setSelectedBet(0);
	};

	// Handle all-in bet
	const handleAllIn = () => {
		setSelectedBet(chips);
	};

	return (
		<div className="bg-green-600 rounded-lg p-4">
			<h3 className="text-xl font-bold text-white mb-4 text-center">
				Place Your Bet
			</h3>

			{/* Current Chips and Bet Display */}
			<div className="text-center text-white mb-4">
				<div className="text-lg">Available Chips: {chips}</div>
				{currentBet > 0 && (
					<div className="text-yellow-300">Current Bet: {currentBet}</div>
				)}
				<div className="text-sm text-green-200">Minimum Bet: 10 chips</div>
			</div>

			{/* Selected Bet Display */}
			<div className="text-center mb-4">
				<div className="text-2xl font-bold text-yellow-300">
					Selected: {selectedBet} chips
				</div>
			</div>

			{/* Quick Chip Selection */}
			<div className="grid grid-cols-3 gap-2 mb-4">
				{chipValues.map((value) => (
					<button
						key={value}
						onClick={() => handleChipSelect(value)}
						disabled={chips < value}
						className={`
							px-3 py-2 rounded-lg font-semibold text-white transition-all
							${
								chips >= value
									? "bg-yellow-600 hover:bg-yellow-500 active:scale-95"
									: "bg-gray-500 cursor-not-allowed opacity-50"
							}
						`}>
						+{value}
					</button>
				))}
			</div>

			{/* Custom Bet Input */}
			<div className="mb-4">
				<label className="block text-white text-sm font-medium mb-2">
					Custom Amount:
				</label>
				<input
					type="number"
					min="10"
					max={chips}
					value={selectedBet || ""}
					onChange={handleCustomBet}
					placeholder="Enter bet amount"
					className="w-full px-3 py-2 bg-green-700 text-white rounded-lg border border-green-500 focus:border-yellow-400 focus:outline-none"
				/>
			</div>

			{/* Bet Controls */}
			<div className="grid grid-cols-2 gap-2 mb-4">
				<Button
					onClick={handleAllIn}
					disabled={chips === 0}
					variant="secondary"
					size="sm">
					All In ({chips})
				</Button>
				<Button
					onClick={handleClearBet}
					disabled={selectedBet === 0}
					variant="outline"
					size="sm">
					Clear
				</Button>
			</div>

			{/* Place Bet Button */}
			<Button
				onClick={handlePlaceBet}
				disabled={selectedBet < 10 || selectedBet > chips}
				variant="primary"
				size="lg"
				className="w-full">
				{selectedBet < 10
					? "Minimum bet is 10 chips"
					: `Place Bet (${selectedBet} chips)`}
			</Button>

			{/* Betting Tips */}
			<div className="mt-4 text-xs text-green-200 text-center">
				<p>• Double down available after first two cards</p>
				<p>• Blackjack pays 3:2</p>
				<p>• Insurance available when dealer shows Ace</p>
			</div>
		</div>
	);
};

export default BettingInterface;
