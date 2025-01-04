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

export default function HomeScreen({ navigation }) {
  const { posts, loading, fetchPosts, addComment, addReply } = usePost();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const { currentUser } = useAuth();

  const [isPostVisible, setIsPostVisible] = useState(false);
  const [postContent, setPostContent] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

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
          />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomTabBarHeight + 5 }}
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
