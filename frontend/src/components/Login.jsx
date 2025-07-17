import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw errorData;
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        onLogin(username);
      }
    })
    .catch((err) => {
      const errorMessage = Object.values(err.errors || {}).join(' ') || err.message || "A apărut o eroare neașteptată.";
      setError(errorMessage);
    });
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Autentificare</h2>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username-login" className="form-label">
                Utilizator
              </label>
              <input
                type="text"
                className="form-control"
                id="username-login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password-login" className="form-label">
                Parolă
              </label>
              <input
                type="password"
                className="form-control"
                id="password-login"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                Autentificare
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <Link to="/register">Nu ai cont? Înregistrează-te</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;