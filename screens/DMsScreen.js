import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const ListEmptyComponent = React.memo(() => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: colors.textSecondary }}>No messages yet</Text>
  </View>
));

const SpacerItem = React.memo(() => (
  <View style={{ height: 100, backgroundColor: 'transparent' }} />
));

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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

      return () => {
        socket.emit("leaveChat", conversationId);
        socket.off("message", handleNewMessage);
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
    });
    if (!result.canceled) {
      const finalUrl = await uploadImageToServer(result.assets[0].uri);
      setImageUri(finalUrl);
    }
  };

  const handleSend = () => {
    if (!text.trim() && !imageUri) return;
    sendMessage(conversationId, text.trim(), receiverId, imageUri);
    scrollViewRef.current.scrollToEnd({ animated: true });
    setText("");
    setImageUri("");
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handlePostClick = (post) => {
    setPostContent(post);
    setPostModalVisible(true);
  };

  const renderItem = React.useCallback(
    ({ item, index }) => {
      if (index === messages.length) {
        return <SpacerItem />;
      }
      if (!item?.sender) {
        return null;
      }
      const isOwn = item?.sender?._id === currentUser?._id;
      return (
        <MessageItem 
          message={item}
          isOwn={isOwn}
          onClickPost={handlePostClick}
        />
      );
    },
    [currentUser?._id, messages.length]
  );

  // Calculate proper bottom padding to account for input box
  const contentContainerStyle = React.useMemo(() => ({
    padding: 16,
    paddingBottom: 90, // Increase this value to ensure messages are visible above input
  }), []);

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
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const keyExtractor = React.useCallback(item => item._id, []);

  // Memoize the background component
  const BackgroundComponent = React.useMemo(() => (
    <Image
      source={bgImage} 
      style={{ 
        flex: 1,
        ...StyleSheet.absoluteFillObject,

      }}
      contentFit="cover"
      
    />
  ), []);

  // Memoize the input container blur view
  const InputBlurView = React.useMemo(() => (
    <BlurView
      intensity={60}
      tint="dark"
      style={styles.blurBackground}
      experimentalBlurMethod="dimezisBlurView"
      blurReductionFactor={16}
    />
  ), []);

  useEffect(()=>{
    if(activeChat){
      socket.emit('addUserToList',{
        userId:currentUser._id,
        activeId:activeChat._id
      });
    }

    return ()=> socket.emit('removeUserFromList',currentUser._id);
      
  },[activeChat]);
  
  const listData = React.useMemo(() => {
    return [...messages, { _id: 'spacer', type: 'spacer' }];
  }, [messages]);// eslint-disable-line

  return (
    <>
    <StatusBar 
    translucent
    backgroundColor="transparent"
    style="light"
     />
    {BackgroundComponent}
    <SafeAreaView style={styles.container}>
        

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
              setActiveChat(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            data={listData}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            renderItem={renderItem}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
          <Animated.View
            style={[
              styles.scrollButton,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={scrollToBottom}
              style={styles.scrollButtonTouchable}
            >
              <Ionicons
                name="arrow-down"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </Animated.View>
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
                    onChangeText={setText}
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
          {postContent && <ViewPostScreen
            post={postContent}
            close={() => setPostModalVisible(false)}
          />}
        </Modal>
      </SafeAreaView>
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
    height: 10,
  },
  scrollButton: {
    position: "absolute",
    right: 20,
    bottom: 80,
    zIndex: 2,
  },
  scrollButtonTouchable: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 5,
    width: "100%",
    backgroundColor: 'transparent',
    zIndex: 1000, // Ensure input stays on top
  },
});
