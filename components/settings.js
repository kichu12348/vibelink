import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useRef } from "react";
import { colors } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const Settings = ({ close }) => {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  async function handleSignOut() {
    close();
    await signOut();
  }

  const handleFooterPress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      spinAnim.setValue(0);
    });
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.text, { fontWeight: "bold" }]}>Settings</Text>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={30} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <TouchableOpacity onPress={handleSignOut}>
          <View style={styles.signOutButton}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={colors.textPrimary}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleFooterPress}>
        <Animated.Text
          style={[
            styles.footerText,
            {
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            },
          ]}
        >
          made wiz ❤️ by Kichu
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  header: {
    elevation: 0,
    shadowOpacity: 0,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    alignSelf: "flex-start",
    padding: 15,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  signOutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
});
