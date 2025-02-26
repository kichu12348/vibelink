import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { globalStyles } from "../constants/styles";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function SignupScreen({ navigation }) {
  const { signUp, loading, error, setError } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setError("Please fill in all fields");
      return;
    }

    const success = await signUp({ email, password, username });
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
    }
  };

  return (
    <View
      style={[
        globalStyles.container,
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Create Account
      </Text>
      <Text style={[styles.subtitle, { color: theme.textPrimary }]}>
        Sign up to get started
      </Text>

      <View style={styles.form}>
        <TextInput
          style={[
            globalStyles.input,
            { color: theme.textPrimary, backgroundColor: theme.card },
          ]}
          placeholder="Username"
          placeholderTextColor={theme.textSecondary}
          onChangeText={setUsername}
          value={username}
        />
        <TextInput
          style={[
            globalStyles.input,
            { color: theme.textPrimary, backgroundColor: theme.card },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            globalStyles.input,
            { color: theme.textPrimary, backgroundColor: theme.card },
          ]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        {error && (
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          style={[
            globalStyles.button,
            styles.signupButton,
            {
              backgroundColor: theme.primary,
            },
            loading && styles.disabledButton,
          ]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.textPrimary} />
          ) : (
            <Text
              style={[globalStyles.buttonText, { color: theme.textPrimary }]}
            >
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.loginLink}
        >
          <Text style={[styles.loginText, { color: theme.textPrimary }]}>
            Already have an account?{" "}
            <Text style={[styles.loginTextBold, { color: theme.primary }]}>
              Login
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  signupButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  loginLink: {
    marginTop: 16,
    alignItems: "center",
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    marginBottom: 16,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
