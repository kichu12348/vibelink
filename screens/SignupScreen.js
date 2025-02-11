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

export default function SignupScreen({ navigation }) {
  const { signUp, loading, error, setError } = useAuth();
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
    <View style={[globalStyles.container, styles.container]}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={styles.form}>
        <TextInput
          style={globalStyles.input}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          onChangeText={setUsername}
          value={username}
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            globalStyles.button,
            styles.signupButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={globalStyles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginTextBold}>Login</Text>
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
    color: colors.textPrimary,
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
