import React, {useState} from "react";

const Register = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!username || !password || !confirmPassword) {
            setError("Toate câmpurile sunt obligatorii.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Parolele nu se potrivesc.");
            return;
        }
        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Înregistrare eșuată. Verificați datele.");
                }
                return response.json();
            })
            .then(() => {
                window.location.href = '/login';
            })
            .catch((error) => {
                setError(error.message);
            });
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "0 auto" }}>
            <h2>Înregistrare</h2>
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
                <label>
                    Confirmă Parola
                    <input
                        type="password"
                        name="confirm-parola"
                        placeholder="Confirmă Parola"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">Înregistrează-te</button>
            </fieldset>
        </form>
    );
}

export default Register;