import React from "react";

/**
 * Reusable Button component following SRP
 */
const Button = ({
	children,
	variant = "primary",
	size = "medium",
	disabled = false,
	onClick,
	type = "button",
	className = "",
	...props
}) => {
	const baseClasses =
		"font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

	const variants = {
		primary:
			"text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:ring-indigo-500",
		secondary:
			"text-gray-700 dark:text-gray-300 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 hover:bg-gray-50 dark:hover:bg-stone-600 focus:ring-indigo-500",
		danger:
			"text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500",
		ghost:
			"text-indigo-600 dark:text-indigo-400 bg-white dark:bg-stone-800 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-stone-700 focus:ring-indigo-500"
	};

	const sizes = {
		small: "px-3 py-1.5 text-xs",
		medium: "px-4 py-2 text-sm",
		large: "px-6 py-3 text-base"
	};

	const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

	const buttonClasses =
		`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`.trim();

	return (
		<button
			type={type}
			className={buttonClasses}
			onClick={onClick}
			disabled={disabled}
			{...props}>
			{children}
		</button>
	);
};

export default Button;
