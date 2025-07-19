// import React, { useState } from "react";

// const Register = ({ onRegister }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!username || !password) {
//       setError("Toate câmpurile sunt obligatorii.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetch("/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ username, password }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         onRegister(data.username || username);
//       } else {
//         setError(data.error || "Înregistrare eșuată. Verificați datele.");
//       }
//     } catch (err) {
//       setError("Înregistrare eșuată. Încercați din nou.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "0 auto", padding: "2rem" }}>
//       <h2>Înregistrare</h2>

//       {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

//       <fieldset style={{ border: "none", padding: 0 }}>
//         <label>
//           Utilizator
//           <input
//             type="text"
//             name="utilizator"
//             placeholder="Utilizator"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//           />
//         </label>
//         <br />
//         <label>
//           Parolă
//           <input
//             type="password"
//             name="parola"
//             placeholder="Parolă"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//         </label>
//       </fieldset>

//       <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
//         {loading ? "Se încarcă..." : "Înregistrare"}
//       </button>

//     </form>
//   );
// };

// export default Register;
