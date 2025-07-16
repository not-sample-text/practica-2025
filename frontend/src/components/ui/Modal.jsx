import React from "react";

/**
 * Reusable Modal component following SRP
 */
const Modal = ({ isOpen, onClose, title, children }) => {
	if (!isOpen) return null;

	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 bg-gray-500/75 dark:bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={handleBackdropClick}>
			<div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl max-w-md w-full">
				<div className="flex items-center justify-between p-6 border-b dark:border-stone-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						{title}
					</h2>
					<button
						type="button"
						className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
						onClick={onClose}>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
};

export default Modal;
