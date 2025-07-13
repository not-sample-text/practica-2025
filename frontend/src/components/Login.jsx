import React, { useState } from "react";

const Login = ({ onLogin }) => {
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
        onLogin();
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleRegister = (e) => {
    return;
  };

  return (
    <div className="container">
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
              style={{ width: "100%" }}
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
              style={{ width: "100%" }}
            />
          </label>
        </fieldset>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={handleSubmit}
            type="submit"
            style={{ flex: 1, width: "100%" }}
          >
            Login
          </button>
          <button
            onClick={handleRegister}
            type="button"
            style={{ flex: 1, width: "100%" }}
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
