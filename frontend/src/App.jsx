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
		<div className="min-h-screen bg-gray-50">
			{/* Navbar */}
			<nav className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h2 className="text-xl font-bold text-gray-900">Games Hub</h2>
						<div className="flex space-x-3">
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								onClick={() => setShowLoginModal(true)}>
								Login
							</button>
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						Welcome to Games Hub
					</h1>
					<p className="text-lg text-gray-600 mb-8">
						Connect, play, and have fun with friends!
					</p>
					<div className="space-x-4">
						<button
							type="button"
							className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							onClick={() => setShowSignupModal(true)}>
							Get Started
						</button>
						<button
							type="button"
							className="px-6 py-3 text-base font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
