import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableWithoutFeedback,
  Modal,
  TouchableOpacity,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { globalStyles } from "../constants/styles";
import { usePost } from "../context/PostContext";
import ViewPostScreen from "./ViewPostScreen";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import ViewUserOProfile from "../utils/ViewUserOProfile";
import { useAuth } from "../context/AuthContext";
import { Image } from "expo-image";
import { socket } from "../constants/endpoints";

export default function HomeScreen({ navigation }) {
  const { posts, loading, fetchPosts } = usePost();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const { currentUser } = useAuth();

  const [isPostVisible, setIsPostVisible] = useState(false);
  const [postContent, setPostContent] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleClosePost = () => {
    setIsPostVisible(false);
    setPostContent(null);
  };

  const renderPost = ({ item }) => {
    if (!item) return null;
    const defaultAvatar =
      "https://storage.googleapis.com/vibe-link-public/default-user.jpg";
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          setIsPostVisible(true);
          setPostContent(item);
        }}
      >
        <View style={[globalStyles.card, styles.post]}>
          <View style={styles.postHeader}>
            <TouchableOpacity 
            style={styles.postHeader}
            onPress={()=>{
              if(item.user._id === currentUser._id){
                navigation.navigate("Profile");
                return;
              }
              setIsUserProfileOpen(true);
              setItem(item);
            }}
            >
              <Image
                source={{
                  uri: item.user.profileImage || defaultAvatar,
                }}
                style={styles.avatar}
                cachePolicy={"none"}
              />

              <Text style={styles.username}>{item.user.username}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.content}>{item.content}</Text>
          {item.image && (
            <Image
              source={{ uri: item.image ?? null }}
              style={styles.postImage}
            />
          )}
          <View style={styles.postFooter}>
            <Text style={styles.stats}>
              {item.likes.length || 0} likes • {item.comments.length || 0}{" "}
              comments
            </Text>
          </View>
          
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
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
            {item && <ViewUserOProfile
            user={item.user}
            close={()=>setIsUserProfileOpen(false)}
            />}
          </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingVertical: 0,
  },
  post: {
    marginBottom: 16,
    width: "100%",
    height: "auto",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  username: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  content: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stats: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
});
