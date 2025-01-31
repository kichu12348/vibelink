import React, { useState, memo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { colors, fontSizes } from "../constants/primary";
import { globalStyles } from "../constants/styles";
import { usePost } from "../context/PostContext";
import { useAuth } from "../context/AuthContext";
import { useError } from "../context/ErrorContext";
import { useTheme } from "../context/ThemeContext";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';

// Wrapper component to handle hooks
const PostContainer = ({
  item,
  onPostPress,
  onProfilePress,
  openComments,
  openLikes = () => {},
}) => {
  const { likePost, unlikePost, posts } = usePost();
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  return (
    <RenderPost
      item={item}
      onPostPress={onPostPress}
      onProfilePress={onProfilePress}
      likePost={likePost}
      unLikePost={unlikePost}
      posts={posts}
      currentUser={currentUser}
      openComments={openComments}
      openLikes={openLikes}
      theme={theme}
    />
  );
};

const RenderPost = memo(
  ({
    item,
    onPostPress,
    onProfilePress,
    likePost,
    unLikePost,
    posts,
    currentUser,
    openComments,
    openLikes,
    theme,
  }) => {
    if (!item) return null;
    const defaultAvatar =
      "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

    const hasLiked = (item) => {
      const find = item.likes.find((like) => like?._id === currentUser?._id);
      return find ? true : false;
    };

    const [liked, setLiked] = useState(hasLiked(item));

    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const likeScale = useSharedValue(1);

    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [shadowColor, setShadowColor] = useState("rgba(255, 255, 255, 1)");
    const [isLiking, setIsLiking] = useState(false);

    const { showError } = useError();
    const animateHeartLike = useCallback(() => {
      setShowLikeAnimation(true);
      scale.value = withSequence(
        withSpring(1.5, { damping: 4, stiffness: 80 }),
        withSpring(1, { damping: 4, stiffness: 80 }),
        withTiming(0, { duration: 300 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
    }, []);

    useEffect(() => {
      setLiked(() => {
        const post = posts.find((p) => p?._id === item?._id);
        return hasLiked(post);
      });
    }, [posts]);

    const clickLike = async () => {
      if (isLiking) return;
      setIsLiking(true);
      try {
        likeScale.value = withSequence(
          withSpring(0.8, { damping: 4 }),
          withSpring(1.2, { damping: 4 }),
          withSpring(1, { damping: 4 })
        );
        
        if (liked) {
          await unLikePost(item?._id);
        } else {
          await likePost(item?._id);
          animateHeartLike();
        }
        setIsLiking(false);
      } catch (error) {
        showError(error.message);
        setIsLiking(false);
      }
    };

    const heartAnimationStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    });

    const likeButtonStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: likeScale.value }],
      };
    });

    const styles = StyleSheet.create({
      post: {
        marginBottom: 16,
        width: "95%",
        alignSelf: "center",
        height: "auto",
        zIndex: 99,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0.8,
      },
      postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      },
      username: {
        color: theme.textPrimary,
        fontSize: fontSizes.md,
        fontWeight: "600",
      },
      content: {
        color: theme.textPrimary,
        fontSize: fontSizes.md,
        marginBottom: 12,
      },
      postImage: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
      },
      avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
      },
      postFooter: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 5,
      },
      postImageContainer: {
        width: "100%",
        height: 300,
        borderRadius: 10,
        marginVertical: 8,
        overflow: "hidden",
      },
      heartAnimationContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -40 }, { translateY: -40 }],
        justifyContent: "center",
        alignItems: "center",
      },
      likesButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
    });

    return (
      <TouchableWithoutFeedback onPress={() => onPostPress(item)}>
        <View
          style={[
            globalStyles.card,
            styles.post,
            {
              backgroundColor: item.image ? item.color : theme.card,
              shadowColor: shadowColor,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.postHeader}
            onPress={() => onProfilePress(item)}
          >
            <Image
              source={{
                uri: item.user.profileImage || defaultAvatar,
              }}
              style={styles.avatar}
              cachePolicy={"memory-disk"}
            />
            <Text style={styles.username}>{item.user.username}</Text>
          </TouchableOpacity>

          <Text style={styles.content}>{item.content}</Text>
          {item.image && (
            <View style={styles.postImageContainer}>
              <ImageBackground
                source={{ uri: item.image ?? null }}
                style={styles.postImage}
                cachePolicy={"memory-disk"}
              >
                <Animated.View
                  style={[
                    styles.heartAnimationContainer,
                    heartAnimationStyle,
                  ]}
                >
                  <Ionicons name="heart" size={80} color={colors.error} />
                </Animated.View>
              </ImageBackground>
            </View>
          )}
          <View style={styles.postFooter}>
            <Animated.View style={likeButtonStyle}>
              <TouchableOpacity
                onPress={clickLike}
                style={styles.likesButton}
                disabled={isLiking}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={30}
                  color={liked ? colors.error : theme.textPrimary}
                />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              style={[styles.likesButton, { marginLeft: 10 }]}
              onPress={() => openLikes(item)}
            >
              <Text
                style={{
                  color: liked ? colors.error : theme.textPrimary,
                }}
              >
                {item.likes.length} {item.likes.length > 1 ? "likes" : "like"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openComments(item)}
              style={[styles.likesButton, { marginLeft: 20 }]}
            >
              <FontAwesome5
                name="comment"
                size={24}
                color={theme.textPrimary}
              />
              <Text style={{ color: theme.textPrimary, marginLeft: 5 }}>
                {item.comments.length}{" "}
                {item.comments.length > 1 ? "comments" : "comment"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
);

export default PostContainer;
