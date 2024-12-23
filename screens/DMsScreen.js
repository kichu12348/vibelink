import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/primary";
import { useMessage } from "../context/MessageContext";
import { useAuth } from "../context/AuthContext";


const defaultAvatar ="https://storage.googleapis.com/vibe-link-public/default-user.jpg";

export default function DMsScreen({ route, navigation }) {
  navigation.on
  const { conversationId, receiverId, username, profileImage } = route.params;
  const { messages, sendMessage, fetchMessages, activeChat, socket,setActiveChat } = useMessage();
  const { currentUser } = useAuth();
  const [text, setText] = useState("");

  const scrollViewRef = React.useRef();

  useEffect(() => {
    if (conversationId && socket) {
      fetchMessages(conversationId);
      socket.emit('joinChat', conversationId);
      
      return () => {
        socket.emit('leaveChat', conversationId);
      };
    }
  }, [conversationId, socket]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionStart', (e) => {
      if(e.data.closing){
        setActiveChat(null);
      }
    });

    return unsubscribe;
  }, [navigation]);


  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(conversationId, text.trim(), receiverId);
    setText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
            setActiveChat(null);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeChat?.participants.find(p => p.user._id !== currentUser._id)?.user.username || username||"Error :("}
        </Text>
        <Image
          source={{ uri: profileImage || defaultAvatar }}
          style={styles.profileImage}
        />
      </View>
    <KeyboardAvoidingView style={{flex: 1}} 
          behavior={Platform.OS === "ios" ? "padding" : undefined} 
          keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.messagesContainer}
      onContentSizeChange={() => {scrollViewRef.current.scrollToEnd({ animated: true })}}
      ref={scrollViewRef}
      >
        {messages.map((message) => (
          <View
            key={message._id}
            style={[
              styles.messageBubble,
              message.sender._id === currentUser._id && styles.ownMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
            <Text style={styles.timestamp}>
              {new Date(message.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    backgroundColor: colors.card,
    padding: 12,
    marginBottom: 8,
    borderRadius: 16,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  ownMessage: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: colors.card,
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: 60,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 20,
  },
});

