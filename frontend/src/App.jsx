import "./App.css";
import React, { useEffect, useRef } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";
import ActiveUsers from "./components/ActiveUsers";
import Header from "./components/Header";
import Game from "./components/Game";
import ChallengeModal from './components/ChallengeModal';

const getTokenFromCookie = () => {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};
// Get username from JWT token
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "Unknown User";
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return "Unknown User";
  }
};
function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!getTokenFromCookie());

  const [users, setUsers] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [connectionStatus, setConnectionStatus] = React.useState("disconnected");
  const [selectedChat, setSelectedChat] = React.useState("broadcast");
  const [challengedUser, setChallengedUser] = React.useState(null);
  const [challengeInitiator, setChallengeInitiator] = React.useState(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = React.useState(false);
  const [isGameStarted, setIsGameStarted] = React.useState(false);
  const [player, setPlayer] = React.useState(null);
  const [opponent, setOpponent] = React.useState(null);
  const [isGameUpdate, setIsGameUpdate] = React.useState(false);
  const username = getUsernameFromToken(getTokenFromCookie());

  const websocketRef = useRef(null);



  // WebSocket connection effect
  useEffect(() => {
    if (isLoggedIn) {
      // set username again when the page reloads(not only at log in)
      // setUsername();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isLoggedIn]);

  // useEffect(() => {
  //   loggedInUser = username;

  // }, [username]);

  const connectWebSocket = () => {

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port =
      location.port === "80" || location.port === "443"
        ? ""
        : `:${location.port}`;
    const wsUrl = `${protocol}//${window.location.hostname}${port}/ws`;
    console.log("Connecting to WebSocket at:", wsUrl);
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "private":
            setMessages((prev) => [...prev, data]);
            break;
          case "broadcast":
            setMessages((prev) => [...prev, data]);
            break;
          case "usernames":
            setUsers(['broadcast', ...data.content]);
            break;
          case "challenge":
            manageChallenge(data);
            break;
          case "game":
            manageGame(data);
            break;
          case 'error':
            console.error('server error:', error);
            break;
          default:
            console.warn("Unknown message type:", data);
            return;
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        return;
      }
    };

    websocketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");
    };

    websocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setConnectionStatus("disconnected");
  };

  const sendMessage = (message) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(
        JSON.stringify(message)
      );
    }
  };

  const handleLogin = (loggedInUsername) => {
    // setUsername(loggedInUsername);
    setIsLoggedIn(true);
    setMessages([]); // Clear messages on login
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const response = await fetch("/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        // Clear local state
        setIsLoggedIn(false);
        setUsername(null);
        setMessages([]);

        // Close WebSocket connection
        disconnectWebSocket();

        // Clear token cookie on client side as well
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        console.log("Logged out successfully");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if server call fails
      setIsLoggedIn(false);
      setUsername(null);
      setMessages([]);
      disconnectWebSocket();
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  const handleSelectChat = (chatname, messages) => {
    setSelectedChat(chatname);
    setMessages([...messages]);
  }

  const manageChallenge = (challenge) => {
    switch (challenge.status) {
      case 'initiated':
        // print('initiated:', username)
        openModal(true);
        setChallengeInitiator(challenge.from);
        // daca status e initiated at. utilizatorul care primeste challenge-ul va fi opponent
        setPlayer(username);
        setOpponent(challenge.from);
        break;
      case 'accepted':
        // doar utilizatorul care initeaza challenge-ul va primi acest status si va fi setat ca player
        // print('accepted:', username)
        setIsGameStarted(true);
        setPlayer(username);
        setOpponent(challenge.from);
        setChallengeInitiator(username);
        
        alert(`${challenge.from} has accepted your challenge`);
        break;
      case 'rejected':

        challengedUser(null);
        setPlayer(null);
        setOpponent(null);
        alert(`${challenge.from} has rejected your challenge`);
        break;
    }
  }

  const sendChallenge = (user, status) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {

      const challenge = {
        type: 'challenge',
        from: username,
        to: user,
        status: status
      }

      websocketRef.current.send(JSON.stringify(challenge));
    }
  }

  const handleChallengeUser = (user) => {
    sendChallenge(user, 'initiated');
    // setIsChallenged(true);
    setChallengedUser(user);
  }

  const openModal = () => setIsChallengeModalOpen(true);
  const closeModal = () => setIsChallengeModalOpen(false);
  const handleAccept = () => {
    sendChallenge(challengeInitiator, 'accepted');
    setIsGameStarted(true);
    closeModal();
  };
  const handleReject = () => {
    sendChallenge(challengeInitiator, 'rejected');
    closeModal();
  };


  const updateGameState = () => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      console.log('sending update to server');
      const gameState = {
        type: 'game',
        from: player,
        to: opponent,
        status: 'update'
      }
      
      websocketRef.current.send(JSON.stringify(gameState));
    }
  }

  const manageGame = (gameState) => {
    switch(gameState.status) {
      case 'update':
        console.log('setting update to true')
        setIsGameUpdate(true);
        break;
    }
  }

  return isLoggedIn ? (
    <div className="main light">
      {isChallengeModalOpen &&
        <ChallengeModal
          user={challengeInitiator}
          isOpen={isChallengeModalOpen}
          onClose={handleReject}
          onAccept={handleAccept}
          onReject={handleReject}
        />}
      <div className="grid">
        <Header onLogout={handleLogout} connectionStatus={connectionStatus} />
      </div>
      <div className="grid" >
        <div className="grid">
          <ActiveUsers
            users={users}
            newMessages={messages}
            handleSelectChat={handleSelectChat}
            handleChallengeUser={handleChallengeUser}
          />
          <div>
            <Chat
              chatname={selectedChat}
              username={username}
              messages={messages}
              sendMessage={sendMessage}
              connectionStatus={connectionStatus}
            />
          </div>

        </div>

        <div className="game-container d-flex-centerX d-flex-column" style={{ backgroundColor: "rgb(29, 36, 50)", border: "2px solid rgba(102, 112, 133, 1)" }}>
          <Game
            initiator={challengeInitiator}
            isGameStarted={isGameStarted}
            player={player}
            opponent={opponent}
            updateGameState={updateGameState}
            isGameUpdate={isGameUpdate}
            setIsGameUpdate={setIsGameUpdate}
          />

        </div>

      </div>
    </div>
  ) : (
    <>
      <Login onLogin={handleLogin} />
    </>

  );
}

export default App;
