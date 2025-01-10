import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import AddPostScreen from "../screens/AddPostScreen";
import AccountScreen from "../screens/AccountScreen";
import DMsScreen from "../screens/DMsScreen";
import { colors } from "../constants/primary";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  Modal,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { BlurView } from "expo-blur";
import AllChatsScreen from "../screens/AllChatsScreen";
import * as Notifications from "expo-notifications";
import { useMessage } from "../context/MessageContext";
import Settings from "../components/settings";
import { usePost } from "../context/PostContext";
import ViewPostScreen from "../screens/ViewPostScreen";
import DMsModal from "../components/DMsModal";
import ViewUserOProfile from "../utils/ViewUserOProfile";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function Tabs({ navigation }) {
  const { setActiveChat, setIsDmsModalOpen } = useMessage();
  const { getPost, setIsPostOpen, setPostContent, getPostCommentUser } =
    usePost();
  const { setUserModalData, setIsUserModalOpen } = useAuth();

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  async function handlePostNotifClicked(postId) {
    if (!postId) return;
    const post = await getPost(postId);
    if (post) {
      setPostContent(post);
      setIsPostOpen(true);
    }
  }

  async function handleFollowerNotifClicked(userId) {
    const user = await getPostCommentUser(userId);
    if (user) {
      setUserModalData(user);
      setIsUserModalOpen(true);
    }
  }

  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const {
          conversationId,
          receiverId,
          username,
          profileImage,
          participants,
          PostId,
          type,
          userId,
        } = response.notification.request.content.data || {};
        if (PostId) {
          handlePostNotifClicked(PostId);
        } // do something with PostId
        if (conversationId && receiverId) {
          setActiveChat({
            _id: conversationId,
            participants, // ensures activeChat has the "_id" property
            receiverId,
            username,
            profileImage,
          });
          setIsDmsModalOpen(true);
        }
        if (type && type === "follow") {
          handleFollowerNotifClicked(userId);
        }
      }
    );
    return () => subscription.remove();
  }, [navigation]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            ...Platform.select({
              ios: {
                height: 80,
              },
              android: {
                height: 70,
              },
            }),
            position: "absolute",
            paddingBottom: 10,
            paddingTop: 8,
            borderTopWidth: 0,
            elevation: 6, // higher elevation on Android
            shadowColor: "#000", // subtle shadow on iOS
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },

          tabBarBackground: () => {
            return (
              <BlurView
                intensity={80}
                blurReductionFactor={12}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(35, 37, 47,0.1)",
                  ...StyleSheet.absoluteFillObject,
                  overflow: "hidden",
                }}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
              />
            );
          },

          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIconStyle: {
            alignSelf: "center",
          },
          headerStyle: {
            backgroundColor: colors.card,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.textPrimary,
          headerRight: () => {
            if (route.name === "Profile") {
              return (
                <TouchableOpacity
                  onPress={() => setSettingsOpen(true)}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons
                    name="settings-outline"
                    size={30}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              );
            }
            if (route.name === "Feed") {
              return (
                <TouchableOpacity
                  onPress={() => navigation.navigate("DMs")}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={30}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              );
            }
          },
        })}
      >
        <Tab.Screen
          name="Feed"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Add Post"
          component={AddPostScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle-outline" size={30} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={AccountScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsOpen}
        onRequestClose={() => {
          setSettingsOpen(false);
        }}
        hardwareAccelerated={true}
      >
        <Settings
          close={() => {
            setSettingsOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

export default function TabNavigator({ navigation }) {
  const {
    token,
    currentUser,
    isUserModalOpen,
    userModalData,
    setIsUserModalOpen,
  } = useAuth();
  const { setIsPostOpen, isPostOpen, postContent } = usePost();
  const { isDmsModalOpen, setIsDmsModalOpen,activeChat } = useMessage();
  
  React.useEffect(() => {
    if (!token || !currentUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    }
  }, [token, currentUser]);

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="DMs" component={AllChatsScreen} />
        <Stack.Screen name="single-chat" component={DMsScreen} />
      </Stack.Navigator>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPostOpen}
        onRequestClose={() => {
          setIsPostOpen(false);
        }}
        hardwareAccelerated={true}
      >
        {postContent && (
          <ViewPostScreen
            post={postContent}
            close={() => setIsPostOpen(false)}
          />
        )}
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDmsModalOpen}
        onRequestClose={() => {
          setIsDmsModalOpen(false);
        }}
        hardwareAccelerated={true}
      >
          {activeChat && (
            <DMsModal
              close={() => setIsDmsModalOpen(false)}
              params={{
                conversationId: activeChat._id,
                participants: activeChat.participants,
                receiverId: activeChat.receiverId,
                username: activeChat.username,
                profileImage: activeChat.profileImage,
              }}
            />
          )}
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalOpen}
        onRequestClose={() => {
          setIsUserModalOpen(false);
        }}
        hardwareAccelerated={true}
      >
        {userModalData && (
          <ViewUserOProfile
            user={userModalData}
            close={() => setIsUserModalOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}
