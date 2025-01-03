import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { usePost } from "../context/PostContext";
import axios from "axios";
import { endPoint, socket } from "../constants/endpoints";
import { colors, fontSizes } from "../constants/primary";
import ViewPostScreen from "../screens/ViewPostScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";

const ViewUserOProfile = ({ user, close }) => {
  const { currentUser, token, setCurrentUser } = useAuth();
  const { posts: allPosts } = usePost();
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [isPostVisible, setIsPostVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

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
    };

    const handleUnfollowUpdate = ({ userId, unfollowedId }) => {
      if (user._id === unfollowedId) {
        setIsFollowing(false);
      }
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
      } else {
        await axios.post(`${endPoint}/api/users/follow/${user._id}`);
        setCurrentUser((prev) => {
          return {
            ...prev,
            following: [...prev.following, user._id],
          };
        });

        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
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
      <TouchableOpacity style={styles.closeButton} onPress={close}>
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

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
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <TouchableOpacity
          style={styles.followButton}
          onPress={handleFollowToggle}
        >
          <Text style={styles.followButtonText}>
            {isFollowing ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.postsGrid}>
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
                <Text style={styles.postContent}>{post.content}</Text>
              )}
            </TouchableOpacity>
          ))}
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
    </SafeAreaView>
  );
};

export default ViewUserOProfile;

const windowWidth = Dimensions.get("window").width;
const postSize = windowWidth / 3; // Account for gaps

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginRight: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    alignSelf: "flex-end",
    marginRight: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  username: {
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bio: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  followButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  followButtonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: "bold",
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
    borderRadius: 8,
  },
  postContent: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    borderRadius: 8,
  },
});
