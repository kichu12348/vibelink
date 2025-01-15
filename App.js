import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
import AuthStack from "./navigation/AuthStack";
import TabNavigator from "./navigation/TabNavigator";
import { colors, fontSizes } from "./constants/primary";
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
  ActivityIndicator,
} from "react-native";
import { MessageProvider } from "./context/MessageContext";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { enableScreens } from "react-native-screens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorProvider, useError } from "./context/ErrorContext";
import { StoryProvider } from "./context/StoryContext";

enableScreens();

const Stack = createStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    primary: colors.primary,
  },
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppNavigator() {
  const { token, currentUser, authChecking } = useAuth();
  const { error, isError, clearError } = useError();

  if (authChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={MyTheme}>
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
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorBox}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Dismiss</Text>
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
        <ErrorProvider>
          <AuthProvider>
            <PostProvider>
              <MessageProvider>
                <StoryProvider>
                  <StatusBar style="light" backgroundColor={colors.card} />
                  <AppNavigator />
                </StoryProvider>
              </MessageProvider>
            </PostProvider>
          </AuthProvider>
        </ErrorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  errorBox: {
    backgroundColor: colors.card,
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
    backgroundColor: colors.error,
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
    color: colors.error,
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
    minWidth: 120,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: fontSizes.lg,
    fontWeight: "600",
  },
});
