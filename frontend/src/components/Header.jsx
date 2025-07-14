import React from "react";
import ActiveUsers from "./ActiveUsers";

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
    // <nav>
    //   <ul>
    //     <li>
    //       <strong>Joc extrem</strong>
    //     </li>
    //   </ul>
    //   <ul>
    //     <li>
    //       <a href="">Salut, {token.username}</a>
    //       <a href="" onClick={e => { e.preventDefault(); logOut(); }}>
    //         Deconectare
    //       </a>
    //     </li>
    //   </ul>
    // </nav>
    // <div>
    //   <div>
    //     <h2>Utilizatori activi</h2>
    //   </div>

    //   <div className="main-view">
    //     <h1>Bine ai venit </h1>
    //   </div>

    //   <div>
    //     <h2>Chat</h2>
    //   </div>

    // </div>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 5fr 1.5fr', gap: '0.01rem', height: '100vh', overflowX: 'scroll'}}>
        
        <div className="feature-card" style={{ textAlign: 'center', backgroundColor: 'rgba(34, 66, 76, 0.07)', padding: '10px', border: '3px solid rgba(194, 234, 246, 0.07)', overflowX: 'scroll'}}>
          <h5>Utilizatori activi</h5>
          <div>
            <ActiveUsers />
          </div>
          
        </div>
        <div className="feature-card main-view" style={{ textAlign: 'center', border: '3px solid rgba(194, 234, 246, 0.07)' }}>
          <h3>Bine ai venit, {token.username}</h3>
        </div>
        <div className="feature-card" style={{ textAlign: 'center', backgroundColor: 'rgba(34, 66, 76, 0.07)', padding: '10px', border: '3px solid rgba(194, 234, 246, 0.07)'}}>
          <h4>Chat</h4>
        </div>
      </div>


  );
};

export default Header;
