import React, { useState } from "react";

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Toate câmpurile sunt obligatorii.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/register" : "/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Data from response: ", data)

      if (response.ok && data.success) {
        onLogin(data.username || username);
      } else {
        setError(data.error?.general || "Autentificare eșuată. Verificați datele.");
      }
    } catch (setError) {
      setError("Inregistrare eșuată. Încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "0 auto", padding: "2rem" }}>
      <h2>{isRegister ? "Înregistrare" : "Autentificare"}</h2>

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <fieldset style={{ border: "none", padding: 0 }}>
        <label>
          Utilizator
          <input
            type="text"
            name="utilizator"
            placeholder="Utilizator"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <br />
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

      <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
        {loading ? "Se încarcă..." : isRegister ? "Înregistrare" : "Login"}
      </button>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button
          type="button"
          onClick={toggleMode}
          style={{ background: "none", border: "none", color: "#646cff", textDecoration: "underline", cursor: "pointer" }}
        >
          {isRegister ? "Ai deja un cont? Autentificate" : "Nu ai cont? Înregistrează-te"}
        </button>
      </div>
    </form>
  );
};

export default Login;
