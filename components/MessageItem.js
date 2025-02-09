import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { colors } from "../constants/primary";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";
const defaultAvatar =
  "https://storage.googleapis.com/vibelink-pub-bucket2/default-user.webp";

const OWN_MESSAGE_COLOR = colors.primary;
const OTHER_MESSAGE_COLOR = colors.card;
const OWN_MESSAGE_TEXT_COLOR = colors.textPrimary;
const OTHER_MESSAGE_TEXT_COLOR = colors.textPrimary;

const SharedPost = ({
  post,
  onClickPost,
  onLongPress,
  disabled = false,
  isOwn,
}) => {
  const user = post.user;

  return (
    <TouchableOpacity
      style={styles.sharedPost}
      onPress={() => {
        onClickPost(post);
      }}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <BlurView
        intensity={80}
        style={[
          styles.blur,
          isOwn && {
            backgroundColor: "rgba(255, 107, 107, 0.1)",
          },
        ]}
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
  ({
    message,
    isOwn,
    onClickPost = () => {},
    onClickImage = () => {},
    onLongPress,
    disabled = false,
  }) => {
    const { theme } = useTheme();

    const bubbleStyle = React.useMemo(
      () => [
        { ...styles.messageBubble, backgroundColor: theme.card },
        isOwn && { ...styles.ownMessage, backgroundColor: theme.primary },
      ],
      [isOwn]
    );

    function checkIfOnlyEmoji(text) {
      const emojiOnlyRegex = /^[\p{Emoji}\u200d]*$/u;
      const test = emojiOnlyRegex.test(text);
      return test;
    }

    function checkIfThereIsALink(text) {
      const linkRegex =
        /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/;
      const test = linkRegex.test(text);
      const links = text.match(linkRegex);
      return {
        test,
        links,
      };
    }

    const { test, links } = useMemo(
      () => checkIfThereIsALink(message.content),
      [message.content]
    );

    const renderTextWithLinks = (text) => {
      if (!test)
        return (
          <Text
            style={[
              styles.messageText,
              styles.textGlow,
              isOnlyEmoji && { fontSize: 50 },
            ]}
          >
            {text}
          </Text>
        );

      const parts = text.split(/(https?:\/\/[^\s]+)/g);
      return (
        <Text style={[styles.messageText, isOnlyEmoji && { fontSize: 50 }]}>
          {parts.map((part, index) => {
            if (part.match(/https?:\/\/[^\s]+/)) {
              return (
                <Text
                  key={index}
                  style={[
                    styles.messageText,
                    styles.link,
                    {
                      color: theme.accent,
                    },
                  ]}
                  onPress={() => Linking.openURL(part)}
                >
                  {part}
                </Text>
              );
            }
            return (
              <Text key={index} style={[styles.textGlow]}>
                {part}
              </Text>
            );
          })}
        </Text>
      );
    };
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
          <SharedPost
            post={message.sharedPost}
            onClickPost={onClickPost}
            onLongPress={onLongPress}
            disabled={disabled}
            isOwn={isOwn}
          />
        </View>
      );
    }

    if (message.media?.url) {
      return (
        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={1}
          style={bubbleStyle}
          disabled={disabled}
        >
          <TouchableOpacity
            onPress={() => onClickImage(message.media.url)}
            activeOpacity={0.8}
            onLongPress={onLongPress}
            disabled={disabled}
          >
            <Image
              source={{ uri: message.media.url }}
              style={styles.messageImage}
              cachePolicy="memory-disk"
              recyclingKey={message._id}
            />
          </TouchableOpacity>
          {message.content && renderTextWithLinks(message.content)}
        </TouchableOpacity>
      );
    }

    const isOnlyEmoji = useMemo(
      () => checkIfOnlyEmoji(message.content),
      [message.content]
    );

    return (
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={1}
        style={[bubbleStyle, isOnlyEmoji && { backgroundColor: "transparent" }]}
        disabled={disabled}
      >
        {renderTextWithLinks(message.content)}
      </TouchableOpacity>
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
    padding: 12,
    marginBottom: 8,
    borderRadius: 20,
    maxWidth: "80%",
    minWidth: 50,
    alignSelf: "flex-start",
  },
  ownMessage: {
    alignSelf: "flex-end",
  },
  messageText: {
    color: colors.textPrimary,
    alignSelf: "center",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  messageImage: {
    height: 200,
    width: 200,
    borderRadius: 16,
    backgroundColor: OTHER_MESSAGE_COLOR,
    marginBottom: 8,
  },
  sharedPost: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: 250,
    minHeight: 80,
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
  link: {
    color: colors.accent,
    textDecorationLine: "underline",
  },
  textGlow: {
    ...Platform.select({
      ios: {
        shadowColor: "#fff",
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

export default MessageItem;
