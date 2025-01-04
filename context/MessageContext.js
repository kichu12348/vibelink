import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import * as Notifications from "expo-notifications";
import axios from "axios";
import io from "socket.io-client";
import { endPoint as API_URL } from "../constants/endpoints";
import { uploadFile } from "../utils/fileUpload";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useError } from "./ErrorContext";

// Set up notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  //console.log(1);
  let token=null;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    //console.log(2);
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === "granted") {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C", // LED light color
        });
      }
     
    }
  } else {
    return null;
  }
  return token;
}
const MessageContext = createContext();

export function MessageProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser, token } = useAuth();
  const [socket, setSocket] = useState(null);


  const {showError}=useError();

  // Register once and optionally send token to your backend
  useEffect(() => {
    let timeoutId;
    
    const handleRegister = async () => {
      if (currentUser) {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await axios.post(
              `${API_URL}/api/users/push-token`,
              { token: pushToken },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch (error) {
          console.log(
            "Error handling push registration:",
            error.response?.data || error.message
          );
        }
      } else {
        timeoutId = setTimeout(handleRegister, 5000);
      }
    };

    handleRegister();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [token]);

  // Initialize socket once when provider mounts
  useEffect(() => {
    if (!currentUser?._id) return;

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join", currentUser._id);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser?._id]);

  // Handle messages and notifications separately
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = async ({ message, conversation }) => {
      // Update messages if in current chat
      if (activeChat?._id === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }

      // Update conversations list
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c._id === conversation._id);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        }
        return [conversation, ...prev];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, currentUser, activeChat]);

  // API functions
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(data);
    } catch (error) {
      console.log("Error fetching conversations:", error.response?.data || error.message);
    }
  }, [token]);

  const fetchMessages = useCallback(
    async (conversationId) => {
      try {
        if (!conversationId) {
          console.log("No conversationId provided");
          return;
        }

        const { data } = await axios.get(
          `${API_URL}/api/messages/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.log(
          "Error fetching messages:",
          error.response?.data || error.message
        );
        setMessages([]);
      }
    },
    [token]
  );

  const sendMessage = async (
    conversationId,
    content,
    receiverId,
    media,
    sharedPost = null
  ) => {
    try {
      if (!content.trim() && !media && !sharedPost) return;

      const { data } = await axios.post(
        `${API_URL}/api/messages`,
        {
          conversationId,
          content: content.trim(),
          receiverId,
          media,
          sharedPost: sharedPost?._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      if (!conversationId) {
        setConversations((prev) => [data.conversation, ...prev]);
      }
      setMessages((prev) => [...prev, data.message]);
      return data;
    } catch (error) {
      showError(error.response?.data?.message || error.message);
      return null;
    }
  };

  const searchUsers = async (query) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/users/search?q=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data;
    } catch (error) {
      return [];
    }
  };

  async function uploadImageToServer(imageUri) {
    const fileName = await uploadFile({ uri: imageUri });
    const res = await axios.post(`${API_URL}/api/messages/upload`, {
      filename: fileName,
    });
    return res.data.url;
  }

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  return (
    <MessageContext.Provider
      value={{
        conversations,
        activeChat,
        setActiveChat,
        messages,
        setMessages,
        sendMessage,
        fetchConversations,
        fetchMessages,
        searchUsers,
        socket,
        uploadImageToServer,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
