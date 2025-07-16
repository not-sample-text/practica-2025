import React from "react";

const ActiveUsers = ({ users, newMessages = [], onUserClick }) => {
	if (!users || users.length === 0) {
		return (
			<div className="p-4 text-center text-gray-500 dark:text-gray-400">
				No active users.
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-stone-800 rounded-lg shadow-md p-4">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
				Active Users ({users.length})
			</h3>
			<ul className="space-y-2">
				{users.map((user, idx) => (
					<li key={user || idx}>
						<button
							onClick={() => onUserClick && onUserClick(user)}
							className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-stone-700 rounded-md hover:bg-gray-100 dark:hover:bg-stone-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
							<span className="text-gray-900 dark:text-gray-100 font-medium">
								{user}
							</span>
							{newMessages.includes(user) && (
								<span className="inline-flex items-center justify-center w-2 h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full">
									<span className="sr-only">New message</span>
								</span>
							)}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ActiveUsers;
