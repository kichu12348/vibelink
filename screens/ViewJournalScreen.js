import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJournal } from "../context/JournalContext";
import { ImageBackground } from "expo-image";
import bgImage from "./images/readin.jpg";

export default function ViewJournalScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { addJournal, updateJournal } = useJournal();

  const { journal, isNew: New } = route.params;
  const [isNew, setIsNew] = React.useState(New);
  const [title, setTitle] = React.useState(journal.title);
  const [content, setContent] = React.useState(journal.content);
  const [previousTitle, setPreviousTitle] = React.useState(journal.title);
  const [previousContent, setPreviousContent] = React.useState(journal.content);
  const [isEditingEnabled, setIsEditingEnabled] = React.useState(false);

  async function saveJournal(isDonebtn) {
    if (title === previousTitle && content === previousContent && !isDonebtn) {
      navigation.goBack();
      return;
    }
    if (title === "" && content === "") {
      if (isNew) {
        return;
      } else {
        await deleteJournal(journal.id);
        navigation.goBack();
        return;
      }
    }
    try {
      const journalData = {
        ...journal,
        title,
        content,
      };

      if (isNew) {
        await addJournal(journalData);
        setIsNew(false);
      } else {
        await updateJournal(journalData);
      }

      if (isDonebtn) {
        Keyboard.dismiss();
        return;
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving journal:", error);
    }
  }

  return (
    <ImageBackground
      style={{
        flex: 1,
      }}
      source={bgImage}
      blurRadius={0.5}
      contentFit="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: `rgba(0,0,0,0.5)`,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => saveJournal(false)}>
            <Ionicons name="arrow-back" size={26} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.editButton, { marginRight: 10 }]}
              onPress={() =>
                setIsEditingEnabled((prev) => {
                  if (prev) {
                    saveJournal(true);
                  }
                  return !prev;
                })
              }
            >
              <Ionicons
                name={isEditingEnabled ? "create" : "create-outline"}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                saveJournal(true);
                setIsEditingEnabled(false);
              }}
            >
              <Text style={[styles.saveButtonText, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={[
              styles.titleInput,
              {
                color: theme.textPrimary,
                textShadowColor: `${theme.textPrimary}`,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.textSecondary}
            keyboardAppearance="dark"
            autoCorrect={false}
            spellCheck={false}
            underlineColorAndroid="transparent"
            editable={isEditingEnabled}
          />

          <TextInput
            style={[
              styles.contentInput,
              {
                color: theme.textPrimary,
                textShadowColor: `${theme.textPrimary}`,
              },
            ]}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor={theme.textSecondary}
            keyboardAppearance="dark"
            autoCorrect={false}
            spellCheck={false}
            underlineColorAndroid="transparent"
            editable={isEditingEnabled}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    textDecorationLine: "none",
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    textDecorationLine: "none",
  },
  scrollView: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
  },
});
