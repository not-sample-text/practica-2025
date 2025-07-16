import React from "react";

/**
 * Connection status indicator component
 */
const ConnectionStatus = ({ status }) => {
	const getStatusColor = () => {
		switch (status) {
			case "connected":
				return "bg-green-500";
			case "error":
				return "bg-red-500";
			default:
				return "bg-yellow-500";
		}
	};

	const getStatusText = () => {
		switch (status) {
			case "connected":
				return "Connected";
			case "error":
				return "Error";
			case "disconnected":
				return "Disconnected";
			default:
				return "Connecting...";
		}
	};

	return (
		<div className="flex items-center space-x-2">
			<div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
			<span className="text-xs text-gray-500 dark:text-gray-400">
				{getStatusText()}
			</span>
		</div>
	);
};

export default ConnectionStatus;
