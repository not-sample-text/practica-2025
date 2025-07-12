import React from "react";
import { getTokenFromCookie } from "../helpers/getTokenFromCookie";
import { decodeJWTPayload } from "../helpers/decodeJWTPayload";
import { Link } from "react-router-dom";

const Header = ({ onLogout }) => {
  const [token] = React.useState(decodeJWTPayload(getTokenFromCookie()));
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
    <nav>
      <ul>
        <li>
          <strong>Joc extrem</strong>
        </li>
      </ul>
      <ul>
        <li>
          <a href="">Salut, {token.username}</a>
          <Link to="">
            <button onClick={e => { e.preventDefault(); logOut(); }}>Deconectare</button>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
