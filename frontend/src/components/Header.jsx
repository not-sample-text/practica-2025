import React, {useState, useEffect, useRef} from "react";
import { getTokenFromCookie } from "../helpers/getTokenFromCookie";
import { decodeJWTPayload } from "../helpers/decodeJWTPayload";
import { Link } from "react-router-dom";
import Chat from "./Chat";

const Header = ({ onLogout }) => {
  const wsRef = useRef(null);
  const [token] = useState(decodeJWTPayload(getTokenFromCookie()));
  const [openChat, setOpenChat] = useState(false);
  const [messages, setMessages] = useState([]);
  useEffect(()=>{
    let shouldReconnect = true;
    const connectWebSocket = () => {
      try{
        wsRef.current = new WebSocket("ws://localhost:3000/ws");
        wsRef.current.onopen = () => {
          console.log("WebSocket connection established");
        };
        wsRef.current.onmessage = (event) => {
          console.log("Message from server:", event.data);
          const messageData = JSON.parse(event.data);
          setMessages(prevMessages => [...prevMessages, messageData]);

          if(messageData.content.includes("Invalid or expired token")){
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

  const sendMessage = (message) => {
    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({ type: "message", content: message }));
    }else{
      console.error("WebSocket is not open. Cannot send message.");
    }
  };
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
    <>
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
      <button onClick={() => setOpenChat(!openChat)}>Chat</button>
      {openChat && <Chat 
      openChat={setOpenChat}
      messages={messages}
      sendMessage={sendMessage}
      currentUser={token.username}
      />
      }
      <ul>
        
      </ul>
    </>
  );
};

export default Header;
