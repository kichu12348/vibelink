import React, { memo, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Animated,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../constants/primary";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { usePost } from "../context/PostContext";
import ViewPostScreen from "./ViewPostScreen";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import axios from "axios";
import { endPoint } from "../constants/endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditProfileModal from "../utils/editProfile";
import ViewUserOProfile from "../utils/ViewUserOProfile";
import { Image } from "expo-image";
import { useError } from "../context/ErrorContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useJournal } from "../context/JournalContext";

const PinBox = memo(({ num, setUpPin, theme, isKeysDisabled }) => {
  return (
    <View
      style={{
        width: "80%",
        aspectRatio: 1,
      }}
    >
      {/* Number grid container */}
      <View style={styles.pinKeysContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "->"].map((num, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.pinKey, { backgroundColor: theme.card }]}
            onPress={() => num !== null && setUpPin(num)}
            disabled={isKeysDisabled}
          >
            {num === "->" ? (
              <Ionicons name="arrow-forward" size={24} color="white" />
            ) : (
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                {num}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const RenderPost = ({
  post,
  setPostContent,
  setIsPostVisible,
  currentUser,
}) => {
  const [overlayOpacity] = useState(new Animated.Value(0));
  const hasLiked = (item) => {
    const find = item.likes.find((like) => like._id === currentUser?._id);
    return find ? true : false;
  };

  const handleOverlayShow = () => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleOverlayHide = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.postContainer}
      onLongPress={handleOverlayShow}
      onPressOut={handleOverlayHide}
      activeOpacity={0.9}
      onPress={() => {
        setPostContent(post);
        setIsPostVisible(true);
      }}
    >
      {post.image ? (
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          contentFit="cover"
          cachePolicy={"memory-disk"}
        />
      ) : (
        <Text
          style={[styles.postImage, styles.postText]}
          adjustsFontSizeToFit={true}
        >
          {post.content}
        </Text>
      )}
      <Animated.View style={[styles.postOverlay, { opacity: overlayOpacity }]}>
        <View style={styles.likeContainer}>
          <Ionicons
            name="heart"
            size={16}
            color={hasLiked(post) ? colors.primary : "white"}
          />
          <Text style={styles.likeCount}>{post.likes.length}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AccountScreen() {
  const bottomTabBarHeight = useBottomTabBarHeight();
  const postContext = usePost();
  const {
    currentUser,
    setCurrentUser,
    isJournalLoggedIn,
    setIsJournalLoggedIn,
    journalToken,
    setJournalToken,
  } = useAuth();
  const [image, setImage] = useState(currentUser?.profileImage);
  const [bio, setBio] = useState(currentUser?.bio || ""); // Added default value
  const [followers, setFollowers] = useState(null);
  const [following, setFollowing] = useState(null);
  const [posts, setPosts] = useState(
    postContext.posts.filter((post) => post?.user._id === currentUser?._id)
  );
  const [postCount, setPostCount] = useState(posts?.length || 0);
  const [isPostVisible, setIsPostVisible] = useState(false);
  const [postContent, setPostContent] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser?.username);
  const [editBio, setEditBio] = useState(currentUser?.bio || ""); // Added default value
  const [editImage, setEditImage] = useState(image);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState(""); // 'followers' or 'following'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [readInPin, setReadInPin] = useState([]);
  const [errorPin, setErrorPin] = useState(null);
  const [isKeysDisabled, setIsKeysDisabled] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(
    currentUser?.followers.length || 0
  ); // Added default value
  const [followingCount, setFollowingCount] = useState(
    currentUser?.following.length || 0
  ); // Added default value
  const [isSaving, setIsSaving] = useState(false);
  const [
    openPersonalIdentificationNumberModal,
    setOpenPersonalIdentificationNumberModal,
  ] = useState(false);
  const insets = useSafeAreaInsets();

  const { showError } = useError();

  const { theme } = useTheme();

  const { setJournals } = useJournal();

  const navigation = useNavigation();

  React.useEffect(() => {
    setPosts(() => {
      const p = postContext.posts.filter(
        (post) => post?.user?._id === currentUser?._id
      );
      setPostCount(p.length || 0);
      return p;
    });
  }, [postContext.posts]);

  const contentStyle = useMemo(
    () => ({
      paddingBottom: bottomTabBarHeight + 5,
      paddingTop: insets.top + 50,
    }),
    []
  ); // only recompute when bottomTabBarHeight or insets.top changes

  React.useEffect(() => {
    async function fetchFollowers() {
      let followers = await Promise.all(
        currentUser?.followers.map(async (follower) => {
          if (typeof follower === "object") return follower;
          const data = await postContext.getPostCommentUser(follower);
          return data;
        })
      );

      setFollowers(followers);
    }

    async function fetchFollowing() {
      let following = await Promise.all(
        currentUser?.following.map(async (follow) => {
          if (typeof follow === "object") return follow;
          const data = await postContext.getPostCommentUser(follow);
          return data;
        })
      );

      setFollowing(following);
    }

    fetchFollowers();
    fetchFollowing();

    setPosts(
      postContext.posts.filter((post) => post?.user?._id === currentUser?._id)
    );
    setPostCount(posts.length || 0);
  }, [currentUser]);

  React.useEffect(() => {
    setFollowerCount(currentUser?.followers.length || 0);
    setFollowingCount(currentUser?.following.length || 0);
  }, [currentUser]);

  const openEditModal = () => {
    setEditUsername(currentUser?.username);
    setEditBio(currentUser?.bio);
    setIsEditModalVisible(true);
  };

  const handlePickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const ShowErrorPin = (msg) => {
    setErrorPin(msg);
  };

  async function setUpPin(num) {
    if (isKeysDisabled) return;
    if (num === "->") {
      if (readInPin.length !== 4) return;
      const pin = readInPin.join("");
      if (!journalToken) {
        await AsyncStorage.setItem("journalToken", pin);
        setJournalToken(pin);
        setOpenPersonalIdentificationNumberModal(false);
        setIsJournalLoggedIn(true);
        ShowErrorPin(null);
        setReadInPin([]);
        navigation.navigate("Journal");
        return;
      }
      if (pin !== journalToken) {
        setInvalidCount((prev) => {
          if (prev === 4) {
            ShowErrorPin(
              "Invalid Pin exceeded 4 - All Journals have been deleted from this device - Setting this as new pin"
            );
            setIsKeysDisabled(true);
            setTimeout(async () => {
              await AsyncStorage.setItem(
                "journalToken",
                readInPin.join("")
              ).then(async () => {
                await AsyncStorage.removeItem("journals");
                setJournalToken(readInPin.join(""));
                setIsJournalLoggedIn(true);
                setJournals([]);
                setOpenPersonalIdentificationNumberModal(false);
                navigation.navigate("Journal");
                ShowErrorPin(null);
                setIsKeysDisabled(false);
                setReadInPin([]);
              });
            }, 5000);

            return 0;
          }
          ShowErrorPin("Invalid Pin");
          setReadInPin([]);
          return prev + 1;
        });
        return;
      }
      setOpenPersonalIdentificationNumberModal(false);
      setIsJournalLoggedIn(true);
      ShowErrorPin(null);
      navigation.navigate("Journal");
      return;
    }
    if (num === "⌫") {
      if (readInPin.length === 0) return;
      setReadInPin((prev) => prev.slice(0, prev.length - 1));
    } else {
      if (readInPin.length === 4) return;
      setReadInPin((prev) => [...prev, num]);
    }
  }

  const handleJournalOpening = () => {
    if (isJournalLoggedIn) {
      navigation.navigate("Journal");
      return;
    }
    setOpenPersonalIdentificationNumberModal(true);
    try {
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleUploadImage = async () => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: editImage,
        type: "image/jpeg",
        name: "profile.jpg",
      });
      const uploadRes = await axios.post(`${endPoint}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return uploadRes.data?.fileName;
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      //check if changes were made
      if (
        editUsername === currentUser?.username &&
        editBio === currentUser?.bio &&
        editImage === image
      ) {
        setIsSaving(false);
        setIsEditModalVisible(false);
        return;
      }
      let uploadedUrl = image;
      if (editImage) {
        uploadedUrl = await handleUploadImage();
      }

      const res = await axios.put(`${endPoint}/api/users/profile`, {
        username: editUsername?.trim(),
        bio: editBio?.trim(),
        profileImage: uploadedUrl,
      });
      setImage(res.data?.profileImage);
      setBio(editBio);
      setCurrentUser((prev) => {
        prev.username = editUsername?.trim();
        prev.bio = editBio?.trim();
        prev.profileImage = res.data?.profileImage;
        return prev;
      });
      setIsEditModalVisible(false);
      setIsSaving(false);
      await AsyncStorage.setItem("user", JSON.stringify(currentUser));
    } catch (err) {
      const errorMessage= (err.response?.data?.message || err.message);
      Alert.alert("Error: ", errorMessage);
      setEditBio(currentUser?.bio);
      setEditUsername(currentUser?.username);
      setEditImage(currentUser?.profileImage);
      setIsSaving(false);
    }
  };

  const openFollowModal = (type) => {
    setFollowModalType(type);
    setShowFollowModal(true);
  };

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setShowFollowModal(false);
    setIsUserProfileOpen(true);
  };

  // Modify StatBox to be touchable
  const StatBox = ({ label, value }) => (
    <View style={[styles.statBox, { borderColor: theme.card }]}>
      <Text
        style={[
          styles.statValue,
          {
            color: theme.textPrimary,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          {
            color: theme.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  const renderUserItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
      >
        <Image
          source={
            item.profileImage
              ? { uri: item.profileImage }
              : require("../defaultImages/default-user.jpg")
          }
          style={styles.userImage}
          cachePolicy={"memory-disk"}
        />
        <Text
          style={[
            styles.userName,
            {
              color: theme.textPrimary,
            },
          ]}
        >
          @{item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.imageContainer}>
              <Image
                source={
                  image
                    ? { uri: image }
                    : require("../defaultImages/default-user.jpg")
                }
                style={styles.profileImage}
                cachePolicy={"memory-disk"}
              />
            </View>
          </View>

          <Text
            style={[
              styles.name,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            @{currentUser?.username}
          </Text>
          <Text
            style={[
              styles.bio,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {bio}
          </Text>
        </View>

        <View style={[styles.statsContainer, { borderColor: theme.card }]}>
          <StatBox label="Posts" value={postCount} />
          <TouchableOpacity onPress={() => openFollowModal("followers")}>
            <StatBox
              label="Followers"
              value={followerCount}
              onPress={() => openFollowModal("followers")}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openFollowModal("following")}>
            <StatBox
              label="Following"
              value={followingCount}
              onPress={() => openFollowModal("following")}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.editButton,
            {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={openEditModal}
        >
          <Text
            style={[
              styles.editButtonText,
              {
                color: theme.background,
              },
            ]}
          >
            Edit Profile
          </Text>
        </TouchableOpacity>

        <View style={[styles.postsHeader, { borderColor: theme.card }]}>
          <TouchableOpacity style={styles.postsHeaderTab}>
            <Ionicons name="grid-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.postsHeaderTab}>
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postsHeaderTab}
            onPress={handleJournalOpening}
          >
            <MaterialCommunityIcons
              name="notebook-outline"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.postsGrid}>
          {posts.map((post) => (
            <RenderPost
              key={post._id}
              post={post}
              setPostContent={setPostContent}
              setIsPostVisible={setIsPostVisible}
              currentUser={currentUser}
            />
          ))}
        </View>
        <Modal
          visible={isPostVisible}
          animationType="slide"
          hardwareAccelerated={true}
          onRequestClose={() => setIsPostVisible(false)}
          transparent={true}
        >
          {postContent && (
            <ViewPostScreen
              post={postContent}
              close={() => setIsPostVisible(false)}
            />
          )}
        </Modal>
        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          onRequestClose={() => setIsEditModalVisible(false)}
          transparent={true}
          hardwareAccelerated={true}
          navigationBarTranslucent={true}
          statusBarTranslucent={true}
        >
          <EditProfileModal
            styles={styles}
            editImage={editImage}
            image={image}
            editUsername={editUsername}
            setEditUsername={setEditUsername}
            editBio={editBio}
            setEditBio={setEditBio}
            handlePickEditImage={handlePickEditImage}
            handleSaveChanges={handleSaveChanges}
            setIsEditModalVisible={setIsEditModalVisible}
            isSaving={isSaving}
            theme={theme}
          />
        </Modal>
      </ScrollView>

      <Modal
        visible={showFollowModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowModal(false)}
        hardwareAccelerated={true}
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
      >
        <View
          style={[
            styles.modalContainer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {followModalType === "followers" ? "Followers" : "Following"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFollowModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={followModalType === "followers" ? followers : following}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.userList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={isUserProfileOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsUserProfileOpen(false)}
        hardwareAccelerated={true}
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
      >
        {selectedUser && (
          <ViewUserOProfile
            user={selectedUser}
            close={() => setIsUserProfileOpen(false)}
          />
        )}
      </Modal>
      <Modal
        visible={openPersonalIdentificationNumberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOpenPersonalIdentificationNumberModal(false)}
        hardwareAccelerated={true}
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
      >
        <BlurView
          intensity={50}
          style={[
            styles.modalContainer,
            {
              paddingTop: insets.top,
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 30,
            },
          ]}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          blurReductionFactor={16}
        >
          <View
            style={[
              styles.pinContainer,
              {
                paddingBottom: insets.bottom+20,
                backgroundColor: theme.background,
              },
            ]}
          >
            {errorPin && (
              <Text
                style={[
                  styles.pinError,
                  {
                    color: theme.error,
                  },
                ]}
              >
                *{errorPin}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => setOpenPersonalIdentificationNumberModal(false)}
              style={{
                alignSelf: "flex-end",
                marginRight: 20,
              }}
            >
              <Ionicons name="close" size={30} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.pinBoxes}>
              {[1, 2, 3, 4].map((_, index) => (
                <Text
                  key={index}
                  style={[
                    styles.pinBox,
                    {
                      backgroundColor: theme.card,
                    },
                  ]}
                >
                  {readInPin[index] || "•"}
                </Text>
              ))}
            </View>
            <PinBox
              setUpPin={setUpPin}
              theme={theme}
              isKeysDisabled={isKeysDisabled}
            />
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const windowWidth = Dimensions.get("window").width;
const postSize = windowWidth / 3; // Exactly one-third of screen width

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  editButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  postsHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 2,
    justifyContent: "space-around",
  },
  postsHeaderTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  postContainer: {
    width: postSize,
    height: postSize,
    padding: 1,
  },
  postImage: {
    flex: 1,
    borderRadius: 5,
  },
  postOverlay: {
    position: "absolute",
    bottom: 1,
    left: 1,
    right: 1,
    top: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likeCount: {
    color: "white",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  postText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: "center",
    padding: 8,
    backgroundColor: colors.card,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  profileImageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: colors.textPrimary,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  pinContainer: {
    width: "100%",
    height: "72%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 30,
    borderTopEndRadius: 30,
    borderTopStartRadius: 30,
  },
  pinError: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 10,
    borderRadius: 10,
  },
  pinBoxes: {
    padding: 20,
    width: "90%",
    gap: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  pinBox: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    padding: 15,
    borderRadius: 10,
  },
  pinKeysContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  pinKey: {
    width: "30%",
    height: "23%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
