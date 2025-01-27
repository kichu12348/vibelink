import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { fontSizes } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const Comment = ({
  comment,
  postId,
  setComments,
  currentUser,
  addReply,
  theme,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const defaultAvatar =
    "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
    await addReply(postId, comment._id, replyContent.trim());
    setReplyContent("");
    setComments((prev) => {
      const updatedComments = prev.map((c) => {
        if (c._id === comment._id) {
          return {
            ...c,
            replies: [
              ...c.replies,
              { user: currentUser, content: replyContent.trim() },
            ],
          };
        }
        return c;
      });
      return updatedComments;
    });
    setIsReplying(false);
    setShowReplyInput(false);
  };

  return (
    <View style={styles(theme).commentContainer}>
      <View style={styles(theme).commentHeader}>
        <Image
          source={{ uri: comment.user.profileImage || defaultAvatar }}
          style={styles(theme).commentAvatar}
          cachePolicy={"memory-disk"}
        />
        <Text style={styles(theme).commentUsername}>
          {comment.user.username}
        </Text>
      </View>
      <Text style={styles(theme).commentContent}>{comment.content}</Text>

      <TouchableOpacity
        onPress={() => setShowReplyInput(!showReplyInput)}
        style={styles(theme).replyButton}
      >
        <Text style={styles(theme).replyButtonText}>Reply</Text>
      </TouchableOpacity>

      {showReplyInput && (
        <View style={styles(theme).replyInputContainer}>
          <TextInput
            style={styles(theme).replyInput}
            placeholder="Write a reply..."
            value={replyContent}
            onChangeText={setReplyContent}
            placeholderTextColor={theme.textSecondary}
          />
          <TouchableOpacity onPress={handleReply} disabled={isReplying}>
            <Text
              style={[styles(theme).sendButton, isReplying && { opacity: 0.5 }]}
            >
              Send
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {comment.replies?.map((reply, index) => (
        <View key={index} style={styles(theme).replyContainer}>
          <View style={styles(theme).commentHeader}>
            <Image
              source={{ uri: reply.user.profileImage || defaultAvatar }}
              style={styles(theme).replyAvatar}
              cachePolicy={"memory-disk"}
            />
            <Text style={styles(theme).replyUsername}>
              {reply.user.username}
            </Text>
          </View>
          <Text style={styles(theme).replyContent}>{reply.content}</Text>
        </View>
      ))}
    </View>
  );
};

const CommentsModal = ({ close, post, currentUser, addComment, addReply }) => {
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [isCommenting, setIsCommenting] = useState(false);

  const { theme } = useTheme();

  const insets = useSafeAreaInsets();

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    setIsCommenting(true);
    await addComment(post._id, commentContent.trim());
    setComments((prev) => [
      ...prev,
      {
        user: currentUser,
        content: commentContent.trim(),
        replies: [],
      },
    ]);
    setCommentContent("");
    setIsCommenting(false);
  };

  return (
    <View style={styles(theme).container}>
      <BlurView
        intensity={20}
        style={styles(theme).blur}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={12}
      >
        <View style={[styles(theme).content, { paddingBottom: insets.bottom }]}>
          <View style={styles(theme).header}>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles(theme).headerTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles(theme).keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 0}
          >
            <ScrollView
              style={styles(theme).commentsScroll}
              contentContainerStyle={{
                paddingBottom: 150,
                paddingTop: 16,
              }}
              showsVerticalScrollIndicator={false}
            >
              {comments.map((comment, index) => (
                <Comment
                  key={index}
                  comment={comment}
                  postId={post._id}
                  setComments={setComments}
                  currentUser={currentUser}
                  addReply={addReply}
                  theme={theme}
                />
              ))}
            </ScrollView>
            <View style={styles(theme).floatContainerContainer}>
              <View style={styles(theme).floatingContainer}>
                <View style={styles(theme).commentInputContainer}>
                  <BlurView
                    intensity={20}
                    style={styles(theme).inputBlur}
                    tint="dark"
                  />
                  <TextInput
                    style={styles(theme).commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={theme.textSecondary}
                    value={commentContent}
                    onChangeText={setCommentContent}
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity
                    onPress={handleComment}
                    disabled={isCommenting}
                    style={{
                      opacity:
                        commentContent.trim() === "" || isCommenting ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="send" size={24} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </BlurView>
    </View>
  );
};

const styles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    blur: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    content: {
      height: "80%",
      width: "100%",
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    headerTitle: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    keyboardView: {
      flex: 1,
    },
    commentsScroll: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    input: {
      flex: 1,
      marginRight: 16,
      color: theme.textPrimary,
      fontSize: fontSizes.md,
    },
    commentContainer: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
    },
    commentUsername: {
      fontSize: fontSizes.sm,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    commentContent: {
      fontSize: fontSizes.md,
      color: theme.textPrimary,
      marginLeft: 40,
    },
    replyContainer: {
      marginTop: 8,
      marginLeft: 40,
    },
    replyAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
    },
    replyUsername: {
      fontSize: fontSizes.sm,
      fontWeight: "500",
      color: theme.textPrimary,
    },
    replyContent: {
      fontSize: fontSizes.sm,
      color: theme.textPrimary,
      marginLeft: 32,
    },
    replyButton: {
      marginLeft: 40,
      marginTop: 4,
    },
    replyButtonText: {
      color: theme.primary,
      fontSize: fontSizes.sm,
    },
    replyInputContainer: {
      marginLeft: 40,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    replyInput: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 16,
      marginRight: 8,
      color: theme.textPrimary,
    },
    sendButton: {
      color: theme.primary,
      fontWeight: "600",
    },
    floatContainerContainer: {
      height: 1,
      position: "relative",
    },
    floatingContainer: {
      position: "absolute",
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    commentInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "99%",
      alignSelf: "center",
      padding: 5,
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      marginBottom: Platform.OS === "android" ? 5 : 0,
      backgroundColor: "rgba(0,0,0, 0.6)",
    },
    inputBlur: {
      position: "absolute",
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    commentInput: {
      flex: 1,
      marginRight: 12,
      padding: 8,
      color: theme.textPrimary,
      maxHeight: 100,
    },
  });

export default CommentsModal;
