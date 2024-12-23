import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import { colors } from "../constants/primary";
import { useAuth } from "../context/AuthContext";

const Stack = createStackNavigator();

export default function AuthStack({ navigation }) {
  const {token,currentUser} = useAuth();

  React.useEffect(() => {
    if (token && currentUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
    }
  } , [token,currentUser]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}
