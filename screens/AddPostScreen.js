import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, fontSizes } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { Ionicons } from "@expo/vector-icons";
import { useError } from "../context/ErrorContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_CONTENT_LENGTH = 500;

const AddPostScreen = ({ navigation }) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const { createPost, loading } = usePost();
  const { showError } = useError();


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setMediaFiles([result.assets[0]]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    //check if content length is greater than 500
    if (content.length > MAX_CONTENT_LENGTH) {
      showError("Content length should be less than 500 characters");
      return;
    }
    try {
      const success = await createPost(content, mediaFiles);
      if (success) {
        setContent("");
        setMediaFiles([]);
        navigation.navigate("Feed");
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={content}
          onChangeText={setContent}
        />

        {mediaFiles.length > 0 && (
          <TouchableOpacity
            onPress={() => setMediaFiles([])}
            disabled={loading}
          >
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: mediaFiles[0].uri }}
              style={styles.previewImage}
            />
          </View>
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          <TouchableOpacity onPress={pickImage} style={styles.mediaButton}>
            <Ionicons name="image" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.postButton,
              !content.trim() &&
                mediaFiles.length === 0 &&
                styles.disabledButton,
            ]}
            onPress={handlePost}
            disabled={loading || (!content.trim() && mediaFiles.length === 0)}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  input: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    minHeight: 100,
    textAlignVertical: "top",
  },
  mediaPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  mediaButton: {
    padding: 10,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AddPostScreen;
