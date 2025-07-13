import React from "react";
const getTokenFormCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};
const decodeJWTPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};
const Header = ({ onLogout }) => {
  const [token] = React.useState(decodeJWTPayload(getTokenFormCookie()));
  const logOut = () => {
    fetch("/logout")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Deconectare eșuată.");
        }
        onLogout(null);
      })
      .catch((error) => {
        console.error("Eroare la deconectare:", error);
      });
  };
  return (
    <div className="container">
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>Salut, {token.username}</h2>
        <div>
          <strong>Joc extrem</strong>
        </div>
        <div>
          <a href="" onClick={e => { e.preventDefault(); logOut(); }}>
            Deconectare
          </a>
        </div>
      </nav>
    </div>
  );
};

export default Header;
