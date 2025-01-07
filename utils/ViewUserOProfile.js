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
import { colors, fontSizes } from "../constants/primary";
import ViewPostScreen from "../screens/ViewPostScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ViewUserOProfile = ({ user:viewingUser, close }) => {
  const { currentUser, token, setCurrentUser } = useAuth();
  const { posts: allPosts, getPostCommentUser: getUser } = usePost();
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [isPostVisible, setIsPostVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followers, setFollowers] = useState(viewingUser.followers?.length || "~");
  const [following, setFollowing] = useState(viewingUser.following?.length || "~");
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState(""); // 'followers' or 'following'
  const [modalUsers, setModalUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(viewingUser);

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
    if (type === 'followers') {
      setModalUsers(userData.followers||[]);
    } else {
      setModalUsers(userData.following||[]);
    }
    setShowFollowModal(true);
  };

  const renderUserItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() =>{
          if(item._id === currentUser._id) return;
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
        <Text style={styles.userName}>@{item.username}</Text>
      </TouchableOpacity>
    );
  };

  useLayoutEffect(() => {
    if (user) getUserData(user._id);
  }, [user]);

  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing(currentUser.following.some((u) => u._id === user._id));
    const filteredPosts = allPosts.filter((p) => p.user._id === user._id);
    setUserPosts(filteredPosts);
  }, [user, currentUser, allPosts]);

  useEffect(() => {
    // Listen for follow/unfollow updates for this specific user
    const handleFollowUpdate = ({ followerId, followedId }) => {
      if (user._id === followedId) {
        setIsFollowing(true);
      }
      setFollowers((prev) => prev + 1);
    };

    const handleUnfollowUpdate = ({ userId, unfollowedId }) => {
      if (user._id === unfollowedId) {
        setIsFollowing(false);
      }
      setFollowers((prev) => prev - 1);
    };

    socket.on("userFollowed", handleFollowUpdate);
    socket.on("userUnfollowed", handleUnfollowUpdate);

    return () => {
      socket.off("userFollowed", handleFollowUpdate);
      socket.off("userUnfollowed", handleUnfollowUpdate);
    };
  }, [user]);

  const handleFollowToggle = async () => {
    try {
      if (!token) return;
      if (isFollowing) {
        await axios.post(`${endPoint}/api/users/unfollow/${user._id}`);
        setCurrentUser((prev) => {
          return {
            ...prev,
            following: prev.following.filter((id) => id !== user._id),
          };
        });
        setFollowers((prev) => prev - 1);
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
        await AsyncStorage.setItem("user", JSON.stringify(currentUser));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.log(err.response?.data?.message || err.message);
    }
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setIsPostVisible(true);
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={close}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
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
            onPress={() => openFollowModal('followers')}
            >
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>
                {followers === 1 ? "Follower" : "Followers"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={styles.statItem}
            onPress={() => openFollowModal('following')}
            >
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
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
            <Text
              style={styles.noPostText}
            >
              No posts yet
            </Text>
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
        <View style={[styles.modalContainer, { paddingTop: insets.top,paddingBottom: insets.bottom }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {followModalType === "followers" ? "Followers" : "Following"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFollowModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
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
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  displayName: {
    fontSize: fontSizes.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bio: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  followButton: {
    backgroundColor: colors.primary,
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
    borderColor: colors.textPrimary,
  },
  followButtonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  followingButtonText: {
    color: colors.textPrimary,
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
    backgroundColor: colors.card,
    borderRadius: 0, // Remove border radius for cleaner grid
  },
  textPostContainer: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 0, // Remove border radius for cleaner grid
    padding: 8,
    justifyContent: "center",
  },
  postContent: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
  justifyContentCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  noPostText:{
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSizes.xxl,
    marginTop: 200,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
