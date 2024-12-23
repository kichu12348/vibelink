import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import io from 'socket.io-client';
import { endPoint as API_URL } from '../constants/endpoints';


// Set up notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MessageContext = createContext();

export function MessageProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser, token } = useAuth();
  const [socket, setSocket] = useState(null);

  // Socket connection
  useEffect(() => {
    if (!currentUser?._id) return;

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.emit('join', currentUser._id);
    
    newSocket.on('newMessage', async ({ message, conversation }) => {
      // Update messages if in current chat
      if (activeChat?._id === conversation._id) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c._id === conversation._id);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        }
        return [conversation, ...prev];
      });

      // Show notification
      if (activeChat?._id !== conversation._id) {
        const sender = conversation.participants.find(
          p => p.user._id !== currentUser._id
        )?.user;

        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: sender?.username || 'New message',
              body: message.content || 'Sent you a message',
              data: { conversationId: conversation._id },
            },
            trigger: null,
          });
        }
      }
    });

    return () => newSocket.disconnect();
  }, [currentUser, activeChat]);

  // API functions
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(data);
    } catch (error) {
      console.log('Error fetching conversations:', error.message);
    }
  }, [token]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      if (!conversationId) {
        console.log('No conversationId provided');
        return;
      }
      
      const { data } = await axios.get(`${API_URL}/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.log('Error fetching messages:', error.response?.data || error.message);
      setMessages([]);
    }
  }, [token]);

  const sendMessage = async (conversationId, content, receiverId) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/messages`, 
        { conversationId, content, receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      if (!conversationId) {
        setConversations(prev => [data.conversation, ...prev]);
      }
      setMessages(prev => [...prev, data.message]);
      return data;
    } catch (error) {
      console.log('Error sending message:', error.response?.data);
    }
  };

  const searchUsers = async (query) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  return (
    <MessageContext.Provider value={{
      conversations,
      activeChat,
      setActiveChat,
      messages,
      setMessages,
      sendMessage,
      fetchConversations,
      fetchMessages,
      searchUsers,
      socket
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
