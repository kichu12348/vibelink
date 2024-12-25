import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useMessage } from "../context/MessageContext";
import { socket } from "../constants/endpoints"; // Add this import
import * as Notifications from 'expo-notifications'; // Add this import


const defaultAvatar = "https://storage.googleapis.com/vibe-link-public/default-user.jpg";
    

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


const ShareModal = ({ visible, onClose, onShare, conversations, currentUser }) => (
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
          <FlatList
            data={conversations}
            keyExtractor={item => item?._id}
            renderItem={({ item }) => {
              const otherUser = item.participants.find(
                p => p.user?._id !== currentUser._id
              )?.user;
              return (
                <TouchableOpacity
                  style={styles.shareItem}
                  onPress={() => onShare(item, otherUser)}
                >
                  <Image
                    source={{ uri: otherUser.profileImage || defaultAvatar }}
                    style={styles.shareAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.shareUsername}>{otherUser.username}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </BlurView>
  </Modal>
);

const ViewPostScreen = ({ post, close = () => {} }) => {
  const { likePost, unlikePost, addComment, getPostCommentUser, deletePost } = usePost();
  const { currentUser } = useAuth();
  const { conversations, sendMessage } = useMessage();
  const [showShareModal, setShowShareModal] = useState(false);
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

  const handleShare = (conversation, otherUser) => {
    sendMessage(conversation._id, "", otherUser._id, null, post);
    setShowShareModal(false);
  };

  useEffect(() => {
    if (socket) {  // Add null check
        socket.on("postUpdated", (updatedPost) => {
            if (updatedPost._id === post._id) {
                setLikeCount(updatedPost.likes.length);
                setHasLiked(updatedPost.likes.includes(currentUser?._id));
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
        if (status !== 'granted') {
            console.log('Notification permissions not granted');
        }
    };

    requestPermissions();

    // Add notification response handler
    const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
        const postId = response.notification.request.content.data.postId;
        // Handle notification tap here
        console.log('Notification tapped:', postId);
    });

    return () => {
        Notifications.removeNotificationSubscription(notificationListener);
    };
  }, []);

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
                  post.user?.profileImage || defaultAvatar
               }}
              style={styles.avatar}
              cachePolicy={"none"}
            />
            <Text style={styles.username}>{post.user?.username||""}</Text>
          </View>

          <Text style={styles.content}>{post.content}</Text>

          {post.image && (
            <Image
              source={{ uri: post.image }}
              style={styles.postImage}
              contentFit="cover"
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
            <TouchableOpacity 
              onPress={() => setShowShareModal(true)} 
              style={styles.actionButton}
            >
              <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            {post.user?._id === currentUser?._id && (
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
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
        conversations={conversations}
        currentUser={currentUser}
      />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '60%',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewPostScreen;
