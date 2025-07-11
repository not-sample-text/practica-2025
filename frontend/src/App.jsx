import "./App.css";
import React from "react";
import Login from "./components/Login";
import Header from "./components/Header";

const getTokenFormCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(getTokenFormCookie());

  return isLoggedIn ? <Header onLogout={setIsLoggedIn} /> : <Login onLogin={() => setIsLoggedIn(true)} />;
}

export default App;
