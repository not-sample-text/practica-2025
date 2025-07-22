import React, { useState, useEffect, useRef } from "react";
import Chat from "./Chat";
import ActiveUsers from "./ActiveUsers";
import ChatTabs from "./ChatTabs";
import GroupChatModal from "./GroupChatModal";
import GameManager from "./GameManager";
import "../stylecomponents/ChatManager.css";

const ChatManager = ({ username, connectionStatus, websocketRef }) => {
  const [chats, setChats] = useState([
    { id: 'global', name: 'Global Chat', type: 'global', messages: [], unreadCount: 0 }
  ]);
  const [activeChat, setActiveChat] = useState('global');
  const [users, setUsers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const gameManagerRef = useRef();

  // WebSocket listener
  useEffect(() => {
    if (connectionStatus === "connected" && websocketRef.current) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('ChatManager received message:', data);

          switch (data.type) {
            case 'usernames':
              setUsers(data.content || []);
              break;
            case 'message':
            case 'broadcast':
              handleIncomingMessage(data);
              break;
            case 'private':
              handlePrivateMessage(data);
              break;
            case 'private_sent':
              handlePrivateMessageSent(data);
              break;
            case 'group':
              handleGroupMessage(data);
              break;
            case 'group_created':
              handleGroupCreated(data);
              break;
            case 'user_joined':
            case 'user_left':
              handleGroupMembershipChange(data);
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocketRef.current.addEventListener('message', handleMessage);

      return () => {
        websocketRef.current?.removeEventListener('message', handleMessage);
      };
    }
  }, [connectionStatus, websocketRef, activeChat, username]);

  const handleIncomingMessage = (data) => {
    const message = {
      username: data.username,
      content: data.content,
      timestamp: data.timestamp || Date.now(),
      type: data.type
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === 'global'
          ? {
              ...chat,
              messages: [...chat.messages, message],
              unreadCount: activeChat !== 'global' ? chat.unreadCount + 1 : 0
            }
          : chat
      )
    );
  };

  const handlePrivateMessage = (data) => {
    const chatId = `private-${data.username}`;
    const message = {
      username: data.username,
      content: data.content,
      timestamp: data.timestamp || Date.now(),
      type: 'private'
    };

    setChats(prevChats => {
      const existingChat = prevChats.find(chat => chat.id === chatId);

      if (existingChat) {
        return prevChats.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, message],
                unreadCount: activeChat !== chatId ? chat.unreadCount + 1 : 0
              }
            : chat
        );
      } else {
        const newChat = {
          id: chatId,
          name: data.username,
          type: 'private',
          messages: [message],
          unreadCount: activeChat !== chatId ? 1 : 0,
          participants: [username, data.username]
        };
        return [...prevChats, newChat];
      }
    });
  };

  const handlePrivateMessageSent = (data) => {
    const chatId = `private-${data.recipient}`;
    const message = {
      username: data.username,
      content: data.content,
      timestamp: data.timestamp || Date.now(),
      type: 'private'
    };

    setChats(prevChats => {
      const existingChat = prevChats.find(chat => chat.id === chatId);

      if (existingChat) {
        return prevChats.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, message]
              }
            : chat
        );
      } else {
        const newChat = {
          id: chatId,
          name: data.recipient,
          type: 'private',
          messages: [message],
          unreadCount: 0,
          participants: [username, data.recipient]
        };
        return [...prevChats, newChat];
      }
    });
  };

  const handleGroupMessage = (data) => {
    const chatId = `group-${data.groupId}`;
    const message = {
      username: data.username,
      content: data.content,
      timestamp: data.timestamp || Date.now(),
      type: 'group'
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              unreadCount: (activeChat !== chatId && data.username !== username) ? chat.unreadCount + 1 : 0
            }
          : chat
      )
    );
  };

  const handleGroupCreated = (data) => {
    const chatId = `group-${data.groupId}`;
    const newChat = {
      id: chatId,
      name: data.groupName,
      type: 'group',
      messages: [{
        username: 'System',
        content: `Group "${data.groupName}" created by ${data.creator}`,
        timestamp: Date.now(),
        type: 'system'
      }],
      unreadCount: 0,
      participants: data.participants,
      groupId: data.groupId
    };

    setChats(prevChats => [...prevChats, newChat]);
  };

  const handleGroupMembershipChange = (data) => {
    const chatId = `group-${data.groupId}`;
    const action = data.type === 'user_joined' ? 'joined' : 'left';
    const message = {
      username: 'System',
      content: `${data.username} ${action} the group`,
      timestamp: Date.now(),
      type: 'system'
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
              participants: data.participants,
              unreadCount: activeChat !== chatId ? chat.unreadCount + 1 : 0
            }
          : chat
      )
    );
  };

  const handleInviteToGame = (targetUsername) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.sendGameInvitation(targetUsername);
    }
  };

  const getSentGameInvitations = () => {
    if (gameManagerRef.current) {
      return gameManagerRef.current.getSentInvitations();
    }
    return [];
  };

  const startPrivateChat = (targetUsername) => {
    const chatId = `private-${targetUsername}`;
    const existingChat = chats.find(chat => chat.id === chatId);

    if (!existingChat) {
      const newChat = {
        id: chatId,
        name: targetUsername,
        type: 'private',
        messages: [],
        unreadCount: 0,
        participants: [username, targetUsername]
      };
      setChats(prevChats => [...prevChats, newChat]);
    }

    setActiveChat(chatId);
    clearUnreadCount(chatId);
  };

  const startGroupChat = (groupName, selectedUsers) => {
    const groupId = `${Date.now()}`;

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'create_group',
        groupId,
        groupName,
        participants: selectedUsers
      };
      websocketRef.current.send(JSON.stringify(message));
    }

    setShowGroupModal(false);
  };

  const closeChat = (chatId) => {
    if (chatId === 'global') return;

    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));

    if (activeChat === chatId) {
      setActiveChat('global');
    }
  };

  const sendMessage = (messageData) => {
    const currentChat = chats.find(chat => chat.id === activeChat);
    if (!currentChat || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) return;

    let wsMessage;
    switch (currentChat.type) {
      case 'global':
        wsMessage = { type: 'broadcast', content: messageData.content };
        break;
      case 'private':
        wsMessage = { type: 'private', content: messageData.content, recipient: currentChat.name };
        break;
      case 'group':
        wsMessage = {
          type: 'group',
          content: messageData.content,
          groupId: currentChat.groupId || currentChat.id.split('-')[1]
        };
        break;
      default:
        console.error('Unknown chat type:', currentChat.type);
        return;
    }

    websocketRef.current.send(JSON.stringify(wsMessage));
  };

  const clearUnreadCount = (chatId) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    clearUnreadCount(chatId);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <div className="chat-manager">
      <div className="chat-sidebar">
        <ActiveUsers
          users={users}
          currentUsername={username}
          onStartPrivateChat={startPrivateChat}
          onStartGroupChat={() => setShowGroupModal(true)}
          activePrivateChats={chats.filter(chat => chat.type === 'private').map(chat => chat.name)}
          onInviteToGame={handleInviteToGame}
          sentGameInvitations={getSentGameInvitations()}
        />

        <ChatTabs
          chats={chats}
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          onCloseChat={closeChat}
        />
      </div>

      <div className="chat-main">
        {currentChat && (
          <Chat
            key={currentChat.id}
            chatname={currentChat.name}
            username={username}
            messages={currentChat.messages}
            sendMessage={sendMessage}
            connectionStatus={connectionStatus}
            isPrivateChat={currentChat.type === 'private'}
            onClosePrivateChat={currentChat.type === 'private' ? () => closeChat(currentChat.id) : null}
          />
        )}
      </div>

      {showGroupModal && (
        <GroupChatModal
          users={users.filter(user => user !== username)}
          onCreateGroup={startGroupChat}
          onClose={() => setShowGroupModal(false)}
        />
      )}

      <GameManager
        ref={gameManagerRef}
        username={username}
        websocketRef={websocketRef}
        connectionStatus={connectionStatus}
      />
    </div>
  );
};

export default ChatManager;
