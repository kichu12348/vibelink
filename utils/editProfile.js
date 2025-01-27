// EditProfileModal.js
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/primary";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EditProfileModal = ({
  styles,
  editImage,
  image,
  editUsername,
  setEditUsername,
  editBio,
  setEditBio,
  handlePickEditImage,
  handleSaveChanges,
  setIsEditModalVisible,
  isSaving,
  theme,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.modalContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        { backgroundColor: theme.background },
      ]}
    >
      <View style={[styles.modalHeader, { borderBottomColor: theme.card }]}>
        <Text style={styles.modalTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={() => setIsEditModalVisible(false)}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContent}>
        <View style={styles.profileImageSection}>
          <Image
            source={
              editImage
                ? { uri: editImage }
                : image
                ? { uri: image }
                : require("../defaultImages/default-user.jpg")
            }
            style={styles.editProfileImage}
            cachePolicy={"memory-disk"}
          />
          <TouchableOpacity
            onPress={handlePickEditImage}
            style={styles.changePhotoButton}
          >
            <Text
              style={[
                styles.changePhotoText,
                {
                  color: theme.primary,
                },
              ]}
            >
              Change Profile Photo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            value={editUsername}
            onChangeText={setEditUsername}
            style={[
              styles.input,
              { color: theme.textPrimary, backgroundColor: theme.card },
            ]}
            placeholder="Enter username"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            value={editBio}
            onChangeText={setEditBio}
            style={[
              styles.input,
              styles.bioInput,
              {
                color: theme.textPrimary,
                backgroundColor: theme.card,
              },
            ]}
            placeholder="Write your bio..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            isSaving && { opacity: 0.5 },
          ]}
          onPress={handleSaveChanges}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, { color: theme.background }]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditProfileModal;
