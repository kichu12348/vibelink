import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { Ionicons, FontAwesome} from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useMessage } from "../context/MessageContext";
import { socket } from "../constants/endpoints"; // Add this import
import * as Notifications from "expo-notifications"; // Add this import
import ImageViewer from "../utils/imageViewer";

const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const Comment = ({ comment, postId, setComments }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const { currentUser } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const { addReply } = usePost();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
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
    setIsReplying(false);
  };

  const defaultAvatar =
    "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image
          source={{
            uri: comment.user.profileImage || defaultAvatar,
          }}
          style={styles.commentAvatar}
          cachePolicy={"memory-disk"}
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
          <TouchableOpacity onPress={handleReply} disabled={isReplying}>
            <Text style={[styles.sendButton, isReplying && { opacity: 0.5 }]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {comment.replies?.map((reply, index) => (
        <View key={index} style={styles.replyContainer}>
          <View style={styles.commentHeader}>
            <Image
              source={{
                uri: reply.user.profileImage || defaultAvatar,
              }}
              style={styles.replyAvatar}
              cachePolicy={"memory-disk"}
            />
            <Text style={styles.replyUsername}>{reply.user.username}</Text>
          </View>
          <Text style={styles.replyContent}>{reply.content}</Text>
        </View>
      ))}
    </View>
  );
};

const ShareModal = ({
  visible,
  onClose,
  onShare,
  conversations,
  currentUser,
}) => {
  const firstRowUsers = conversations.slice(
    0,
    Math.min(3, conversations.length)
  );
  const remainingUsers = conversations.slice(Math.min(3, conversations.length));

  const renderUserItem = (conversation) => {
    const otherUser = conversation.participants.find(
      (p) => p.user?._id !== currentUser._id
    )?.user;
    return (
      <TouchableOpacity
        style={styles.shareGridItem}
        onPress={() => onShare(conversation, otherUser)}
      >
        <Image
          source={{ uri: otherUser.profileImage || defaultAvatar }}
          style={styles.shareGridAvatar}
          contentFit="cover"
        />
        <Text style={styles.shareGridUsername} numberOfLines={1}>
          {otherUser.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share with</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.firstRow}>
                {firstRowUsers.map((item, index) => (
                  <View key={item._id} style={{ flex: 1 }}>
                    {renderUserItem(item)}
                  </View>
                ))}
              </View>
              <View style={styles.shareGrid}>
                {remainingUsers.map((item) => (
                  <View key={item._id} style={styles.gridItemContainer}>
                    {renderUserItem(item)}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const ViewPostScreen = ({ post, close = () => {} }) => {
  const { likePost, unlikePost, addComment, getPostCommentUser, deletePost } =
    usePost();

    const hasLikedPost = (item)=>{
      const find = item.likes.find((like) => like._id === currentUser?._id);
      return find ? true : false;
    }
  const { currentUser } = useAuth();
  const { conversations, sendMessage } = useMessage();
  const [showShareModal, setShowShareModal] = useState(false);
  // Initialize comments state with empty array if post.comments is null
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [hasLiked, setHasLiked] = useState(hasLikedPost(post));
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isLiking, setIsLiking] = useState(false);



const insets = useSafeAreaInsets();
  const timestamp = useMemo(() => {
    return new Date(post.createdAt).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [post.createdAt]);

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
    if (isLiking) return;
    setIsLiking(true);
    if (hasLiked) {
      await unlikePost(post._id);
      setHasLiked(false);
    } else {
      await likePost(post._id);
      setHasLiked(true);
    }
    setIsLiking(false);
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    setIsCommenting(true);
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
    setIsCommenting(false);
  };

  const handleShare = (conversation, otherUser) => {
    sendMessage(conversation._id, "", otherUser._id, null, post);
    setShowShareModal(false);
  };

  useEffect(() => {
    if (socket) {
      // Add null check
      socket.on("postUpdated", (updatedPost) => {
        if (updatedPost._id === post._id) {
          setLikeCount(updatedPost.likes.length);
          setHasLiked(hasLikedPost(updatedPost));
        }
      });

      return () => {
        socket.off("postUpdated");
      };
    }
  }, [post._id, currentUser?._id]);

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Notification permissions not granted");
      }
    };

    requestPermissions();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={close}>
            <Ionicons name="close" size={30} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Image
                source={{
                  uri: post.user?.profileImage || defaultAvatar,
                }}
                style={styles.avatar}
                cachePolicy={"memory-disk"}
              />
              <Text style={styles.username}>{post.user?.username || ""}</Text>
            </View>

            <Text style={styles.content}>{post.content}</Text>

            {post.image && (
              <TouchableOpacity onPress={() => setShowImageViewer(true)}>
                <Image
                  source={{ uri: post.image }}
                  style={styles.postImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}
            <Text
              style={[
                styles.content,
                {
                  color: colors.textSecondary,
                  fontSize: fontSizes.sm,
                  marginTop: 8,
                },
              ]}
            >
              {timestamp}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleLike}
                style={styles.actionButton}
                disabled={isLiking}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={hasLiked ? colors.primary : colors.textPrimary}
                />
                <Text style={styles.actionText}>{likeCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowShareModal(true)}
                style={styles.actionButton}
              >
                <FontAwesome name="send-o" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              {post.user?._id === currentUser?._id && (
                <TouchableOpacity
                  onPress={async () => {
                    await deletePost(post._id);
                    close();
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={colors.textPrimary}
                  />
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
        <View style={styles.floatConatinerContainer}>
          <View style={styles.floatingContainer}>
            <View style={styles.commentInputContainer}>
              <BlurView intensity={20} style={styles.blur} tint="dark" />
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textSecondary}
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
                <Ionicons name="send" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
          conversations={conversations}
          currentUser={currentUser}
        />
        <Modal
          visible={showImageViewer}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageViewer(false)}
        >
          <ImageViewer
            uri={post.image}
            close={() => setShowImageViewer(false)}
          />
        </Modal>
      </KeyboardAvoidingView>
    </View>
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
    justifyContent: "space-between",
    width: "99%",
    alignSelf: "center",
    padding: 5,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginBottom: Platform.OS === "android" ? 5 : 0,
  },
  commentInput: {
    flex: 1,
    marginRight: 12,
    padding: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "transparent",
    width: "100%",
    height: "60%",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  shareItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  shareAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  shareUsername: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  blur: {
    position: "absolute",
    backgroundColor:
      Platform.OS === "ios" ? "rgba(35, 37, 47, 0.3)" : "rgba(35, 37, 47, 0.8)",
    ...StyleSheet.absoluteFillObject,
  },
  floatingContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  floatConatinerContainer: {
    height: 1,
    position: "relative",
  },
  scrollViewContent: {
    paddingBottom: 150,
  },
  firstRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  shareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  gridItemContainer: {
    width: "33.33%",
    padding: 4,
  },
  shareGridItem: {
    alignItems: "center",
    padding: 12,
    flex: 1,
  },
  shareGridAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  shareGridUsername: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default ViewPostScreen;
