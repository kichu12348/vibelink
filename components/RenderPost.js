import React, { useState, memo, useEffect, useRef,useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { colors, fontSizes } from "../constants/primary";
import { globalStyles } from "../constants/styles";
import { usePost } from "../context/PostContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { endPoint } from "../constants/endpoints";
import { useError } from "../context/ErrorContext";

// Wrapper component to handle hooks
const PostContainer = ({
  item,
  onPostPress,
  onProfilePress,
  openComments
}) => {
  const { likePost, unlikePost, posts } = usePost();
  const { currentUser } = useAuth();

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
  }) => {
    if (!item) return null;
    const defaultAvatar =
      "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

    const [liked, setLiked] = useState(item.likes.includes(currentUser?._id));

    const likeAnimation = useRef(new Animated.Value(0)).current;
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [color,setColor] = useState(colors.card);
    const [shadowColor,setShadowColor] = useState("rgba(255, 255, 255, 1)");

    const {showError}=useError();


    const isColorCloseToWhite = (color) => {
      const rgb = color.split("(")[1].split(")")[0].split(",");
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      const threshold = 200;
      const res= r > threshold && g > threshold && b > threshold;
      const toneDown = 0.5;
      const tonedDownColor = `rgb(${r * toneDown},${g * toneDown},${b * toneDown})`;
      const rgba = `rgba(${r},${g},${b},0.5)`;
      return [res, tonedDownColor, rgba];
    };


    async function getColor(){
      if(!item.image) return;
      await axios.post(`${endPoint}/api/posts/getColor`, {url:item.image}).then((res)=>{
        const [isWhite, tonedDownColor,shadowColor] = isColorCloseToWhite(res.data.rgb);
        if(isWhite){
          setShadowColor(shadowColor);
          setColor(tonedDownColor);
          return;
        }
        setColor(res.data.rgb);
        
        const rgba = res.data.rgb.split("(")[1].split(")")[0].split(",");
        const shadow = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},0.5)`;
        setShadowColor(shadow);
      }).catch((err)=>{
        return;
      });
      
    };

    useLayoutEffect(()=>{
      getColor();
    },[]) // runs when the component is mounted


    

    const animateHeartLike = () => {
      setShowLikeAnimation(true);
      likeAnimation.setValue(0);

      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowLikeAnimation(false);
      });
    };

    useEffect(() => {
      setLiked(() => {
        const post = posts.find((p) => p?._id === item?._id);
        return post.likes.includes(currentUser?._id);
      });
    }, [posts]);

    const clickLike = async () => {
      try {
        if (liked) {
          await unLikePost(item?._id);
        } else {
          await likePost(item?._id);
          animateHeartLike();
        }
      } catch (error) {
        showError(error.message);
      }
    };

    const heartScale = likeAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.7, 1.5, 0.7],
    });

    const heartOpacity = likeAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    });

    return (
      <TouchableWithoutFeedback onPress={() => onPostPress(item)}>
        <View style={[globalStyles.card, styles.post,{backgroundColor:color,shadowColor:shadowColor}]}>
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
                {showLikeAnimation && (
                  <Animated.View
                    style={[
                      styles.heartAnimationContainer,
                      {
                        transform: [{ scale: heartScale }],
                        opacity: heartOpacity,
                      },
                    ]}
                  >
                    <Ionicons name="heart" size={80} color={colors.primary} />
                  </Animated.View>
                )}
              </ImageBackground>
            </View>
          )}
          <View style={styles.postFooter}>
            <TouchableOpacity
              onPress={clickLike}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={30}
                color={liked ? colors.primary : colors.textPrimary}
              />
              <Text
                style={{
                  color: liked ? colors.primary : colors.textPrimary,
                  marginLeft: 5,
                }}
              >
                {item.likes.length} {item.likes.length > 1 ? "likes" : "like"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openComments(item)}>
              <FontAwesome5
                name="comment"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
);

const styles = StyleSheet.create({
  post: {
    marginBottom: 16,
    width: "95%",
    alignSelf: "center",
    height: "auto",
    zIndex: 99,
    backgroundColor: colors.card,
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
    gap: 20,
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
});

export default PostContainer;
