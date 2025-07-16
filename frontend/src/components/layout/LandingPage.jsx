import React from "react";
import Button from "../ui/Button";

/**
 * Landing page component - responsible only for presenting the welcome screen
 */
const LandingPage = ({ onShowLogin, onShowSignup }) => {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-stone-900">
			{/* Navbar */}
			<nav className="bg-white dark:bg-stone-800 shadow-md">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
							Games Hub
						</h2>
						<div className="flex space-x-3">
							<Button
								onClick={onShowLogin}
								variant="secondary"
								size="medium">
								Login
							</Button>
							<Button
								onClick={onShowSignup}
								variant="primary"
								size="medium">
								Sign Up
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
						Welcome to Games Hub
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
						Connect, play, and have fun with friends!
					</p>
					<div className="space-x-4">
						<Button
							onClick={onShowSignup}
							variant="primary"
							size="large">
							Get Started
						</Button>
						<Button
							onClick={onShowLogin}
							variant="ghost"
							size="large">
							Learn More
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LandingPage;
