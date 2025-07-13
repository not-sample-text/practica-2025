import React, {useState, useEffect, useRef} from "react";
import { getTokenFromCookie } from "../helpers/getTokenFromCookie";
import { decodeJWTPayload } from "../helpers/decodeJWTPayload";
import { Link } from "react-router-dom";

const Header = ({ onLogout }) => {
  const wsRef = useRef(null);
  const [token] = useState(decodeJWTPayload(getTokenFromCookie()));
  useEffect(()=>{
    let shouldReconnect = true;
    const connectWebSocket = () => {
      try{
        wsRef.current = new WebSocket("ws://localhost:3000/ws");
        wsRef.current.onopen = () => {
          console.log("WebSocket connection established");
          // if(token){
          //   wsRef.current.send(`auth:${token}`);
          // }
        };
        wsRef.current.onmessage = (event) => {
          console.log("Message from server:", event.data);

          if(event.data.includes("Invalid or expired token")){
            console.error("Invalid or expired token received from server.");
            shouldReconnect = false;
          }
        };
        wsRef.current.onclose = (event) => {
          console.log("WebSocket connection closed.", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          if(shouldReconnect){
            setTimeout(()=>{
              if(wsRef.current?.readyState === WebSocket.CLOSED&&shouldReconnect){
                console.log("Reconnecting WebSocket...");
                connectWebSocket();
              }
            }, 5000);
          }
        };
        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          console.error("Websocket state:", wsRef.current?.readyState);
        };
      } catch (error) {
        console.error("WebSocket connection failed:", error);
      }
    };
    connectWebSocket();
    return () => {
      shouldReconnect = false;
      if(wsRef.current){
        wsRef.current.close();
      }
    };
  }, []);
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
          <span> | </span>
        </li>
        <li>
          <Link to="">
            <button onClick={e => { e.preventDefault(); logOut(); }}>Deconectare</button>
          </Link>
        </li>
      </ul>
    </nav>   
  );
};

export default Header;
