import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { globalStyles } from "../constants/styles";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const success = await signIn({ email, password });
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
    }
  };

  return (
    <View style={[globalStyles.container, styles.container]}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <View style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={[globalStyles.input, error && styles.inputError]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[globalStyles.input, error && styles.inputError]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <TouchableOpacity
          style={[
            globalStyles.button,
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={globalStyles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <Text style={styles.signupTextBold}>Sign up</Text>
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
  loginButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
    ...Platform.select({
      ios: {
        ShadowColor: colors.primary,
        ShadowOffset: { width: 0, height: 4 },
        ShadowOpacity: 0.3,
        ShadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
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
  errorContainer: {
    backgroundColor: `${colors.error}20`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  testButton: {
    padding: 8,
    alignItems: "center",
  },
  testButtonText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
  },
  signupLink: {
    marginTop: 16,
    alignItems: "center",
  },
  signupText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  signupTextBold: {
    color: colors.primary,
    fontWeight: "bold",
  },
});
