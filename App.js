import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostProvider, usePost } from "./context/PostContext";
import AuthStack from "./navigation/AuthStack";
import TabNavigator from "./navigation/TabNavigator";
import { fontSizes } from "./constants/primary";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Image,
} from "react-native";
import { MessageProvider, useMessage } from "./context/MessageContext";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { enableScreens } from "react-native-screens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorProvider, useError } from "./context/ErrorContext";
import { StoryProvider } from "./context/StoryContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { endPoint } from "./constants/endpoints";
import { JournalProvider } from "./context/JournalContext";
import { BackgroundProvider } from "./context/ChatBackgroundContext";
import CatType from "./assets/cat-type.gif";

enableScreens(false);

const Stack = createStackNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppNavigator() {
  const {
    token,
    currentUser,
    authChecking,
    setUserModalData,
    setIsUserModalOpen,
  } = useAuth();
  const { error, isError, clearError } = useError();
  const { theme } = useTheme();
  const { setActiveChat, setIsDmsModalOpen, socket } = useMessage();
  const { getPost, setIsPostOpen, setPostContent, getPostCommentUser } =
    usePost();

  const [isUpdated, setIsUpdated] = React.useState(true);
  const [updateLink, setUpdateLink] = React.useState(null);
  const [isFetchingUpdateLink, setIsFetchingUpdateLink] = React.useState(false);

  async function handlePostNotifClicked(postId) {
    if (!postId) return;
    const post = await getPost(postId);
    if (post) {
      setPostContent(post);
      setIsPostOpen(true);
    }
  }

  async function handleFollowerNotifClicked(userId) {
    const user = await getPostCommentUser(userId);
    if (user) {
      setUserModalData(user);
      setIsUserModalOpen(true);
    }
  }

  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const {
          conversationId,
          receiverId,
          username,
          profileImage,
          participants,
          PostId,
          type,
          userId,
        } = response.notification.request.content.data || {};
        if (PostId) {
          handlePostNotifClicked(PostId);
        }
        if (conversationId && receiverId) {
          if (!socket || authChecking)
            await Promise.resolve(
              new Promise((resolve) => setTimeout(() => resolve(), 3000))
            );
          setActiveChat({
            _id: conversationId,
            participants,
            receiverId,
            username,
            profileImage,
          });
          setIsDmsModalOpen(true);
        }
        if (type && type === "follow") {
          handleFollowerNotifClicked(userId);
        }
      }
    );
    return () => subscription.remove();
  }, []);

  React.useLayoutEffect(() => {
    async function checkIfUpdateLinkExists() {
      if (isUpdated) return;
      try {
        setIsFetchingUpdateLink(true);
        const { data } = await axios.get(
          endPoint + "/api/latest-app-version-link"
        );
        if (data && data.link) {
          setUpdateLink(data.link);
        }
        setIsFetchingUpdateLink(false);
      } catch (error) {
        console.log("Error fetching update link:", error.message);
      }
    }
    checkIfUpdateLinkExists();
  }, []);

  const redirectToUpdateLink = async () => {
    if (updateLink) {
      await Linking.openURL(updateLink);
    }
  };

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.card,
      text: theme.textPrimary,
      primary: theme.primary,
    },
  };

  if (authChecking) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Image source={CatType} style={{ width: 200, height: 200 }} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={token && currentUser ? "MainApp" : "Auth"}
        >
          <Stack.Screen name="Auth" component={AuthStack} />
          <Stack.Screen name="MainApp" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
      <Modal
        visible={isError}
        animationType="fade"
        transparent
        onRequestClose={clearError}
        hardwareAccelerated
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
      >
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: `${theme.background}aa` },
          ]}
        >
          <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
            <View style={[styles.errorIcon, { backgroundColor: theme.error }]}>
              <Text
                style={[styles.errorIconText, { color: theme.textPrimary }]}
              >
                !
              </Text>
            </View>
            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
              Error
            </Text>
            <Text style={[styles.errorMessage, { color: theme.textPrimary }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={clearError}
              style={[styles.closeButton, { backgroundColor: theme.error }]}
            >
              <Text
                style={[styles.closeButtonText, { color: theme.textPrimary }]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={!isUpdated} transparent hardwareAccelerated>
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: `${theme.background}aa` },
          ]}
        >
          <View style={[styles.errorBox, { backgroundColor: theme.card }]}>
            <AntDesign name="warning" size={60} color={"#FFCC00"} />
            <Text
              style={[
                styles.errorTitle,
                { color: theme.textPrimary, marginTop: 10 },
              ]}
            >
              Please Download the Latest Version
            </Text>
            <TouchableOpacity
              onPress={redirectToUpdateLink}
              disabled={isFetchingUpdateLink || !updateLink}
              style={[
                styles.closeButton,
                (isFetchingUpdateLink || !updateLink) && { opacity: 0.5 },
              ]}
            >
              <MaterialIcons
                name="download"
                size={44}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    const setNavigationBarColor = async () => {
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("hidden");
      }
    };
    setNavigationBarColor();
  }, []);

  React.useLayoutEffect(() => {
    // Check for updates
    async function checkForUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log("Update error:", error.message);
      }
    }

    checkForUpdates();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex1}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorProvider>
            <AuthProvider>
              <PostProvider>
                <MessageProvider>
                  <StoryProvider>
                    <JournalProvider>
                      <BackgroundProvider>
                        <StatusBar
                          style="light"
                          backgroundColor="transparent"
                          translucent
                        />
                        <AppNavigator />
                      </BackgroundProvider>
                    </JournalProvider>
                  </StoryProvider>
                </MessageProvider>
              </PostProvider>
            </AuthProvider>
          </ErrorProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  flex1: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  errorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorIconText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  errorTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: fontSizes.lg,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
    minWidth: 120,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
  },
});
