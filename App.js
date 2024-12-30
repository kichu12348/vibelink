import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
import AuthStack from "./navigation/AuthStack";
import TabNavigator from "./navigation/TabNavigator";
import { colors } from "./constants/primary";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { Platform, StyleSheet } from "react-native";
import { MessageProvider } from "./context/MessageContext";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { enableScreens } from "react-native-screens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";

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

  if (authChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={token && currentUser ? "MainApp" : "Auth"}
      >
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="MainApp" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  React.useEffect(() => {
    const setNavigationBarColor = async () => {
      await NavigationBar.setVisibilityAsync("hidden");
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
        <AuthProvider>
          <PostProvider>
            <MessageProvider>
              <StatusBar style="light" backgroundColor={colors.card} />
              <AppNavigator />
            </MessageProvider>
          </PostProvider>
        </AuthProvider>
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
  },
});
