import "./App.css";
import React from "react";
import Login from "./components/Login";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import { Routes, Route } from 'react-router-dom'

const getTokenFormCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(getTokenFormCookie() !== null);
  // <Navbar />
  // return isLoggedIn ? <Header onLogout={setIsLoggedIn} /> : <Login onLogin={() => setIsLoggedIn(true)} />;

  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  const handleLogout = () => {
    setIsLoggedIn(false); 
  };

  return (
    <>
      {/* 
      
      {isLoggedIn ? (
        <Header onLogout={handleLogout} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )} */}
      <Navbar onLogout={handleLogout} isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route path="/dashboard" element={<Header onLogout={handleLogout} />} />


        <Route path="/home" element={<Home />} />

        <Route path="*" element={<Home />} />



      </Routes>
    



    </>
  );
}

export default App;
