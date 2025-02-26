import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import ViewUserOProfile from "../utils/ViewUserOProfile";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackground } from "../context/ChatBackgroundContext";

const defaultAvatar =
  "https://storage.googleapis.com/vibelink-pub-bucket2/default-user.webp";

export default function ChatSettings({
  OtherUser,
  close,
  chat,
  setBackground,
  background,
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { backgroundImages, changeBackgroundImage } = useBackground();

  const changeBackground = async (image) => {
    if (image === background?.id) return;
    const [newImage, error] = await changeBackgroundImage(image, chat?._id);
    if (error) {
      return console.log(error);
    }
    setBackground(newImage);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={close}>
          <Ionicons name="close" size={30} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <Image
            source={{ uri: OtherUser?.profileImage || defaultAvatar }}
            style={styles.profileImage}
            cachePolicy={"memory-disk"}
          />
          <Text
            style={[
              styles.username,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            {OtherUser?.username}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowUserProfile(true);
            }}
            style={[
              styles.viewProfileButton,
              {
                borderColor: theme.primary,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.primary,
                  },
                }),
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme.primary,
                },
              ]}
            >
              View Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.textPrimary,
            alignSelf: "center",
          },
        ]}
      >
        Background Images
      </Text>
      <ScrollView
        style={styles.settingsSection}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {backgroundImages.map(
          (image) =>
            image.id && (
              <TouchableOpacity
                key={image?.id}
                style={styles.settingItem}
                onPress={() => changeBackground(image?.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.imageBox,
                    background?.id === image?.id && {
                      borderWidth: 2,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Image
                    source={image.image}
                    style={[
                      styles.image,
                      background?.id === image?.id && {
                        opacity: 0.5,
                      },
                    ]}
                    cachePolicy={"memory-disk"}
                  />
                  {background?.id === image?.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={40}
                      color={theme.primary}
                      style={{
                        alignSelf: "center",
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={showUserProfile}
        onRequestClose={() => setShowUserProfile(false)}
        statusBarTranslucent
      >
        <ViewUserOProfile
          user={OtherUser}
          close={() => setShowUserProfile(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {},
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
    padding: 8,
    marginBottom: 16,
  },
  viewProfileButton: {
    paddingVertical: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: "60%",
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 5.62,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  settingsSection: {
    width: "100%",
    height: "60%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  settingItem: {
    width: "100%",
    paddingVertical: 14,
  },
  settingText: {
    fontSize: 16,
  },
  imageBox: {
    borderRadius: 10,
    width: "90%",
    height: 300,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    borderRadius: 10,
    position: "absolute",
    ...StyleSheet.absoluteFillObject,
  },
});
