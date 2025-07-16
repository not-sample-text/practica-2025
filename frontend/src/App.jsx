import "./App.css";
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AppLayout from "./components/AppLayout";
import ActiveUsers from "./components/chat/ActiveUsers";
import Header from "./components/Header";

const getTokenFormCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  // Remove all state and logic from here, move to AppLayout if needed
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app/*" element={<AppLayout />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
