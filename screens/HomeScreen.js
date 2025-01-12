import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
} from "react-native";
import { colors } from "../constants/primary";
import { usePost } from "../context/PostContext";
import ViewPostScreen from "./ViewPostScreen";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import ViewUserOProfile from "../utils/ViewUserOProfile";
import { useAuth } from "../context/AuthContext";
import RenderPost from "../components/RenderPost";
import CommentsModal from "../components/CommentsModal";
import LikedUsersModal from "../components/LikedUsersModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen({ navigation }) {
  const {
    posts,
    loading,
    fetchPosts,
    addComment,
    addReply,
    getPostCommentUser,
  } = usePost();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const { currentUser } = useAuth();

  useEffect(() => {
    const unSubBlurListener = navigation.addListener("blur", () => {
      setIsOutOfFocus(true);
    });

    const unSubFocusListener = navigation.addListener("focus", () => {
      setIsOutOfFocus(false);
    });

    return () => {
      unSubBlurListener();
      unSubFocusListener();
    };
  }, []);

  const [isPostVisible, setIsPostVisible] = useState(false);
  const [postContent, setPostContent] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedUsers, setLikedUsers] = useState([]);
  const [isLikedUsersVisible, setIsLikedUsersVisible] = useState(false);
  const [isLikedUsersLoading, setIsLikedUsersLoading] = useState(false);
  const [isOutOfFocus, setIsOutOfFocus] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleClosePost = () => {
    setIsPostVisible(false);
    setPostContent(null);
  };

  const handlePostPress = (post) => {
    setIsPostVisible(true);
    setPostContent(post);
  };

  const handleProfilePress = (post) => {
    if (post.user._id === currentUser._id) {
      navigation.navigate("Profile");
      return;
    }
    setIsUserProfileOpen(true);
    setItem(post);
  };

  const handleOpenComments = (post) => {
    if (!post) return;
    setSelectedPost(post);
    setIsCommentsVisible(true);
  };

  const handleOpenLikes = async (post) => {
    if (!post) return;
    if (isLikedUsersLoading || isOutOfFocus) return;
    setIsLikedUsersLoading(true);
    const filterRepeatedUsers = post.likes.filter(
      (like, index, self) => self.indexOf(like) === index
    );
    const fetchedUsers = await Promise.all(
      filterRepeatedUsers.map(async (like) => {
        if (typeof like === "object") return like;
        return await getPostCommentUser(like);
      })
    );
    setLikedUsers(fetchedUsers);
    if (isOutOfFocus) {
      setIsLikedUsersLoading(false);
      return;
    }
    setIsLikedUsersVisible(true);
    setIsLikedUsersLoading(false);
  };

  const handleLikesProfilePress = ({ user }) => {
    setIsLikedUsersVisible(false);
    if (user._id === currentUser._id) {
      navigation.navigate("Profile");
      return;
    }
    setIsUserProfileOpen(true);
    setItem({ user });
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <RenderPost
            item={item}
            onPostPress={handlePostPress}
            onProfilePress={handleProfilePress}
            openComments={handleOpenComments}
            openLikes={handleOpenLikes}
          />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomTabBarHeight + 5,
          paddingTop: insets.top + 70,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchPosts}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.background}
          />
        }
      />
      <Modal
        visible={isPostVisible}
        animationType="slide"
        onRequestClose={handleClosePost}
        hardwareAccelerated={true}
        transparent={true}
      >
        {postContent && (
          <ViewPostScreen post={postContent} close={handleClosePost} />
        )}
      </Modal>
      <Modal
        visible={isUserProfileOpen}
        animationType="slide"
        onRequestClose={() => setIsUserProfileOpen(false)}
        hardwareAccelerated={true}
        transparent={true}
      >
        {item && (
          <ViewUserOProfile
            user={item.user}
            close={() => setIsUserProfileOpen(false)}
          />
        )}
      </Modal>
      <Modal
        visible={isCommentsVisible}
        animationType="slide"
        onRequestClose={() => setIsCommentsVisible(false)}
        transparent={true}
      >
        {selectedPost && (
          <CommentsModal
            visible={isCommentsVisible}
            close={() => setIsCommentsVisible(false)}
            post={selectedPost}
            currentUser={currentUser}
            addComment={addComment}
            addReply={addReply}
          />
        )}
      </Modal>
      <Modal
        visible={isLikedUsersVisible}
        animationType="slide"
        onRequestClose={() => setIsLikedUsersVisible(false)}
        transparent={true}
      >
        {likedUsers.length !== 0 && (
          <LikedUsersModal
            visible={isLikedUsersVisible}
            close={() => setIsLikedUsersVisible(false)}
            users={likedUsers}
            onProfilePress={handleLikesProfilePress}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 0,
  },
});
