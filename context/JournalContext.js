import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const JournalContext = createContext();

export function JournalProvider({ children }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJournals();
  }, []);

  async function loadJournals() {
    try {
      const saved = await AsyncStorage.getItem("journals");
      if (saved) setJournals(JSON.parse(saved));
      setLoading(false);
    } catch (error) {
      console.error("Error loading journals:", error);
      setLoading(false);
    }
  }

  async function addJournal(journal) {
    try {
      const newJournals = [journal, ...journals];
      setJournals(newJournals);
      await AsyncStorage.setItem("journals", JSON.stringify(newJournals));
    } catch (error) {
      console.error("Error adding journal:", error);
    }
  }

  async function updateJournal(updatedJournal) {
    try {
      const newJournals = journals.map((j) =>
        j.id === updatedJournal.id ? updatedJournal : j
      );
      setJournals(newJournals);
      await AsyncStorage.setItem("journals", JSON.stringify(newJournals));
    } catch (error) {
      console.error("Error updating journal:", error);
    }
  }

  async function deleteJournal(journalId) {
    try {
      const newJournals = journals.filter((j) => j.id !== journalId);
      setJournals(newJournals);
      await AsyncStorage.setItem("journals", JSON.stringify(newJournals));
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  }

  return (
    <JournalContext.Provider
      value={{
        journals,
        loading,
        addJournal,
        updateJournal,
        deleteJournal,
        setJournals
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  return useContext(JournalContext);
}
