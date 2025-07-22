import React from "react";
import Card from "./Card";

const DealerHand = ({ hand, gameState }) => {
	const { cards, visible, total } = hand;

	// Show all cards only during dealer turn and round complete
	const showAllCards =
		gameState === "dealer_turn" || gameState === "round_complete";

	// Cards to display - either all cards or just the visible ones
	const displayCards = showAllCards ? cards : visible;

	// Calculate display total
	const displayTotal = showAllCards
		? total
		: visible.length > 0
		? calculateVisibleTotal(visible)
		: 0;

	// Determine if dealer has blackjack or busted
	const hasBlackjack = showAllCards && total === 21 && cards.length === 2;
	const isBusted = showAllCards && total > 21;

	return (
		<div className="bg-green-600 rounded-lg p-6 text-center">
			<h2 className="text-2xl font-bold text-white mb-4">Dealer</h2>

			{/* Cards Display */}
			<div className="flex justify-center items-center space-x-2 mb-4">
				{displayCards.map((card, index) => (
					<Card
						key={index}
						card={card}
					/>
				))}

				{/* Hidden card placeholder when not showing all cards */}
				{!showAllCards && cards.length > visible.length && (
					<div className="w-16 h-24 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center">
						<div className="text-white text-xs">?</div>
					</div>
				)}
			</div>

			{/* Hand Total and Status */}
			<div className="text-white">
				{showAllCards ? (
					<div className="space-y-2">
						<div className="text-xl font-semibold">Total: {total}</div>
						{hasBlackjack && (
							<div className="text-yellow-300 font-bold">BLACKJACK!</div>
						)}
						{isBusted && <div className="text-red-400 font-bold">BUSTED!</div>}
					</div>
				) : (
					<div className="text-lg">
						{visible.length > 0 ? `Showing: ${displayTotal}` : "Face down"}
					</div>
				)}
			</div>

			{/* Game State Messages */}
			<div className="mt-3 text-green-200 text-sm">
				{gameState === "dealing" && "Dealing cards..."}
				{gameState === "betting" && "Waiting for bets..."}
				{gameState === "playing" && "Players taking turns..."}
				{gameState === "dealer_turn" && "Dealer playing..."}
				{gameState === "round_complete" && "Round complete!"}
			</div>
		</div>
	);
};

// Helper function to calculate total of visible cards
function calculateVisibleTotal(visibleCards) {
	let total = 0;
	let aces = 0;

	for (const card of visibleCards) {
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
}

export default DealerHand;
