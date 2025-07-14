import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromCookie());
  const navigate = useNavigate(); 

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/home'); 
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    navigate('/login'); 
  };

  return (
    <Routes>
      <Route path="/" element={!isLoggedIn ? <WelcomePage /> : <Navigate to="/home" />} />

      <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLoginSuccess} /> : <Navigate to="/home" />} />

      <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/home" />} />
      
      <Route path="/home" element={isLoggedIn ? <Header onLogout={handleLogout} /> : <Navigate to="/login" />} />      
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;