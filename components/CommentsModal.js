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
  Dimensions,
  Keyboard,
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSizes } from "../constants/primary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePost } from "../context/PostContext";

const Comment = ({ comment, postId, setComments, currentUser, addReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const defaultAvatar =
    "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await addReply(postId, comment._id, replyContent);
    setReplyContent("");
    setComments((prev) => {
      const updatedComments = prev.map((c) => {
        if (c._id === comment._id) {
          return {
            ...c,
            replies: [
              ...c.replies,
              { user: currentUser, content: replyContent },
            ],
          };
        }
        return c;
      });
      return updatedComments;
    });
    setShowReplyInput(false);
  };

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: comment.user.profileImage || defaultAvatar }}
          style={styles.commentAvatar}
          cachePolicy={"none"}
        />
        <Text style={styles.commentUsername}>{comment.user.username}</Text>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>

      <TouchableOpacity
        onPress={() => setShowReplyInput(!showReplyInput)}
        style={styles.replyButton}
      >
        <Text style={styles.replyButtonText}>Reply</Text>
      </TouchableOpacity>

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={replyContent}
            onChangeText={setReplyContent}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity onPress={handleReply}>
            <Text style={styles.sendButton}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {comment.replies?.map((reply, index) => (
        <View key={index} style={styles.replyContainer}>
          <View style={styles.commentHeader}>
            <Image
              source={{ uri: reply.user.profileImage || defaultAvatar }}
              style={styles.replyAvatar}
              cachePolicy={"none"}
            />
            <Text style={styles.replyUsername}>{reply.user.username}</Text>
          </View>
          <Text style={styles.replyContent}>{reply.content}</Text>
        </View>
      ))}
    </View>
  );
};

const CommentsModal = ({ close, post, currentUser, addComment, addReply }) => {
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const { getPostCommentUser } = usePost();

  useEffect(() => {
    const fetchCommentsWithUsers = async () => {
      let commentsWithUsers = Promise.all(
        comments.map(async (comment) => {
          if (typeof comment.user === "object") return comment;
          let replies = Promise.all(
            comment.replies.map(async (reply) => {
              if (typeof reply.user === "object") return reply;
              let user = await getPostCommentUser(reply.user);
              reply.user = await user;
              return reply;
            })
          );
          comment.replies = await replies;
          comment.user = await getPostCommentUser(comment.user);
          return comment;
        })
      );
      setComments(await commentsWithUsers);
    };
    fetchCommentsWithUsers();
  }, [post]);

  const windowHeight = Dimensions.get("window").height;

  const insets = useSafeAreaInsets();

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    await addComment(post._id, commentContent);
    setComments((prev) => [
      ...prev,
      {
        user: currentUser,
        content: commentContent,
        replies: [],
      },
    ]);
    setCommentContent("");
  };

  return (
    <View style={styles.container}>
      <BlurView
        intensity={20}
        style={styles.blur}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={12}
      >
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 0}
          >
            <ScrollView
              style={styles.commentsScroll}
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
                />
              ))}
            </ScrollView>
            <View style={styles.floatContainerContainer}>
              <View style={styles.floatingContainer}>
                <View style={styles.commentInputContainer}>
                  <BlurView
                    intensity={20}
                    style={styles.inputBlur}
                    tint="dark"
                  />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.textSecondary}
                    value={commentContent}
                    onChangeText={setCommentContent}
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity onPress={handleComment}>
                    <Ionicons name="send" size={24} color={colors.primary} />
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.card,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  commentContent: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  replyContent: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginLeft: 32,
  },
  replyButton: {
    marginLeft: 40,
    marginTop: 4,
  },
  replyButtonText: {
    color: colors.primary,
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
    backgroundColor: colors.background,
    borderRadius: 16,
    marginRight: 8,
    color: colors.textPrimary,
  },
  sendButton: {
    color: colors.primary,
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
    color: colors.textPrimary,
    maxHeight: 100,
  },
});

export default CommentsModal;