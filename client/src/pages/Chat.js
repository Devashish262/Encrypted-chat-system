import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
  const { currentUser, logout, updateStatus } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    loadConversations, 
    loadMessages, 
    sendMessage, 
    setActiveConversation 
  } = useChat();
  
  const [messageText, setMessageText] = useState('');
  const [messagePriority, setMessagePriority] = useState(0);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !activeConversation) return;
    
    try {
      await sendMessage(
        activeConversation._id,
        messageText,
        parseInt(messagePriority)
      );
      
      // Clear input
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (status) => {
    try {
      await updateStatus(status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {getInitials(currentUser?.username)}
            </div>
            <div>
              <div>{currentUser?.username}</div>
              <div className="user-status">
                <div className={`status-indicator status-${currentUser?.status || 'offline'}`}></div>
                <select 
                  value={currentUser?.status || 'offline'} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn">Logout</button>
        </div>
        
        <div className="conversation-list">
          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conversation => (
              <div 
                key={conversation._id}
                className={`conversation-item ${activeConversation?._id === conversation._id ? 'active' : ''}`}
                onClick={() => loadMessages(conversation._id)}
              >
                <div className="conversation-avatar">
                  {getInitials(conversation.username)}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <div className="conversation-name">{conversation.username}</div>
                    {conversation.lastMessage && (
                      <div className="conversation-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </div>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <div className="conversation-last-message">
                      {conversation.lastMessage.content}
                    </div>
                  )}
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="unread-badge">{conversation.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="chat-main">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <div className="conversation-avatar">
                {getInitials(activeConversation.username)}
              </div>
              <div>
                <div className="conversation-name">{activeConversation.username}</div>
                <div className="user-status">
                  <div className={`status-indicator status-${activeConversation.status || 'offline'}`}></div>
                  <span>{activeConversation.status || 'offline'}</span>
                </div>
              </div>
            </div>
            
            <div className="chat-messages">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(message => (
                  <div 
                    key={message._id || message.id}
                    className={`message ${message.sender === currentUser.id ? 'message-sent' : 'message-received'}`}
                  >
                    {parseInt(message.priority) > 0 && (
                      <div className="message-priority">{message.priority}</div>
                    )}
                    <div>{message.content}</div>
                    <div className="message-time">{formatTime(message.createdAt)}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input" onSubmit={handleSendMessage}>
              <div className="input-container">
                <select 
                  className="priority-select"
                  value={messagePriority}
                  onChange={(e) => setMessagePriority(e.target.value)}
                >
                  <option value="0">Normal</option>
                  <option value="1">Important</option>
                  <option value="2">Urgent</option>
                  <option value="3">Critical</option>
                </select>
                <input
                  type="text"
                  className="message-input"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit" className="send-button">
                  →
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👋</div>
            <h2>Welcome to Encrypted Chat</h2>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 