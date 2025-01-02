import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Dimensions,
  useAnimatedValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/primary";
import { useMessage } from "../context/MessageContext";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import MessageItem from "../components/MessageItem";
import bgImage from "../images/backImage.jpeg";
import ViewPostScreen from "./ViewPostScreen";
import ImageViewer from "../utils/imageViewer";
const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const SpacerItem = () => <View style={styles.height} />;

const TypingIndicator = () => {
  const [dots] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    const animations = dots.map((dot, index) => {
      return Animated.sequence([
        Animated.delay(index * 200),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.typingContainer}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

export default function DMsScreen({ route, navigation }) {
  navigation.on;
  const { conversationId, receiverId, username, profileImage } = route.params;
  const {
    messages,
    sendMessage,
    fetchMessages,
    activeChat,
    socket,
    setActiveChat,
    uploadImageToServer,
  } = useMessage();
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUriModal, setImageUriModal] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scaleAnim = useAnimatedValue(1);
  const rotateAnim = useAnimatedValue(0);
  const fadeAnim = useAnimatedValue(0);

  const scrollViewRef = React.useRef();

  useEffect(() => {
    if (conversationId && socket) {
      fetchMessages(conversationId);
      socket.emit("joinChat", conversationId);

      // Listen for new messages
      const handleNewMessage = (data) => {
        setMessages((prev) => [...prev, data.message]);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      };

      socket.on("message", handleNewMessage);

      socket.on("userTyping", ({ userId }) => {
        if (userId !== currentUser._id) {
          setIsTyping(true);
        }
      });

      socket.on("userStopTyping", ({ userId }) => {
        if (userId !== currentUser._id) {
          setIsTyping(false);
        }
      });

      return () => {
        socket.emit("leaveChat", conversationId);
        socket.off("message", handleNewMessage);
        socket.off("userTyping");
        socket.off("userStopTyping");
      };
    }
  }, [conversationId, socket]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionStart", (e) => {
      if (e.data.closing) {
        setActiveChat(null);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
    });
    if (!result.canceled) {
      const finalUrl = await uploadImageToServer(result.assets[0].uri);
      setImageUri(finalUrl);
    }
  };

  const handleSend = () => {
    if (!text.trim() && !imageUri) return;
    sendMessage(conversationId, text.trim(), receiverId, imageUri);
    setText("");
    setImageUri("");
    scrollViewRef.current.scrollToEnd({ animated: true });
  };

  const handlePostClick = (post) => {
    setPostContent(post);
    setPostModalVisible(true);
  };

  const renderItem = React.useCallback(
    ({ item, index }) => {
      if (!item?.sender) {
        return null;
      }
      const isOwn = item?.sender?._id === currentUser?._id;
      return (
        <MessageItem
          message={item}
          isOwn={isOwn}
          onClickPost={handlePostClick}
          onClickImage={(uri) => {
            setImageUriModal(uri);
            setImageModalVisible(true);
          }}
        />
      );
    },
    [currentUser?._id, messages.length]
  );
  const insets = useSafeAreaInsets();
  // Calculate proper bottom padding to account for input box
  const contentContainerStyle = React.useMemo(
    () => ({
      paddingHorizontal: 16, // Increase this value to ensure messages are visible above input
      paddingTop: 50 + insets.top,
    }),
    []
  );

  // Modified scroll behavior
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length > 0 && scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle new messages scroll
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      smoothScrollToEnd();
    }
  }, [messages]);

  const keyExtractor = React.useCallback((item) => item._id, []);

  // Memoize the background component
  const BackgroundComponent = React.useMemo(
    () => (
      <Image
        source={bgImage}
        style={{
          flex: 1,
          ...StyleSheet.absoluteFillObject,
        }}
        contentFit="cover"
      />
    ),
    []
  );

  // Memoize the input container blur view
  const InputBlurView = React.useMemo(
    () => (
      <BlurView
        intensity={60}
        tint="dark"
        style={styles.blurBackground}
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={16}
      />
    ),
    []
  );

  useEffect(() => {
    if (activeChat) {
      socket.emit("addUserToList", {
        userId: currentUser._id,
        activeId: activeChat._id,
      });
    }

    return () => {
      socket.emit("removeUserFromList", currentUser._id);
    };
  }, [activeChat]);

  const TYPING_DELAY_MS = 2000;
  let lastTypingTime = 0;

  const emitTyping = () => {
    const now = Date.now();
    // Only emit if enough time has passed since last typing event
    if (now - lastTypingTime > 1000) {
      socket.emit("typing", { conversationId, userId: currentUser._id });
      lastTypingTime = now;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId, userId: currentUser._id });
    }, TYPING_DELAY_MS);
  };

  const handleTextChange = (newText) => {
    setText(newText);
    emitTyping();
  };

  function smoothScrollToEnd() {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const isScrolledUp = contentHeight - offsetY - scrollViewHeight > 1500;

    if (isScrolledUp && !showScrollButton) {
      setShowScrollButton(true);
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }).start();
    } else if (!isScrolledUp && showScrollButton) {
      Animated.spring(fadeAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 4,
      }).start(() => {
        setShowScrollButton(false);
      });
    }
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            useNativeDriver: true,
            friction: 3,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset animations
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();

      setShowScrollButton(false);
    });
  };

  const handleScrollToBottom = () => {
    animateButtonPress();
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      {BackgroundComponent}
      <View
        style={[
          styles.container,
          {
            paddingBottom: Platform.select({
              ios: insets.bottom,
              android: insets.bottom + 10,
            }),
          },
        ]}
      >
        <BlurView
          style={[styles.headerContainer, { paddingTop: insets.top }]}
          intensity={20}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          blurReductionFactor={16}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
                setActiveChat(null);
              }}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {activeChat?.participants.find(
                (p) => p.user._id !== currentUser._id
              )?.user.username ||
                username ||
                "Error :("}
            </Text>
            <Image
              source={{ uri: profileImage || defaultAvatar }}
              style={styles.profileImage}
            />
          </View>
        </BlurView>
        <KeyboardAvoidingView
          style={{ flex: 1}}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
        >
          <FlatList
            data={messages}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={renderItem}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            ListFooterComponent={SpacerItem}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          <View style={styles.posRelative}>
            {imageUri !== "" && (
              <TouchableOpacity
                onPress={() => setImageUri("")}
                style={{
                  position: "absolute",
                  bottom: 60,
                  left: 10,
                }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
              </TouchableOpacity>
            )}
            <View style={styles.inputWrapper}>
              {isTyping && <TypingIndicator />}
              {showScrollButton && (
                <Animated.View
                  style={[styles.scrollButton, { opacity: fadeAnim }]}
                >
                  <Animated.View
                    style={[
                      styles.scrollButtonTouchable,
                      {
                        transform: [{ scale: scaleAnim }, { rotate: spin }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={handleScrollToBottom}
                      style={styles.buttonInner}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={24}
                        color={colors.textPrimary}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}
              <View style={styles.floatingContainer}>
                {InputBlurView}
                <View style={styles.inputContainer}>
                  {imageUri !== "" && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 60,
                        left: 10,
                      }}
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      padding: 8,
                    }}
                  >
                    <Ionicons
                      name="image"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    placeholderTextColor={colors.textSecondary}
                    value={text}
                    onChangeText={handleTextChange}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                  >
                    <Ionicons
                      name="send"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={postModalVisible}
          onRequestClose={() => setPostModalVisible(false)}
        >
          {postContent && (
            <ViewPostScreen
              post={postContent}
              close={() => setPostModalVisible(false)}
            />
          )}
        </Modal>
        <Modal
          animationType="fade"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={() => setImageModalVisible(false)}
          hardwareAccelerated={true}
        >
          <ImageViewer
            uri={imageUriModal}
            close={() => setImageModalVisible(false)}
          />
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  floatingContainer: {
    borderRadius: 30,
    width: "98%",
    alignSelf: "center",
    overflow: "hidden",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 5,
    alignItems: "flex-end",
    justifyContent: "space-between",
    maxHeight: 200,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 20,
  },
  posRelative: {
    position: "relative",
    height: 1,
  },
  scrollButton: {
    position: "absolute",
    right: 20,
    bottom: 80,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: Dimensions.get("window").width * 0.9,
  },
  scrollButtonTouchable: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    width: 50,
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
    marginHorizontal: 2,
    shadowColor: colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  height: {
    height: 150,
  },
  buttonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
