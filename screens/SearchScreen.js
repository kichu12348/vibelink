import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import { fontSizes } from "../constants/primary";
import axios from "axios";
import { endPoint } from "../constants/endpoints";
import ViewUserOProfile from "../utils/ViewUserOProfile";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const inset = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { theme } = useTheme();

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      try {
        const { data } = await axios.get(
          `${endPoint}/api/users/search?q=${text}`
        );
        setSearchResults(data);
      } catch (error) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => setSelectedUser(item)}
    >
      <Image
        source={
          item.profileImage
            ? { uri: item.profileImage }
            : require("../defaultImages/default-user.jpg")
        }
        style={styles.userImage}
        cachePolicy={"memory-disk"}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        {item.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      margin: 16,
      padding: 12,
      borderRadius: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
    },
    resultsList: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.card,
    },
    userImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: fontSizes.md,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    userBio: {
      fontSize: fontSizes.sm,
      color: theme.textSecondary,
    },
  });

  return (
    <View style={[styles.container, { paddingTop: inset.top + 50 }]}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.resultsList,
          {
            paddingBottom: tabBarHeight + inset.bottom + 16,
          },
        ]}
      />

      <Modal
        visible={!!selectedUser}
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
        transparent={true}
      >
        {selectedUser && (
          <ViewUserOProfile
            user={selectedUser}
            close={() => setSelectedUser(null)}
          />
        )}
      </Modal>
    </View>
  );
};

export default SearchScreen;
