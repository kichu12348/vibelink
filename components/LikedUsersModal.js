import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function LikedUsersModal({
  visible,
  close,
  users,
  onProfilePress,
}) {
  if (!visible) return null;

  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  
  const renderUserItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => onProfilePress({ user: item })}
      >
        <Image
          source={
            item.profileImage
              ? { uri: item.profileImage }
              : require("../defaultImages/default-user.jpg")
          }
          style={styles.userImage}
        />
        <Text style={styles.userName}>@{item.username}</Text>
        {item._id === currentUser._id && (
          <Text style={styles.itsYou} numberOfLines={1}>
            (itzzz You!! (≧▽≦))
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.modalContainer,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Liked By</Text>
        <TouchableOpacity style={styles.closeButton} onPress={close}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item, index) => item?._id || index.toString()}
        renderItem={renderUserItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
    paddingBottom: 10,
    marginBottom: 10,
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 0,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  userName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  itsYou: {
    color: colors.textSecondary,
    marginLeft: 8,
  },
});
