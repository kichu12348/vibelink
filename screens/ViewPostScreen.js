import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Comment = ({ comment, postId, setComments }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const { currentUser } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const { addReply } = usePost();

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
              {
                user: currentUser,
                content: replyContent,
              },
            ],
          };
        }
        return c;
      });
      return updatedComments;
    });
    setShowReplyInput(false);
  };

  const defaultAvatar = "https://storage.googleapis.com/vibe-link-public/default-user.jpg";
    

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image
          source={{
            uri: comment.user.profileImage || defaultAvatar,
          }}
          style={styles.commentAvatar}
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
              source={{
                uri:
                  reply.user.profileImage ||  defaultAvatar,
              }}
              style={styles.replyAvatar}
            />
            <Text style={styles.replyUsername}>{reply.user.username}</Text>
          </View>
          <Text style={styles.replyContent}>{reply.content}</Text>
        </View>
      ))}
    </View>
  );
};

const ViewPostScreen = ({ post, close = () => {} }) => {
  const { likePost, unlikePost, addComment, getPostCommentUser, deletePost } = usePost();
  const { currentUser } = useAuth();
  // Initialize comments state with empty array if post.comments is null
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");

  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  const [hasLiked, setHasLiked] = useState(
    post.likes?.includes(currentUser?._id)
  );
  const insets = useSafeAreaInsets();

  // Add useEffect to update comments when post changes
  useEffect(() => {
    const fetchCommentsWithUsers = async () => {
      let comments = await Promise.all(
        post.comments.map(async (comment) => {
          // Fetch user for the comment if not already an object
          if (typeof comment.user !== "object") {
            comment.user = await getPostCommentUser(comment.user);
          }

          // Populate replies with user data
          comment.replies = await Promise.all(
            comment.replies.map(async (reply) => {
              if (typeof reply.user !== "object") {
                reply.user = await getPostCommentUser(reply.user);
              }
              return reply;
            })
          );

          return comment;
        })
      );

      setComments(comments);
    };

    fetchCommentsWithUsers();
  }, [post]);

  useEffect(() => {
    if (post?.comments && comments.length === 0) {
      setComments(post.comments);
    }
  }, [post]);

  const handleLike = async () => {
    if (hasLiked) {
      await unlikePost(post._id);
      setHasLiked(false);
      setLikeCount((c) => (c > 0 ? c - 1 : 0));
    } else {
      await likePost(post._id);
      setHasLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

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

  const defaultAvatar = "https://storage.googleapis.com/vibe-link-public/default-user.jpg";
    

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { paddingVertical: insets.top + 8 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={30} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <Image
              source={{
                uri:
                  post.user.profileImage || defaultAvatar
               }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{post.user.username}</Text>
          </View>

          <Text style={styles.content}>{post.content}</Text>

          {post.image && (
            <Image
              source={{ uri: post.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Ionicons
                name={hasLiked ? "heart" : "heart-outline"}
                size={24}
                color={hasLiked ? colors.primary : colors.textPrimary}
              />
              <Text style={styles.actionText}>{likeCount || 0}</Text>
            </TouchableOpacity>
            {post.user._id === currentUser?._id && (
              <TouchableOpacity onPress={async () => {
                await deletePost(post._id);
                close();
              }}>
                <Ionicons name="trash-outline" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>Comments</Text>
          {comments.map((comment, index) => (
            <Comment
              key={index}
              comment={comment}
              postId={post._id}
              setComments={setComments}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={commentContent}
          onChangeText={setCommentContent}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity onPress={handleComment}>
          <Ionicons name="send" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  username: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  content: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  postImage: {
    minWidth: "100%",
    minHeight: 400,
    borderRadius: 10,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    color: colors.textSecondary,
  },
  commentsSection: {
    padding: 16,
  },
  commentsHeader: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  commentInput: {
    flex: 1,
    marginRight: 12,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  // Comment styles
  commentContainer: {
    marginBottom: 16,
    paddingLeft: 8,
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
  // Reply styles
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
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 8,
  },
});

export default ViewPostScreen;
