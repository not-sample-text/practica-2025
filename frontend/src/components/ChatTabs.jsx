import React from "react";
import "../stylecomponents/ChatTabs.css";

const ChatTabs = ({ chats, activeChat, onChatSelect, onCloseChat }) => {
  const getChatIcon = (chatType) => {
    switch (chatType) {
      case 'private':
        return '💬';
      case 'group':
        return '👥';
      default:
        return '🌐';
    }
  };

  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.name;
    }
    return chat.name;
  };

  return (
    <div className="chat-tabs">
      <div className="chat-tabs-header">
        <h3>Chats</h3>
      </div>
      
      <div className="chat-tabs-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-tab ${activeChat === chat.id ? 'active' : ''}`}
            onClick={() => onChatSelect(chat.id)}
          >
            <div className="chat-tab-content">
              <div className="chat-tab-info">
                <span className="chat-tab-icon">{getChatIcon(chat.type)}</span>
                <span className="chat-tab-name">{getChatDisplayName(chat)}</span>
              </div>
              
              <div className="chat-tab-actions">
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                )}
                
                {chat.type !== 'global' && (
                  <button
                    className="close-tab-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseChat(chat.id);
                    }}
                    title="Close chat"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {chat.type === 'group' && (
              <div className="chat-tab-participants">
                {chat.participants?.slice(0, 3).join(', ')}
                {chat.participants?.length > 3 && ` +${chat.participants.length - 3} more`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatTabs;