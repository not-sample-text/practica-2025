import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Toate câmpurile sunt obligatorii.");
      return;
    }

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Autentificare eșuată. Verificați datele.");
        }
        return response.json();
      })
      .then(() => {
        // onLogin();
        navigate('../dashboard');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "0 auto" }}>
      <h2>Autentificare</h2>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <fieldset>
        <label>
          Utilizator
          <input
            name="utilizator"
            placeholder="Utilizator"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Parolă
          <input
            type="password"
            name="parola"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </fieldset>
      <button onClick={handleSubmit} type="submit">
        Login
      </button>
    </form>
  );
};

export default Login;
