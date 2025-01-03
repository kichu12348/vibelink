import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Image } from "expo-image";
import { colors } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { BlurView } from "expo-blur";
const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const SharedPost = ({ post, onClickPost }) => {
  const [user, setUser] = React.useState(null);
  const { getPostCommentUser } = usePost();
  React.useEffect(() => {
    const fetchUser = async () => {
      const user = await getPostCommentUser(post.user);
      setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <TouchableOpacity
      style={styles.sharedPost}
      onPress={() => {
        const p = post;
        p.user = user;
        onClickPost(p);
      }}
    >
      <BlurView
        intensity={80}
        style={styles.blur}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={5}
      />
      <View style={styles.sharedPostHeader}>
        <Image
          source={{ uri: user?.profileImage || defaultAvatar }}
          style={styles.sharedPostAvatar}
        />
        <Text style={styles.sharedPostUsername}>{user?.username}</Text>
      </View>
      <Text style={styles.sharedPostContent} numberOfLines={2}>
        {post.content}
      </Text>
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.sharedPostImage}
          contentFit="cover"
        />
      )}
    </TouchableOpacity>
  );
};

const MessageItem = React.memo(
  ({ message, isOwn, onClickPost = () => {}, onClickImage = () => {} }) => {
    const bubbleStyle = React.useMemo(
      () => [styles.messageBubble, isOwn && styles.ownMessage],
      [isOwn]
    );

    const timestamp = React.useMemo(() => {
      const date = new Date(message.createdAt);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
      });
    }, [message.createdAt]);
    if (!message?.content && !message?.media?.url && !message.sharedPost)
      return null;

    if (message.sharedPost) {
      return (
        <View
          style={[
            styles.postContainer,
            isOwn ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
          ]}
        >
          <SharedPost post={message.sharedPost} onClickPost={onClickPost} />
          <Text
            style={[
              styles.timestamp,
              {
                alignSelf: isOwn ? "flex-end" : "flex-start",
              },
            ]}
          >
            {timestamp}
          </Text>
        </View>
      );
    }

    if (message.media?.url) {
      return (
        <View style={bubbleStyle}>
          <TouchableOpacity onPress={() => onClickImage(message.media.url)}>
            <Image
              source={{ uri: message.media.url }}
              style={styles.messageImage}
              cachePolicy="memory-disk"
              recyclingKey={message._id}
            />
          </TouchableOpacity>
          {message.content && (
            <Text numberOfLines={20} style={styles.messageText}>
              {message.content}
            </Text>
          )}
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      );
    }

    return (
      <View style={bubbleStyle}>
        <Text numberOfLines={20} style={styles.messageText}>
          {message.content}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message._id === nextProps.message._id &&
      prevProps.isOwn === nextProps.isOwn
    );
  }
);

const styles = StyleSheet.create({
  messageBubble: {
    backgroundColor: colors.card,
    padding: 12,
    marginBottom: 8,
    borderRadius: 16,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  ownMessage: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  messageImage: {
    height: 200,
    width: 200,
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  sharedPost: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: 250,
    minHeight: 350,
    position: "relative",
    overflow: "hidden",
  },
  sharedPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sharedPostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  sharedPostUsername: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  sharedPostContent: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  sharedPostImage: {
    height: 300,
    width: "100%",
    borderRadius: 10,
    marginTop: 8,
  },
  postContainer: {
    marginVertical: 5,
    maxWidth: 400,
    overflow: "hidden",
  },
  blur: {
    position: "absolute",
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,26,32,0.5)",
  },
});

export default MessageItem;
