import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useMessage } from "../context/MessageContext";
import { colors } from "../constants/primary";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";

const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const AllChatsScreen = ({ navigation }) => {
  const {
    conversations,
    setActiveChat,
    searchUsers,
    setMessages,
  } = useMessage();
  const { currentUser } = useAuth(); // Move this hook to component level
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  // Move getOtherParticipant function inside component and use currentUser from hook
  const getOtherParticipant = (conversation) => {
    return (
      conversation.participants.find((p) => p.user._id !== currentUser._id)
        ?.user || conversation.participants[0].user
    );
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      const results = await searchUsers(text);
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startNewChat = (user) => {
    //check if chat already exists
    const existingChat = conversations.find((c) =>{
      const otherParticipant = getOtherParticipant(c);
      return otherParticipant._id === user._id;
    });
    if (existingChat) {
      setActiveChat(existingChat);
      const otherParticipant = getOtherParticipant(existingChat);
      return navigation.navigate("single-chat", {
        conversationId: existingChat._id,
        receiverId: otherParticipant._id,
        username: otherParticipant.username,
        profileImage: otherParticipant.profileImage,
      });
    };
    navigation.navigate("single-chat", {
      receiverId: user._id,
      username: user.username,
      profileImage: user.profileImage,
    });
    setActiveChat(null);
    setMessages([]);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleChatPress = (conversation) => {
    setActiveChat(conversation);
    const otherParticipant = getOtherParticipant(conversation);
    navigation.navigate("single-chat", {
      conversationId: conversation._id,
      receiverId: otherParticipant._id,
      username: otherParticipant.username,
      profileImage: otherParticipant.profileImage,
    });
  };

  const insets=useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {isSearching ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 16
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => startNewChat(item)}
            >
              <Image
                source={{ uri: item.profileImage || defaultAvatar }}
                style={styles.avatar}
                cachePolicy={"memory-disk"}
              />
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 16
          }}
          renderItem={({ item }) => {
            const otherParticipant = getOtherParticipant(item);
            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => handleChatPress(item)}
              >
                <Image
                  source={{
                    uri: otherParticipant.profileImage || defaultAvatar,
                  }}
                  style={styles.avatar}
                  cachePolicy={"memory-disk"}
                />
                <View style={styles.chatInfo}>
                  <Text style={styles.username}>
                    {otherParticipant.username}
                  </Text>
                  <Text style={styles.lastMessage}>
                    {item.lastMessage?.content || "Start a conversation"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
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
  chatList: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
});

export default AllChatsScreen;
