import { View, Text, TouchableOpacity } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";

const defaultAvatar =
  "https://storage.googleapis.com/vibelink-pub-bucket2/default-user.webp";

const RenderItem = memo(
  ({
    styles,
    item,
    startNewChat,
    isSearchResult = false,
    handleChatPress,
    getOtherParticipant,
  }) => {
    // If it's a search result, use item directly, otherwise get other participant
    const user = isSearchResult ? item : getOtherParticipant(item);

    const onPress = () => {
      if (isSearchResult) {
        startNewChat(user);
      } else {
        handleChatPress(item);
      }
    };

    const content =
    item.lastMessage?.content?
    item.lastMessage?.content.length > 20
      ? item.lastMessage?.content.slice(0, 20) + "..."
      : item.lastMessage?.content
    : "Start a conversation";

    return (
      <TouchableOpacity style={styles.chatItem} onPress={onPress}>
        <Image
          source={{ uri: user.profileImage || defaultAvatar }}
          style={styles.avatar}
          cachePolicy={"memory-disk"}
          transition={200} // Fade in the image when it's loaded
        />
        <View style={styles.chatInfo}>
          <Text style={styles.username}>{user.username}</Text>
          {!isSearchResult && (
            <Text style={styles.lastMessage}>
              {content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

//RenderItem.displayName = "RenderItem"; // Add a display name for React DevTools

export default RenderItem;
