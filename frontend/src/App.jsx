import "./App.css";
import React from "react";
import Starter from "./components/Starter";
import Login from "./components/Login";
import Header from "./components/Header";
import { getTokenFromCookie } from "./helpers/getTokenFromCookie";

function App() {
  const isLoggedIn = getTokenFromCookie();

  if(isLoggedIn){
    window.location.href = '/dashboard';
    return null;
  }

  return <Starter />

}

export default App;
