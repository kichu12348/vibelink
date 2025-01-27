import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import React, { useRef, useState } from "react";
import { fontSizes } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../context/ThemeContext";

const Settings = ({ close }) => {
  const { signOut } = useAuth();
  const { handleRegisterPushNotification } = useMessage();
  const insets = useSafeAreaInsets();
  const { theme, switchTheme, currentTheme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [showTerms, setShowTerms] = useState(false);
  const [showGoofyAnim, setShowGoofyAnim] = useState(false);
  const goofyScaleAnim = useRef(new Animated.Value(0)).current;
  const goofyRotateAnim = useRef(new Animated.Value(0)).current;
  const goofyBounceAnim = useRef(new Animated.Value(0)).current;

  const themes = [
    { name: "Default Dark", value: "defaultDarkTheme" },
    { name: "Midnight", value: "midnightTheme" },
    { name: "Emerald", value: "emeraldTheme" },
    { name: "Crimson", value: "crimsonTheme" },
    { name: "Cyberpunk", value: "cyberpunkTheme" },
    { name: "Obsidian", value: "obsidianTheme" },
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

  function showGoofyAnimation() {
    setShowGoofyAnim(true);
    goofyScaleAnim.setValue(0);
    goofyRotateAnim.setValue(0);
    goofyBounceAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(goofyScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(goofyScaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(goofyScaleAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(goofyRotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(goofyRotateAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 4 }
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(goofyBounceAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(goofyBounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 5 }
      ),
    ]).start(() => {
      setTimeout(() => {
        setShowGoofyAnim(false);
      }, 100);
    });
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const goofySpin = goofyRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "15deg"],
  });

  const bounce = goofyBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.text,
            {
              fontWeight: "bold",
              color: theme.textPrimary,
            },
          ]}
        >
          Settings
        </Text>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={30} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Appearance
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.themesContainer}
        >
          {themes.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.themeButton,
                { backgroundColor: theme.card },
                item.value === currentTheme && {
                  ...styles.selectedTheme,
                  borderColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ]}
              onPress={() => switchTheme(item.value)}
            >
              <Text
                style={[
                  styles.themeText,
                  { color: theme.textPrimary },
                  item.value === currentTheme && {
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
              </Text>
            </TouchableOpacity>
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
        <Animated.Text
          style={[
            styles.footerText,
            {
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            },
            { color: theme.textSecondary },
          ]}
        >
          Made wid ❤️ by Kichu
        </Animated.Text>
      </TouchableOpacity>
      <Modal visible={showTerms} animationType="slide" transparent={false}>
        <View
          style={[
            styles.termsModalContainer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.termsHeader}>
            <Text
              style={[
                styles.text,
                {
                  fontWeight: "bold",
                  color: theme.textPrimary,
                },
              ]}
            >
              Terms & Conditions
            </Text>
            <TouchableOpacity
              style={styles.termsCloseButton}
              onPress={() => {
                setShowTerms(false);
                showGoofyAnimation();
              }}
            >
              <Ionicons name="close" size={30} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.termsScrollView}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.termsText, { color: theme.textPrimary }]}>
              1. By using VibeLink, you agree to send at least one text message
              a day that could confuse even Sherlock Holmes.{"\n\n"} Bonus
              points for sending it with an image that makes it even weirder.
              🕵️‍♂️💬🖼️{"\n\n"} 2. You promise to share images that spread joy,
              confusion, or both.{"\n\n"} If your image causes someone to
              laugh-snort, you win the day. 😂📸🎉{"\n\n"} 3. Sharing blurry
              photos “accidentally” is completely acceptable. {"\n\n"} We call
              it artistic expression, and we’re here for it. 🎨📷✨ {"\n\n"} 4.
              You agree to use captions that make people go, “Wait, what?” every
              once in a while.{"\n\n"} It’s good for the vibe. 🤔🖼️📜{"\n\n"} 5.
              If you send the wrong image to the wrong person, you must laugh it
              off and pretend it was intentional.{"\n\n"} It’s the VibeLink way.
              🤷‍♀️📱😂{"\n\n"} 6. By using this app, you agree to embrace the
              beauty of typos in your messages.{"\n\n"} They’re not mistakes;
              they’re personality quirks. 😜✍️✨{"\n\n"} 7. Posting pictures of
              food that look way too good to eat is allowed, but you’ll need to
              send the recipe too.{"\n\n"} Sharing is caring. 🍕📸🍴{"\n\n"} 8.
              By using VibeLink, you promise not to use the app to send cryptic
              texts like “We need to talk” unless you’re also sending a picture
              of something harmless, like a kitten.{"\n\n"} 🐱💬💓{"\n\n"} 9.
              You agree to celebrate your friends’ blurry sunset photos like
              they’re professional photographers.{"\n\n"} It’s about the vibes,
              not the megapixels. 🌅📷💖{"\n\n"} 10. Sharing an image of your
              coffee? Cool.{"\n\n"} But remember: the more ridiculous the
              caption, the better. ☕😂🖋️ {"\n\n"} 11. Any overuse of filters
              must be accompanied by a caption that says, “Yes, this is 100%
              real and not filtered at all.”{"\n\n"} Honesty is key. 😇📸🎨
              {"\n\n"} 12. You promise not to ghost your group chats.{"\n\n"} If
              you go quiet for too long, you owe them a picture of something
              random in your house.{"\n\n"} Bonus points for creativity. 🏠📷💬
              {"\n\n"} 13. By agreeing to these terms, you understand that
              sending a single text without an accompanying image is totally
              acceptable—but slightly less vibey.{"\n\n"} Try to balance it out.
              ⚖️🖼️💬{"\n\n"}
              14. VibeLink reserves the right to cheer you up with random image
              suggestions if your vibes seem off.{"\n\n"} We can’t help it; we
              care too much. 💖📱🎭{"\n\n"} 15. By using this app, you
              acknowledge that sometimes the best way to say something is to not
              say anything at all and just send a perfectly random image
              instead.{"\n\n"} 🖼️🤔🌈{"\n\n"}
            </Text>
          </ScrollView>
        </View>
      </Modal>
      {showGoofyAnim && (
        <Animated.View
          style={[
            styles.goofyAnimContainer,
            {
              opacity: goofyScaleAnim,
              transform: [
                { scale: goofyScaleAnim },
                { rotate: goofySpin },
                { translateY: bounce },
              ],
            },
            { backgroundColor: theme.card },
          ]}
        >
          <View style={styles.goofyContent}>
            <Ionicons name="rocket" size={24} color="#FFD700" />
            <Text
              style={[
                styles.goofyAnimText,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              Terms Accepted YAYYY!!
            </Text>
            <Ionicons name="happy" size={24} color="#FFD700" />
          </View>
          <View style={styles.goofyIconsRow}>
            <Ionicons name="sparkles" size={20} color="#FF69B4" />
            <Ionicons name="star" size={20} color="#87CEEB" />
            <Ionicons name="heart" size={20} color="#FF69B4" />
          </View>
        </Animated.View>
      )}
    </View>
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginTop: 8,
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
  footerText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginTop: 8,
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
});
