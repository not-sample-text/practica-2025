import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Header from './components/Header.jsx';
import { Link } from 'react-router-dom';
import { getTokenFromCookie } from './helpers/getTokenFromCookie.js'
import { decodeJWTPayload } from './helpers/decodeJWTPayload.js';
import { clearCookie } from './helpers/clearCookie.js';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = getTokenFromCookie();
  if (!isLoggedIn) {
    return <Login onLogin={() => window.location.href = '/dashboard'} />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const isLoggedIn = getTokenFromCookie();
  if (isLoggedIn) {
    return <Header onLogout={() => { clearCookie(); window.location.href = '/'; }} />;
  }
  return children;
};
const router = createBrowserRouter([{
  path: '/',
  element: <App />,
},
{
  path: '/login',
  element: <PublicRoute><Login onLogin={() => window.location.href = '/dashboard'} /></PublicRoute>
},
{
  path: '/dashboard',
  element: <ProtectedRoute><Header onLogout={() => { clearCookie(); window.location.href = '/'; }} /></ProtectedRoute>,
},
{
  path: '/register',
  element: <PublicRoute><Register /></PublicRoute>
}
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
