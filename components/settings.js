import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import React, { useState, useCallback } from "react";
import Reanimated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  withSequence,
  withSpring,
  withRepeat,
} from "react-native-reanimated";
import { fontSizes } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../context/ThemeContext";
import Terms from "./terms&c";

const Settings = ({ close }) => {
  const { signOut } = useAuth();
  const { handleRegisterPushNotification } = useMessage();
  const insets = useSafeAreaInsets();
  const { theme, switchTheme, currentTheme } = useTheme();
  const [showTerms, setShowTerms] = useState(false);
  const [showGoofyAnim, setShowGoofyAnim] = useState(false);
  const [previousTheme, setPreviousTheme] = useState(theme);
  const [isAnimating, setIsAnimating] = useState(false);
  const themeProgress = useSharedValue(0);
  const [easterEggCount, setEasterEggCount] = useState(0);
  const footerScale = useSharedValue(1);
  const footerRotate = useSharedValue(0);
  const footerY = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const goofyScale = useSharedValue(0);
  const goofyRotate = useSharedValue(0);
  const goofyY = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  const themes = [
    { name: "Default Dark", value: "defaultDarkTheme" },
    { name: "Midnight", value: "midnightTheme" },
    { name: "Emerald", value: "emeraldTheme" },
    { name: "Crimson", value: "crimsonTheme" },
    { name: "Cyberpunk", value: "cyberpunkTheme" },
    { name: "Obsidian", value: "obsidianTheme" },
    { name: "AMOLED", value: "amoledTheme" },
  ];

  async function handleSignOut() {
    close();
    await signOut();
  }

  async function handlePushNotification() {
    const [error, token] = await handleRegisterPushNotification();
    if (error) {
      Alert.alert("Error", error);
    } else if (!error && token) {
      Alert.alert("Success", "Push Notification Registered Successfully");
    }
  }

  const handleFooterPress = () => {
    setEasterEggCount((prev) => prev + 1);

    // Different animations based on number of clicks
    if (easterEggCount >= 5) {
      // Super fancy animation after 5 clicks
      footerScale.value = withSpring(1);
      footerRotate.value = withRepeat(
        withTiming(4 * Math.PI, { duration: 1000 }),
        2,
        true
      );
      footerY.value = withSequence(
        withSpring(-50, { damping: 2 }),
        withSpring(0, { damping: 3 })
      );
      heartScale.value = withSequence(
        withSpring(1.5, { damping: 2 }),
        withSpring(0.5, { damping: 2 }),
        withSpring(1, { damping: 2 })
      );
    } else {
      // Simple bounce animation for initial clicks
      footerScale.value = withSequence(
        withSpring(1.2, { damping: 2 }),
        withSpring(1, { damping: 4 })
      );
      heartScale.value = withSequence(
        withSpring(1.4, { damping: 2 }),
        withSpring(1, { damping: 4 })
      );
    }
  };

  const animateThemeTransition = useCallback(
    (newTheme) => {
      if (newTheme === currentTheme) return;
      setIsAnimating(true);
      setPreviousTheme(theme);
      themeProgress.value = 0;
      switchTheme(newTheme);
      themeProgress.value = withTiming(1, { duration: 500 })
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    },
    [theme, switchTheme]
  );

  const showGoofyAnimation = useCallback(() => {
    setShowGoofyAnim(true);
    goofyScale.value = 0;
    goofyRotate.value = 0;
    goofyY.value = 0;
    sparkleOpacity.value = 0;
    sparkleScale.value = 0;

    // Main container animation
    goofyScale.value = withSequence(
      withSpring(1.2, { damping: 4 }),
      withSpring(1, { damping: 6 })
    );

    // Rotation animation
    goofyRotate.value = withSequence(
      withTiming(Math.PI / 8, { duration: 200 }),
      withSpring(0, { damping: 4 }),
      withRepeat(
        withSequence(
          withTiming(-Math.PI / 16, { duration: 150 }),
          withTiming(Math.PI / 16, { duration: 150 })
        ),
        3,
        true
      )
    );

    // Bounce animation with modified timing
    goofyY.value = withSequence(
      withSpring(-30, { damping: 3 }),
      withSpring(0, { damping: 4 }),
      withTiming(0, { duration: 300 }, () => {
        goofyY.value = withSequence(
          withSpring(-15, { damping: 3 }),
          withSpring(0, { damping: 4 })
        );
      })
    );

    // Sparkle effects
    sparkleOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );
    sparkleScale.value = withSequence(
      withSpring(1.2, { damping: 4 }),
      withSpring(1, { damping: 6 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );

    // Auto hide after animation
    setTimeout(() => {
      setShowGoofyAnim(false);
    }, 1900);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        themeProgress.value,
        [0, 1],
        [previousTheme.background, theme.background]
      ),
    };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        themeProgress.value,
        [0, 1],
        [previousTheme.card, theme.card]
      ),
    };
  });

  const animatedCardBorderStyleForSelectedTheme = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        themeProgress.value,
        [0, 1],
        ["transparent", theme.primary]
      ),
      shadowColor: interpolateColor(
        themeProgress.value,
        [0, 1],
        ["transparent", theme.primary]
      )
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        themeProgress.value,
        [0, 1],
        [previousTheme.textPrimary, theme.textPrimary]
      ),
    };
  });

  const animatedTextStyleForSelectedTheme = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        themeProgress.value,
        [0, 1],
        [previousTheme.textPrimary, theme.primary]
      ),
    };
  });

  const animatedFooterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: footerScale.value },
      { translateY: footerY.value },
      { rotate: `${footerRotate.value}rad` },
    ],
  }));

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    display: "flex",
  }));

  const goofyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: goofyScale.value },
      { translateY: goofyY.value },
      { rotate: `${goofyRotate.value}rad` },
    ],
    opacity: goofyScale.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  const AnimatedTouchableOpacity =
    Reanimated.createAnimatedComponent(TouchableOpacity);

  return (
    <Reanimated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        animatedContainerStyle,
      ]}
    >
      <View style={styles.header}>
        <Reanimated.Text
          style={[
            styles.text,
            {
              fontWeight: "bold",
            },
            animatedTextStyle,
          ]}
        >
          Settings
        </Reanimated.Text>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={30} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Reanimated.Text style={[styles.sectionTitle, animatedTextStyle]}>
          Appearance
        </Reanimated.Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.themesContainer}
        >
          {themes.map((item) => (
            <AnimatedTouchableOpacity
              key={item.value}
              style={[
                styles.themeButton,
                animatedCardStyle,
                item.value === currentTheme && animatedCardBorderStyleForSelectedTheme,
                (item.value === currentTheme && !isAnimating) && {
                  ...styles.selectedTheme,
                  borderColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ]}
              onPress={() => animateThemeTransition(item.value)}
            >
              <Reanimated.Text
                style={[
                  styles.themeText,
                  item.value === currentTheme
                    ? animatedTextStyleForSelectedTheme
                    : animatedTextStyle,
                  (item.value === currentTheme && !isAnimating) && {
                    color: theme.primary,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4.84,
                    elevation: 5,
                  },
                ]}
              >
                {item.name}
              </Reanimated.Text>
            </AnimatedTouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setShowTerms(true)}>
          <View style={[styles.signOutButton, { backgroundColor: theme.card }]}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={theme.textPrimary}
            />
            <Text
              style={[
                styles.signOutText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              View Terms & Conditions
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePushNotification}>
          <View
            style={[
              styles.signOutButton,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.textPrimary}
            />
            <Text
              style={[
                styles.signOutText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Register For Push Notifications
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut}>
          <View style={[styles.signOutButton, { backgroundColor: theme.card }]}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.textPrimary}
            />
            <Text
              style={[
                styles.signOutText,
                {
                  color: theme.error,
                },
              ]}
            >
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleFooterPress}>
        <Reanimated.View style={animatedFooterStyle}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made wid{" "}
            <Reanimated.Text style={animatedHeartStyle}>❤️</Reanimated.Text> by
            Kichu
            {easterEggCount >= 5 && " 🚀✨"}
          </Text>
        </Reanimated.View>
      </TouchableOpacity>
      <Modal visible={showTerms} animationType="slide" transparent={false}>
        <Terms
          setShowTerms={setShowTerms}
          showGoofyAnimation={showGoofyAnimation}
          theme={theme}
          insets={insets}
          styles={styles}
        />
      </Modal>
      {showGoofyAnim && (
        <Reanimated.View
          style={[
            styles.goofyAnimContainer,
            { backgroundColor: theme.card },
            goofyAnimatedStyle,
          ]}
        >
          <View style={styles.goofyContent}>
            <Reanimated.View style={sparkleAnimatedStyle}>
              <Ionicons name="rocket" size={24} color="#FFD700" />
            </Reanimated.View>
            <Text style={[styles.goofyAnimText, { color: theme.textPrimary }]}>
              Terms Accepted YAYYY!!
            </Text>
            <Reanimated.View style={sparkleAnimatedStyle}>
              <Ionicons name="happy" size={24} color="#FFD700" />
            </Reanimated.View>
          </View>
          <Reanimated.View style={[styles.goofyIconsRow, sparkleAnimatedStyle]}>
            <Ionicons name="sparkles" size={20} color="#FF69B4" />
            <Ionicons name="star" size={20} color="#87CEEB" />
            <Ionicons name="heart" size={20} color="#FF69B4" />
            <Ionicons name="sparkles" size={20} color="#87CEEB" />
            <Ionicons name="star" size={20} color="#FF69B4" />
          </Reanimated.View>
        </Reanimated.View>
      )}
    </Reanimated.View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
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
    backgroundColor: (theme) => theme.card,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  termsModalContainer: {
    flex: 1,
  },
  termsCloseButton: {
    alignSelf: "flex-end",
    margin: 15,
  },
  termsScrollView: {
    padding: 20,
  },
  termsText: {
    fontSize: fontSizes.md,
  },
  termsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  goofyAnimContainer: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    padding: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  goofyContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  goofyIconsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingHorizontal: 10,
  },
  goofyAnimText: {
    fontWeight: "bold",
    fontSize: 16,
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  themesContainer: {
    flexGrow: 0,
    marginBottom: 20,
    padding: 10,
  },
  themeButton: {
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedTheme: {
    ...Platform.select({
      ios: {
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  themeText: {
    fontSize: fontSizes.md,
    fontWeight: "500",
  },
});
