import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onLogout, isLoggedIn }) => {
  const navigate = useNavigate();
  let isUserLoggedIn = isLoggedIn;

  const logOut = () => {

    fetch("/logout", {
      method: 'GET',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Deconectare eșuată.");
        }
        console.log(response);
        // return response.json();
        // navigate('home');
      }).then(() => {
        onLogout(null);
        navigate('/');
      })
      .catch((error) => {
        console.error("Eroare la deconectare:", error);
      });
  };

  return (
    <nav className="container-fluid" >

      <ul>
        <li><strong>JOC</strong></li>
      </ul>

      <ul className="nav-links">
        <li><a href="/home" className="contrast">Home</a></li>
        <li><a href="/dashboard" className="contrast">Game</a></li>
        <li><a href="/about" className="contrast">About</a></li>
      </ul>
      <ul>
        {isUserLoggedIn ? (
          <li>
            <button className="secondary" onClick={e => { e.preventDefault(); logOut(); }} > Logout </button>
          </li>
        ) : (
          <>
           <li>
            <button className="secondary" onClick={e => { e.preventDefault(); logOut(); }} > Sign In </button>
          </li>
          <li>
            <button className="secondary" onClick={e => { e.preventDefault(); logOut(); }} > Sign Up </button>
          </li>
          </>
          
        )}

      </ul>

    </nav>
  );
};

export default Navbar;
