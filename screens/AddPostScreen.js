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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fontSizes } from "../constants/primary";
import { usePost } from "../context/PostContext";
import { Ionicons } from "@expo/vector-icons";
import { useError } from "../context/ErrorContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const MAX_CONTENT_LENGTH = 500;

const AddPostScreen = ({ navigation }) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const { createPost, loading } = usePost();
  const { showError } = useError();
  const { theme } = useTheme();

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
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      showError("Content length should be less than 500 characters");
      return;
    }
    try {
      const success = await createPost(content.trim(), mediaFiles);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    innerContainer: {
      flex: 1,
      padding: 16,
    },
    inputContainer: {
      position: "relative",
      paddingRight: 50,
    },
    input: {
      color: theme.textPrimary,
      fontSize: fontSizes.lg,
      minHeight: 100,
      textAlignVertical: "top",
      padding: 10,
      backgroundColor: theme.card,
      borderRadius: 12,
    },
    charCount: {
      position: "absolute",
      top: 0,
      right: 0,
      color: theme.textSecondary,
      fontSize: fontSizes.sm,
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
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    postButtonText: {
      color: theme.white,
      fontSize: fontSizes.md,
      fontWeight: "bold",
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={[styles.innerContainer, { paddingTop: insets.top + 80 }]}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.textSecondary}
                multiline
                value={content}
                onChangeText={setContent}
              />
              <Text style={styles.charCount}>
                {content.trim().length}/{MAX_CONTENT_LENGTH}
              </Text>
            </View>

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
                <Ionicons name="image" size={24} color={theme.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.postButton,
                  !content.trim() &&
                    mediaFiles.length === 0 &&
                    styles.disabledButton,
                ]}
                onPress={handlePost}
                disabled={
                  loading || (!content.trim() && mediaFiles.length === 0)
                }
              >
                {loading ? (
                  <ActivityIndicator color={theme.white} />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default AddPostScreen;
