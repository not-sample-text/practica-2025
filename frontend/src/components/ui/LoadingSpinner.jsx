import React from "react";

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
	const sizeClasses = {
		small: "h-8 w-8",
		medium: "h-12 w-12",
		large: "h-16 w-16"
	};

	return (
		<div className="flex flex-col items-center justify-center p-8">
			<div
				className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`}></div>
			<p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>
		</div>
	);
};

export default LoadingSpinner;
