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
import { Platform } from "react-native";
import { MessageProvider } from "./context/MessageContext";

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

function AppNavigator() {
  const { token, currentUser } = useAuth();
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={token && currentUser ? "MainApp" : "Auth"}
        >
          <Stack.Screen name="Auth" component={AuthStack} />
          <Stack.Screen name="MainApp" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  const setNavigationBarColor = async () => {
    await NavigationBar.setVisibilityAsync("hidden");
  };

  React.useLayoutEffect(() => {
    if (Platform.OS === "android") setNavigationBarColor();
  }, []);

  return (
    <AuthProvider>
      <PostProvider>
        <MessageProvider>
          <StatusBar style="light" backgroundColor={colors.card} />
          <AppNavigator />
        </MessageProvider>
      </PostProvider>
    </AuthProvider>
  );
}
