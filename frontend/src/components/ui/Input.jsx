import React from "react";

/**
 * Reusable Input component following SRP
 */
const Input = ({
	label,
	error,
	type = "text",
	placeholder,
	value,
	onChange,
	required = false,
	disabled = false,
	className = "",
	...props
}) => {
	const inputClasses = `w-full px-3 py-2 border ${
		error
			? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
			: "border-gray-300 dark:border-stone-600 focus:ring-indigo-500 focus:border-indigo-500"
	} rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-stone-700 text-gray-900 dark:text-gray-100 focus:outline-none ${
		disabled ? "opacity-50 cursor-not-allowed" : ""
	} ${className}`.trim();

	return (
		<div>
			{label && (
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{label}
				</label>
			)}
			<input
				type={type}
				className={inputClasses}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				required={required}
				disabled={disabled}
				{...props}
			/>
			{error && (
				<div className="mt-1 text-sm text-red-600 dark:text-red-400">
					{error}
				</div>
			)}
		</div>
	);
};

export default Input;
