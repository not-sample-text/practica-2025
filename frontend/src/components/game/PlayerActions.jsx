import React from "react";
import { useAppContext } from "../../context/AppContext";
import Button from "../ui/Button";

const PlayerActions = ({ actions }) => {
	const { state, actions: contextActions } = useAppContext();
	const { websocket, gameTimer } = state;

	// Send player action to server
	const sendAction = (action, data = {}) => {
		const message = {
			type: "player_action",
			action,
			...data
		};

		if (websocket && websocket.readyState === WebSocket.OPEN) {
			websocket.send(JSON.stringify(message));
		} else {
			contextActions.setError("Connection lost. Please try again.");
		}
	};

	// Action handlers
	const handleHit = () => {
		sendAction("hit");
	};

	const handleStand = () => {
		sendAction("stand");
	};

	const handleDouble = () => {
		sendAction("double");
	};

	const handleSplit = () => {
		sendAction("split");
	};

	const handleInsurance = () => {
		sendAction("insurance");
	};

	// Get action button configuration
	const getActionConfig = (action) => {
		switch (action) {
			case "hit":
				return {
					label: "Hit",
					onClick: handleHit,
					variant: "primary",
					description: "Take another card"
				};
			case "stand":
				return {
					label: "Stand",
					onClick: handleStand,
					variant: "secondary",
					description: "Keep current hand"
				};
			case "double":
				return {
					label: "Double Down",
					onClick: handleDouble,
					variant: "warning",
					description: "Double bet, take one card, then stand"
				};
			case "split":
				return {
					label: "Split",
					onClick: handleSplit,
					variant: "info",
					description: "Split pair into two hands"
				};
			case "insurance":
				return {
					label: "Insurance",
					onClick: handleInsurance,
					variant: "outline",
					description: "Bet half your wager that dealer has blackjack"
				};
			default:
				return {
					label: action,
					onClick: () => sendAction(action),
					variant: "primary",
					description: `Perform ${action}`
				};
		}
	};

	if (!actions || actions.length === 0) {
		return null;
	}

	return (
		<div className="bg-blue-700 rounded-lg p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xl font-bold text-white">Your Turn</h3>
				{gameTimer && (
					<div className="text-white text-sm">
						Time: {Math.ceil(gameTimer.remaining / 1000)}s
					</div>
				)}
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
				{actions.map((action) => {
					const config = getActionConfig(action);
					return (
						<div
							key={action}
							className="group relative">
							<Button
								onClick={config.onClick}
								variant={config.variant}
								size="md"
								className="w-full">
								{config.label}
							</Button>

							{/* Tooltip */}
							<div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
								{config.description}
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Action Descriptions */}
			<div className="text-xs text-blue-200 space-y-1">
				{actions.includes("hit") && actions.includes("stand") && (
					<p>• Hit to take another card, Stand to keep your current total</p>
				)}
				{actions.includes("double") && (
					<p>
						• Double Down doubles your bet and gives you exactly one more card
					</p>
				)}
				{actions.includes("split") && (
					<p>• Split your pair to play two separate hands</p>
				)}
				{actions.includes("insurance") && (
					<p>
						• Insurance protects against dealer blackjack (costs half your bet)
					</p>
				)}
			</div>

			{/* Timer Warning */}
			{gameTimer && gameTimer.remaining < 10000 && (
				<div className="mt-3 text-center">
					<div className="inline-flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
						<span>⏰ Time running out!</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default PlayerActions;
