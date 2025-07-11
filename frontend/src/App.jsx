import React, { useState } from "react";
import Login from "./components/Login";
import Header from "./components/Header";

const getTokenFromCookie = () => {
	const match = document.cookie.match(/token=([^;]+)/);
	return match ? match[1] : null;
};

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(getTokenFromCookie());
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showSignupModal, setShowSignupModal] = useState(false);

	if (isLoggedIn) {
		return <Header onLogout={() => setIsLoggedIn(null)} />;
	}

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
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 rounded-md hover:bg-gray-50 dark:hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								onClick={() => setShowLoginModal(true)}>
								Login
							</button>
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								onClick={() => setShowSignupModal(true)}>
								Sign Up
							</button>
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
						<button
							type="button"
							className="px-6 py-3 text-base font-medium text-white bg-indigo-600 dark:bg-indigo-700 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							onClick={() => setShowSignupModal(true)}>
							Get Started
						</button>
						<button
							type="button"
							className="px-6 py-3 text-base font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-stone-800 border border-indigo-600 dark:border-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							onClick={() => setShowLoginModal(true)}>
							Learn More
						</button>
					</div>
				</div>
			</div>

			{/* Login Modal */}
			{showLoginModal && (
				<Login
					onLogin={() => {
						setIsLoggedIn(true);
						setShowLoginModal(false);
					}}
					onClose={() => setShowLoginModal(false)}
					isSignup={false}
				/>
			)}

			{/* Signup Modal */}
			{showSignupModal && (
				<Login
					onLogin={() => {
						setIsLoggedIn(true);
						setShowSignupModal(false);
					}}
					onClose={() => setShowSignupModal(false)}
					isSignup={true}
				/>
			)}
		</div>
	);
}

export default App;
