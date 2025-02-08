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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BlurView } from "expo-blur";

export default function LikedUsersModal({
  visible,
  close,
  users,
  onProfilePress,
}) {
  if (!visible) return null;

  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.background,
      width: "100%",
      height: "70%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 30,
    },
    mainContainer: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.card,
      paddingBottom: 10,
      marginBottom: 10,
      position: "relative",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textPrimary,
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
      borderBottomColor: theme.card,
    },
    userImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: theme.card,
    },
    userName: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    itsYou: {
      color: theme.textSecondary,
      marginLeft: 8,
    },
    
  });

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
    <BlurView
      intensity={20}
      tint={"dark"}
      style={styles.mainContainer}
      experimentalBlurMethod="dimezisBlurView"
      blurReductionFactor={24}
    >
      <View
        style={[
          styles.modalContainer,
          { paddingBottom: insets.bottom},
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Liked By</Text>
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={users}
          keyExtractor={(item, index) => item?._id || index.toString()}
          renderItem={renderUserItem}
        />
      </View>
    </BlurView>
  );
}
