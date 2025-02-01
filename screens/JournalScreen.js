import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJournal } from "../context/JournalContext";
import { BlurView } from "expo-blur";

export default function JournalScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { journals, loading, deleteJournal } = useJournal();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedJournal, setSelectedJournal] = React.useState(null);

  function createNewJournal() {
    const newJournal = {
      id: Date.now().toString(),
      title: "New Entry",
      content: "",
      date: new Date().toISOString(),
    };
    navigation.navigate("ViewJournal", { journal: newJournal, isNew: true });
  }

  const handleDelete = async (journalId) => {
    await deleteJournal(journalId);
  };

  const openDeleteModal = (journal) => {
    setSelectedJournal(journal);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Your Journal
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.journalList}>
        {journals.map((journal) => (
          <TouchableOpacity
            key={journal.id}
            style={[styles.journalCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("ViewJournal", { journal })}
            onLongPress={() => openDeleteModal(journal)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {journal.title}
              </Text>
            </View>
            <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
              {new Date(journal.date).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <Text
              style={[styles.cardPreview, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {journal.content}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={createNewJournal}
      >
        <Ionicons name="add" size={24} color={theme.background} />
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        hardwareAccelerated={true}
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
      >
        {selectedJournal && (
          <TouchableWithoutFeedback onPress={() => setIsDeleteModalOpen(false)}>
            <BlurView
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
              intensity={20}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              blurReductionFactor={24}
            >
              <View
                style={[styles.journalCard, { backgroundColor: theme.card }]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.cardTitle, { color: theme.textPrimary }]}
                  >
                    {selectedJournal.title}
                  </Text>
                </View>
                <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                  {new Date(selectedJournal.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text
                  style={[styles.cardPreview, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {selectedJournal.content}
                </Text>
              </View>
              <View>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { backgroundColor: theme.error },
                  ]}
                  onPress={() => {
                    handleDelete(selectedJournal.id);
                    setIsDeleteModalOpen(false);
                  }}
                >
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Delete Journal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { marginTop: 25 }]}
                  onPress={() => setIsDeleteModalOpen(false)}
                >
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </TouchableWithoutFeedback>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  journalList: {
    flex: 1,
  },
  journalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: "center",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
