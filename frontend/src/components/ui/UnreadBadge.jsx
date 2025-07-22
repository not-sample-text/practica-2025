import React, { useState, useEffect } from "react";

const UnreadBadge = ({ count, onClear }) => {
	const [isVisible, setIsVisible] = useState(count > 0);
	const [shouldShow, setShouldShow] = useState(count > 0);

	useEffect(() => {
		if (count > 0) {
			// Show the badge immediately
			setShouldShow(true);
			setIsVisible(true);
		} else if (count === 0 && shouldShow && isVisible) {
			// Only start fade out if we were previously showing
			setIsVisible(false);
			// Remove from DOM after animation completes
			const timer = setTimeout(() => {
				setShouldShow(false);
				if (onClear) onClear();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [count, shouldShow, isVisible, onClear]);

	if (!shouldShow) return null;

	const displayCount = count > 9 ? "9+" : count.toString();

	return (
		<span
			className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-medium text-white bg-red-500 rounded-full transition-opacity duration-500 ${
				isVisible ? "opacity-100" : "opacity-0"
			}`}>
			{displayCount}
		</span>
	);
};

export default UnreadBadge;
