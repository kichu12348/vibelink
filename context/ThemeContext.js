import React, {
  createContext,
  useState,
  useContext,
  useLayoutEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultDarkTheme,
  midnightTheme,
  emeraldTheme,
  crimsonTheme,
  cyberpunkTheme,
  obsidianTheme,
  amoledTheme,
  nordTheme,
  mintChocolateTheme,
  sunsetTheme,
  oceanTheme,
  neonNightTheme,
  retroVaporTheme,
  pureBlackTheme
} from "../constants/themes";

const themes = {
  defaultDarkTheme,
  midnightTheme,
  emeraldTheme,
  crimsonTheme,
  cyberpunkTheme,
  obsidianTheme,
  amoledTheme,
  nordTheme,
  mintChocolateTheme,
  sunsetTheme,
  oceanTheme,
  neonNightTheme,
  retroVaporTheme,
  pureBlackTheme
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultDarkTheme);
  const [currentTheme, setCurrentTheme] = useState("defaultDarkTheme");

  // Function to load theme from AsyncStorage
  const loadTheme = async () => {
    try {
      const savedThemeName = await AsyncStorage.getItem("currentTheme");
      if (savedThemeName && themes[savedThemeName]) {
        setTheme(themes[savedThemeName]);
        setCurrentTheme(savedThemeName);
      }
    } catch (error) {
      console.error("Error loading theme from AsyncStorage", error);
      setTheme(defaultDarkTheme); // Fallback to default theme on error
      setCurrentTheme("defaultDarkTheme");
    }
  };

  // Function to switch theme and save to AsyncStorage
  const switchTheme = async (themeName) => {
    try {
      if (themes[themeName]) {
        setTheme(themes[themeName]);
        setCurrentTheme(themeName);
        await AsyncStorage.setItem("currentTheme", themeName);
        return themes[themeName];
      }
    } catch (error) {
      console.log("Error saving theme to AsyncStorage", error.message);
    }
  };

  // Load theme on initial render
  useLayoutEffect(() => {
    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
