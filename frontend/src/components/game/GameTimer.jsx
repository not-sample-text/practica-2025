import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

const GameTimer = () => {
	const { state } = useAppContext();
	const { gameTimer } = state;
	const [timeLeft, setTimeLeft] = useState(0);

	useEffect(() => {
		if (!gameTimer) {
			setTimeLeft(0);
			return;
		}

		// Calculate initial time left
		const now = Date.now();
		const remaining = Math.max(0, gameTimer.endTime - now);
		setTimeLeft(remaining);

		// Set up interval to update timer
		const interval = setInterval(() => {
			const now = Date.now();
			const remaining = Math.max(0, gameTimer.endTime - now);
			setTimeLeft(remaining);

			// Clear interval when timer expires
			if (remaining <= 0) {
				clearInterval(interval);
			}
		}, 100); // Update every 100ms for smooth animation

		return () => clearInterval(interval);
	}, [gameTimer]);

	if (!gameTimer || timeLeft <= 0) {
		return null;
	}

	const seconds = Math.ceil(timeLeft / 1000);
	const isUrgent = seconds <= 10;
	const isCritical = seconds <= 5;

	// Calculate progress percentage
	const totalTime = gameTimer.duration || 30000; // Default 30 seconds
	const progress = Math.max(0, (timeLeft / totalTime) * 100);

	// Get timer styling based on urgency
	const getTimerStyling = () => {
		if (isCritical) {
			return "bg-red-600 text-white animate-pulse";
		} else if (isUrgent) {
			return "bg-yellow-600 text-white";
		} else {
			return "bg-blue-600 text-white";
		}
	};

	// Get progress bar color
	const getProgressColor = () => {
		if (isCritical) return "bg-red-500";
		if (isUrgent) return "bg-yellow-500";
		return "bg-blue-500";
	};

	return (
		<div className="inline-flex items-center space-x-3">
			{/* Timer Display */}
			<div
				className={`px-3 py-1 rounded-full text-sm font-bold ${getTimerStyling()}`}>
				<div className="flex items-center space-x-2">
					<span>⏱️</span>
					<span>{seconds}s</span>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-16 h-2 bg-gray-300 rounded-full overflow-hidden">
				<div
					className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Timer Type Label */}
			{gameTimer.type && (
				<span className="text-sm text-white opacity-75">
					{gameTimer.type === "action" && "Action"}
					{gameTimer.type === "betting" && "Betting"}
					{gameTimer.type === "game" && "Game"}
					{gameTimer.type === "disconnect" && "Reconnect"}
				</span>
			)}
		</div>
	);
};

export default GameTimer;
