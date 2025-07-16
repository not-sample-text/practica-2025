import React from "react";
import Button from "../ui/Button";
import ConnectionStatus from "../ui/ConnectionStatus";

/**
 * Navigation bar component - responsible only for navigation UI
 */
const Navbar = ({
	user,
	connectionStatus,
	onReconnect,
	onToggleUsers,
	onLogout,
	showUsers
}) => {
	return (
		<nav className="bg-white dark:bg-stone-800 shadow-sm border-b dark:border-stone-700">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						Games Hub
					</h2>
					<div className="flex items-center space-x-4">
						<ConnectionStatus status={connectionStatus} />
						{user && (
							<span className="text-sm text-gray-700 dark:text-gray-300">
								Hello,{" "}
								<span className="font-medium">
									{user.username || "Unknown"}
								</span>
								!
							</span>
						)}
						<Button
							onClick={onReconnect}
							disabled={connectionStatus === "connected"}
							variant="primary"
							size="small">
							{connectionStatus === "connected" ? "Connected" : "Reconnect"}
						</Button>
						<Button
							onClick={onToggleUsers}
							variant="secondary"
							size="small">
							{showUsers ? "Hide Users" : "Show Users"}
						</Button>
						<Button
							onClick={onLogout}
							variant="secondary"
							size="small">
							Logout
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
