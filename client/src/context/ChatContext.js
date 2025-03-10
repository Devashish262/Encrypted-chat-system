import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { messagesAPI } from '../utils/api';
import socketService from '../utils/socket';
import { useAuth } from './AuthContext';
import { encrypt, decrypt } from '../utils/encryption';

// Create context
const ChatContext = createContext();

// Custom hook to use the chat context
export const useChat = () => {
  return useContext(ChatContext);
};

// Provider component
export const ChatProvider = ({ children }) => {
  const { currentUser, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (currentUser && token) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversation(null);
    }
  }, [currentUser, token]);

  // Set up socket listeners
  useEffect(() => {
    if (!currentUser) return;

    // Handle incoming messages
    const unsubscribe = socketService.onMessage((message) => {
      // If message is for current conversation, add it to messages
      if (activeConversation && 
          (message.sender === activeConversation._id || 
           message.recipient === activeConversation._id)) {
        
        // Decrypt message if current user is recipient
        if (message.recipient === currentUser.id) {
          try {
            const decryptedContent = decrypt(
              message.content,
              message.iv,
              currentUser.publicKey // In a real app, this would be the private key
            );
            message.content = decryptedContent;
          } catch (error) {
            console.error('Error decrypting message:', error);
            message.content = 'Message could not be decrypted';
          }
        }
        
        setMessages(prevMessages => [...prevMessages, message]);
      }
      
      // Update conversations list with new message
      updateConversationWithMessage(message);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, activeConversation]);

  // Load all conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messagesAPI.getAllConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messagesAPI.getConversation(userId);
      setMessages(response.data);
      
      // Find and set active conversation
      const conversation = conversations.find(conv => conv._id === userId);
      setActiveConversation(conversation);
      
      // Update conversation to mark messages as read
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv._id === userId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (recipientId, content, priority = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find recipient
      const recipient = conversations.find(conv => conv._id === recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }
      
      // Send message via API
      const response = await messagesAPI.sendMessage({
        recipientId,
        content,
        priority
      });
      
      // Add message to current conversation
      const newMessage = {
        id: response.data.id,
        sender: currentUser.id,
        recipient: recipientId,
        content,
        priority,
        createdAt: response.data.createdAt,
        read: false
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Update conversations list
      updateConversationWithMessage(newMessage);
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send a message via socket
  const sendSocketMessage = (recipientId, content, priority = 0) => {
    try {
      // Check if socket is connected
      if (!socketService.isConnected()) {
        throw new Error('Socket not connected');
      }
      
      // Send message via socket
      socketService.sendMessage({
        recipientId,
        content,
        priority
      });
    } catch (error) {
      console.error('Error sending socket message:', error);
      setError('Failed to send message via socket');
      throw error;
    }
  };

  // Update conversations list with a new message
  const updateConversationWithMessage = useCallback((message) => {
    setConversations(prevConversations => {
      // Find if conversation exists
      const conversationIndex = prevConversations.findIndex(
        conv => conv._id === (message.sender === currentUser?.id ? message.recipient : message.sender)
      );
      
      if (conversationIndex === -1) {
        // If conversation doesn't exist, fetch all conversations
        loadConversations();
        return prevConversations;
      }
      
      // Create a copy of conversations
      const updatedConversations = [...prevConversations];
      
      // Update the conversation with the new message
      const conversation = { ...updatedConversations[conversationIndex] };
      conversation.lastMessage = message;
      
      // Increment unread count if message is not from current user and not in active conversation
      if (message.sender !== currentUser?.id && 
          (!activeConversation || activeConversation._id !== message.sender)) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      
      // Update the conversation in the list
      updatedConversations[conversationIndex] = conversation;
      
      // Move the conversation to the top
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
  }, [currentUser, activeConversation, loadConversations]);

  // Context value
  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    sendSocketMessage,
    setActiveConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 