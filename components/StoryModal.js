import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { colors, fontSizes } from "../constants/primary";
import { AntDesign } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useStory } from "../context/StoryContext";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 seconds per story

const defaultAvatar =
  "https://storage.googleapis.com/vibe-link-public/default-user.jpg";

const StoryModal = ({ visible, story: storyContent, onClose }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0));
  const animationRef = useRef(null);

  const [story, setStoryContent] = useState(storyContent);

  const { stories } = useStory();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setCurrentMediaIndex(0);
      startProgress();
    }
    return () => {
      // Cleanup animation on unmount or when modal closes
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [visible]);

  useEffect(() => {
    setStoryContent(storyContent);
  }, [storyContent]);

  // Add new useEffect to handle story changes
  useEffect(() => {
    if (story) {
      progressAnimation.current.setValue(0);
      setCurrentMediaIndex(0);
      startProgress();
    }
  }, [story]);

  useEffect(() => {
    // Reset and start progress when media index changes
    if (visible) {
      startProgress();
    }
  }, [currentMediaIndex]);

  const startProgress = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    progressAnimation.current.setValue(0);

    animationRef.current = Animated.timing(progressAnimation.current, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        goToNextMedia();
      }
    });
  };

  const goToNextMedia = () => {
    if (!story) return;
    if (currentMediaIndex < story.media.length - 1) {
      progressAnimation.current.setValue(0);
      setCurrentMediaIndex((prev) => prev + 1);
    } else {
      const currentStoryIndex = stories.findIndex((s) => s._id === story._id);
      if (currentStoryIndex < stories.length - 1) {
        const nextStory = stories[currentStoryIndex + 1];
        progressAnimation.current.setValue(0);
        setStoryContent(nextStory);
      } else {
        onClose();
      }
    }
  };

  const goToPreviousMedia = () => {
    if (currentMediaIndex > 0) {
      progressAnimation.current.setValue(0);
      setCurrentMediaIndex((prev) => prev - 1);
    } else {
      const currentStoryIndex = stories.findIndex((s) => s._id === story._id);
      if (currentStoryIndex > 0) {
        setStoryContent(stories[currentStoryIndex - 1]);
        setCurrentMediaIndex(stories[currentStoryIndex - 1].media.length - 1);
      }
    }
  };

  const handlePress = (evt) => {
    const x = evt.nativeEvent.locationX;
    const screenWidth = Dimensions.get("window").width;

    if (x < screenWidth * 0.3) {
      goToPreviousMedia();
    } else {
      goToNextMedia();
    }
  };

  if (!story) return null;

  return (
    <>
      <StatusBar backgroundColor={"black"} barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.touchHandler}
          onPress={handlePress}
          activeOpacity={1}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: story.user.profileImage || defaultAvatar }}
                style={styles.profileImage}
                cachePolicy={"memory-disk"}
              />
              <Text style={styles.username}>{story.user.username}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={[styles.progressContainer]}>
            {story.media.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progress,
                    {
                      width:
                        index === currentMediaIndex
                          ? progressAnimation.current.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : index < currentMediaIndex
                          ? "100%"
                          : "0%",
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <Image
            source={{ uri: story.media[currentMediaIndex].url }}
            style={styles.storyImage}
            contentFit="contain"
            cachePolicy={"memory-disk"}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  progressContainer: {
    flexDirection: "row",
    width: "100%",
    padding: 10,
    gap: 5,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    ...Platform.select({
      ios: {
        paddingVertical: 10,
      },
      android: {
        paddingVertical: 0,
      },
    }),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    color: "white",
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  storyImage: {
    width,
    height: height - 100,
    marginTop: 0,
  },
  touchHandler: {
    flex: 1,
    width: "100%",
  },
});

export default StoryModal;
