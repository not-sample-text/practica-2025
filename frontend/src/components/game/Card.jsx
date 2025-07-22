import React from "react";

const Card = ({ card, isHidden = false }) => {
	if (isHidden) {
		return (
			<div className="w-16 h-24 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center">
				<div className="text-white text-xs">?</div>
			</div>
		);
	}

	if (!card) {
		return (
			<div className="w-16 h-24 bg-gray-300 border-2 border-gray-400 rounded-lg flex items-center justify-center">
				<div className="text-gray-600 text-xs">Empty</div>
			</div>
		);
	}

	// Determine card color based on suit
	const isRed = ["HEARTS", "DIAMONDS"].includes(card.suit);
	const textColor = isRed ? "text-red-600" : "text-black";

	// Get suit symbol
	const getSuitSymbol = (suit) => {
		switch (suit) {
			case "HEARTS":
				return "♥";
			case "DIAMONDS":
				return "♦";
			case "CLUBS":
				return "♣";
			case "SPADES":
				return "♠";
			default:
				return suit;
		}
	};

	// Get display value
	const getDisplayValue = (value) => {
		switch (value) {
			case "ACE":
				return "A";
			case "KING":
				return "K";
			case "QUEEN":
				return "Q";
			case "JACK":
				return "J";
			default:
				return value;
		}
	};

	return (
		<div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col justify-between p-1 shadow-md">
			{/* Top left corner */}
			<div className={`text-xs font-bold ${textColor} leading-none`}>
				<div>{getDisplayValue(card.value)}</div>
				<div>{getSuitSymbol(card.suit)}</div>
			</div>

			{/* Center suit symbol */}
			<div className={`text-2xl ${textColor} text-center`}>
				{getSuitSymbol(card.suit)}
			</div>

			{/* Bottom right corner (rotated) */}
			<div
				className={`text-xs font-bold ${textColor} leading-none text-right transform rotate-180`}>
				<div>{getDisplayValue(card.value)}</div>
				<div>{getSuitSymbol(card.suit)}</div>
			</div>
		</div>
	);
};

export default Card;
