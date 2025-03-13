import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef
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
  let token = null;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      if (status !== "granted") {
        return [null, "Notification permission not granted"];
      }
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
    return [null, "Must use physical device for Push Notifications"];
  }
  return [token, null];
}
const MessageContext = createContext();

export function MessageProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isDmsModalOpen, setIsDmsModalOpen] = useState(false);
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);

  const messagesMap = useRef(new Map());

  const { showError } = useError();

  let timeoutId;

  const handleRegisterPushNotification = async () => {
    if (currentUser) {
      try {
        const [pushToken, error] = await registerForPushNotificationsAsync();
        if (error) return [error, null];
        if (pushToken) {
          await axios.post(
            `${API_URL}/api/users/push-token`,
            { token: pushToken },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        clearTimeout(timeoutId);
        return [null, pushToken];
      } catch (error) {
        const errorMessage = error.response?.data.message || error.message;
        return [errorMessage, null];
      }
    } else {
      timeoutId = setTimeout(handleRegister, 5000);
    }
  };

  // Register once and optionally send token to your backend
  useEffect(() => {
    handleRegisterPushNotification();

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

    const handleMessageForMap = ({ message, conversation }) => {
      if (message) {
        const checkIfMessageExists = messagesMap.current.get(conversation._id);
        if (checkIfMessageExists) {
          messagesMap.current.set(conversation._id, [
            ...checkIfMessageExists,
            message,
          ]);
        } else messagesMap.current.set(conversation._id, [message]);
      }
    };

    const handleNewMessage = async ({ message, conversation }) => {
      // Update messages map
      if (message) handleMessageForMap({ message, conversation });

      // Update messages if in current chat
      if (activeChat?._id === conversation._id) {
        setMessages((prev) => {
          return [...prev, message];
        });
      }

      // Update conversations list
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c._id === conversation._id);
        if (existingIndex > -1) {
          const filtered = prev.filter(
            (c) => c._id.toString() !== conversation._id.toString()
          );
          return [conversation, ...filtered];
        }
        return [conversation, ...prev];
      });
    };

    conversations.map((c) => {
      socket.emit("joinChat", c._id.toString());
    });

    socket.on("newMessage", handleNewMessage);

    socket.on("deletedMessage", ({ messageId, conversationId }) => {
      setMessages((prev) => {
        const filteredMessages = prev.filter((m) => m._id !== messageId);
        return filteredMessages;
      });
      //setConversations
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id.toString() === conversationId);
        const lastMessages = messagesMap.current.get(conversationId); // get last message from map
        const newLastMessage = lastMessages[lastMessages.length - 1]; // get last message from map
        if (idx > -1) {
          prev[idx].lastMessage = newLastMessage;
          return prev;
        }
        return prev;
      });
      const checkIfMessageExistsInMap = messagesMap.current.get(conversationId);
      if (checkIfMessageExistsInMap) {
        const filteredMessages = checkIfMessageExistsInMap.filter(
          (m) => m._id !== messageId
        );
        if (filteredMessages.length < 10)
          fetchMessages(conversationId).then((data) =>
            messagesMap.current.set(conversationId, data)
          );
        else messagesMap.current.set(conversationId, filteredMessages);
      }
    });

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("deletedMessage");
      conversations.map((c) => {
        socket.emit("leaveChat", c._id.toString());
      });
    };
  }, [socket, currentUser, activeChat]);

  // API functions
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsFetchingConversations(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(data);
      await Promise.all(
        data.map(async (c) => {
          const data = await fetchMessages(c._id, "nope", true);
          messagesMap.current.set(c._id, data);
        })
      );
      setIsFetchingConversations(false);
    } catch (error) {
      setIsFetchingConversations(false);
      console.log(
        "Error fetching conversations:",
        error.response?.data || error.message
      );
    }
  }, [token]);

  const fetchMessages = useCallback(
    async (conversationId, topMessageId = "nope", mapFetch = false) => {
      if (topMessageId === "nope") {
        const hasMessagesInMap = messagesMap.current.get(conversationId);
        if (hasMessagesInMap) {
          setMessages(hasMessagesInMap);
          //Check if there are messages in server that are not in map
          if (!mapFetch) {
            const { data } = await axios.get(
              `${API_URL}/api/messages/${conversationId}/nope`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (data.length > 0) {
              filteredData = data.filter(
                (m) => !hasMessagesInMap.some((m2) => m2._id.toString() === m._id.toString())
              );
              setMessages((prev) => {
                return [...prev, ...filteredData];
              });
              messagesMap.current.set(conversationId, [...hasMessagesInMap, ...filteredData]);
            }
          }
          return hasMessagesInMap;
        }
      }
      try {
        if (!conversationId) return;
        const { data } = await axios.get(
          `${API_URL}/api/messages/${conversationId}/${topMessageId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (Array.isArray(data)) {
          if (topMessageId === "nope") {
            setMessages(data);
          } else if (
            topMessageId &&
            data.length > 0 &&
            topMessageId !== "nope"
          ) {
            setMessages((prev) => {
              return [...data, ...prev];
            });
          }
          return data;
        } else {
          setMessages([]);
          return [];
        }
      } catch (error) {
        console.log(
          "Error fetching messages:",
          error.response?.data || error.message
        );
        setMessages([]);
        return [];
      }
    },
    [token]
  );

  useEffect(() => {
    let timeout;
    const handleConvoDownload = async () => await fetchConversations();
    if (token && currentUser) {
      handleConvoDownload();
      if (timeout) clearTimeout(timeout);
    } else {
      timeout = setTimeout(handleConvoDownload, 5000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [token]);

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

      setConversations((p) => {
        const idx = p.findIndex((c) => c._id.toString() === conversationId);
        if (idx > -1) {
          const filtered = p.filter((c) => c._id.toString() !== conversationId);
          return [data.conversation, ...filtered];
        }
        return [data.conversation, ...p];
      });
      setMessages((prev) => {
        const newMessageArr = [...prev, data.message];
        messagesMap.current.set(conversationId, newMessageArr);
        return newMessageArr;
      });
      return data;
    } catch (error) {
      showError(error.response?.data?.message || error.message);
      return null;
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (m) => m._id.toString() !== messageId
        );
        messagesMap.current.set(activeChat._id, filteredMessages);
        return filteredMessages;
      });
    } catch (error) {
      showError(error.response?.data?.message || error.message);
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

  async function deleteImageFromServer(imageUrl) {
    try {
      await axios.post(`${API_URL}/api/upload/delete`, {
        uri: imageUrl,
      });
    } catch (error) {
      showError(error.response?.data?.message || error.message);
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, token]);

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
        deleteMessage,
        handleRegisterPushNotification,
        isDmsModalOpen,
        setIsDmsModalOpen,
        deleteImageFromServer,
        isFetchingConversations,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
