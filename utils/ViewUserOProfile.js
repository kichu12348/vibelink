import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { usePost } from "../context/PostContext";
import axios from "axios";
import { endPoint, socket } from "../constants/endpoints";
import { fontSizes } from "../constants/primary";
import ViewPostScreen from "../screens/ViewPostScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useError } from "../context/ErrorContext";
import { useTheme } from "../context/ThemeContext";

const ViewUserOProfile = ({ user: viewingUser, close }) => {
  const { currentUser, token, setCurrentUser } = useAuth();
  const { posts: allPosts, getPostCommentUser: getUser } = usePost();
  const { showError } = useError();
  const { theme } = useTheme();
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [isPostVisible, setIsPostVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followers, setFollowers] = useState(
    viewingUser.followers?.length || "~"
  );
  const [following, setFollowing] = useState(
    viewingUser.following?.length || "~"
  );
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState(""); // 'followers' or 'following'
  const [modalUsers, setModalUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(viewingUser);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  async function getUserData(userId) {
    try {
      const response = await getUser(userId);
      setUserData(response);
      setFollowers(response.followers?.length || 0);
      setFollowing(response.following?.length || 0);
    } catch (err) {
      console.log(err.response?.data?.message || err.message);
    }
  }

  const openFollowModal = async (type) => {
    setFollowModalType(type);
    if (type === "followers") {
      setModalUsers(userData.followers || []);
    } else {
      setModalUsers(userData.following || []);
    }
    setShowFollowModal(true);
  };

  const renderUserItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          if (item._id === currentUser._id) return;
          setUser(item);
          setShowFollowModal(false);
          getUserData(item._id.toString());
        }}
      >
        <Image
          source={
            item.profileImage
              ? { uri: item.profileImage }
              : require("../defaultImages/default-user.jpg")
          }
          style={styles.userImage}
          cachePolicy={"memory-disk"}
        />
        <Text style={styles.userName} numberOfLines={1}>
          @{item.username}
        </Text>
        {item._id === currentUser._id && (
          <Text style={styles.itsYou} numberOfLines={1}>
            (itzzz You!! (≧▽≦))
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  useLayoutEffect(() => {
    if (user) getUserData(user._id);
  }, [user]);

  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing((prev) => {
      const res = currentUser.following.some((u) => {
        if (typeof u === "object") return u._id === user._id;
        return u === user._id;
      });
      return res;
    });
    const filteredPosts = allPosts.filter((p) => p.user._id === user._id);
    setUserPosts(filteredPosts);
  }, [user]);

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (!token) return;
      if (isFollowing) {
        await axios.post(`${endPoint}/api/users/unfollow/${user._id}`);
        setCurrentUser((prev) => {
          return {
            ...prev,
            following: prev.following.filter((id) => {
              if (typeof id === "object") {
                return id._id !== user._id;
              }
              return id !== user._id;
            }),
          };
        });
        setFollowers((prev) => prev - 1);
        setIsFollowing(false);
        await AsyncStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        await axios.post(`${endPoint}/api/users/follow/${user._id}`);
        setCurrentUser((prev) => {
          return {
            ...prev,
            following: [...prev.following, user._id],
          };
        });
        setFollowers((prev) => prev + 1);
        setIsFollowing(true);
        await AsyncStorage.setItem("user", JSON.stringify(currentUser));
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setIsPostVisible(true);
  };

  useEffect(() => {
    socket.on("userFollowed", async ({ follwerId, followedId }) => {
      if (followedId === user._id && followerId !== currentUser._id) {
        setFollowers((prev) => prev + 1);
        setUserData(async (prev) => {
          const response = await getUser(followedId);
          return {
            ...prev,
            followers: [...prev.followers, response],
          };
        });
      }
      if (follwerId === user._id && followerId !== currentUser._id) {
        setFollowing((prev) => prev + 1);
        setUserData(async (prev) => {
          const response = await getUser(follwerId);
          return {
            ...prev,
            following: [...prev.following, response],
          };
        });
      }
    });

    socket.on("userUnfollowed", async ({ follwerId, followedId }) => {
      if (followedId === user._id && followerId !== currentUser._id) {
        setFollowers((prev) => prev - 1);
        setUserData(async (prev) => {
          const response = await getUser(followedId);
          return {
            ...prev,
            followers: prev.followers.filter((id) => id !== response._id),
          };
        });
      }
      if (follwerId === user._id && followerId !== currentUser._id) {
        setFollowing((prev) => prev - 1);
        setUserData(async (prev) => {
          const response = await getUser(follwerId);
          return {
            ...prev,
            following: prev.following.filter((id) => id !== response._id),
          };
        });
      }
    });
  }, []);

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    closeButton: {
      padding: 4,
    },
    topBarUsername: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    placeholder: {
      width: 24,
    },
    header: {
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    profileImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.card,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 4,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.card,
      borderRadius: 8,
      paddingVertical: 12,
      marginBottom: 20,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: fontSizes.lg,
      fontWeight: "bold",
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: fontSizes.sm,
      color: theme.textSecondary,
      marginTop: 4,
    },
    displayName: {
      fontSize: fontSizes.lg,
      fontWeight: "bold",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bio: {
      fontSize: fontSizes.sm,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    followButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 24,
      marginTop: 8,
      minWidth: 120,
      alignItems: "center",
    },
    followingButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.textPrimary,
    },
    followButtonText: {
      color: theme.background,
      fontSize: fontSizes.md,
      fontWeight: "600",
    },
    followingButtonText: {
      color: theme.textPrimary,
    },
    postsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    postContainer: {
      width: postSize,
      height: postSize,
      padding: 1,
    },
    postImage: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.card,
      borderRadius: 0, // Remove border radius for cleaner grid
    },
    textPostContainer: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 0, // Remove border radius for cleaner grid
      padding: 8,
      justifyContent: "center",
    },
    postContent: {
      color: theme.textPrimary,
      fontSize: fontSizes.sm,
      textAlign: "center",
    },
    justifyContentCenter: {
      justifyContent: "center",
      alignItems: "center",
    },
    noPostText: {
      textAlign: "center",
      color: theme.textSecondary,
      fontSize: fontSizes.xxl,
      marginTop: 200,
      fontWeight: "bold",
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.card,
      position: "relative",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textPrimary,
    },
    modalCloseButton: {
      position: "absolute",
      right: 16,
    },
    userList: {
      padding: 16,
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.card,
    },
    userImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    userName: {
      fontSize: 16,
      color: theme.textPrimary,
      fontWeight: "500",
    },
    itsYou: {
      color: theme.textSecondary,
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={close}>
          <Ionicons name="close" size={30} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarUsername}>{user.username}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={
              user.profileImage
                ? { uri: user.profileImage }
                : require("../defaultImages/default-user.jpg")
            }
            style={styles.profileImage}
            cachePolicy={"memory-disk"}
          />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>
                {userPosts?.length === 1 ? "Post" : "Posts"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => openFollowModal("followers")}
            >
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>
                {followers === 1 ? "Follower" : "Followers"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => openFollowModal("following")}
            >
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
              loading && { opacity: 0.5 },
            ]}
            onPress={handleFollowToggle}
            disabled={loading}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.postsGrid,
            userPosts.length === 0 && styles.justifyContentCenter,
          ]}
        >
          {userPosts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.postContainer}
              onPress={() => handlePostPress(post)}
            >
              {post.image ? (
                <Image
                  style={styles.postImage}
                  source={{ uri: post.image }}
                  cachePolicy={"memory-disk"}
                />
              ) : (
                <View style={styles.textPostContainer}>
                  <Text numberOfLines={4} style={styles.postContent}>
                    {post.content}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          {userPosts.length === 0 && (
            <Text style={styles.noPostText}>No posts yet</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isPostVisible}
        animationType="slide"
        onRequestClose={() => setIsPostVisible(false)}
        transparent={true}
      >
        {selectedPost && (
          <ViewPostScreen
            post={selectedPost}
            close={() => setIsPostVisible(false)}
          />
        )}
      </Modal>

      <Modal
        visible={showFollowModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {followModalType === "followers" ? "Followers" : "Following"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFollowModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={modalUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.userList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ViewUserOProfile;

const windowWidth = Dimensions.get("window").width;
const postSize = windowWidth / 3;
