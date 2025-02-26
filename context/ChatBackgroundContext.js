import { useContext, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const backgroundContext = createContext();

const backgroundImages = [
  {
    id: 1,
    image: require("../images/backImage.jpeg"),
  },
  {
    id: 2,
    image: require("../images/code_bg.png"),
  },
  {
    id: 3,
    image: require("../images/ghost.png"),
  },
  {
    id: 4,
    image: require("../images/pinkStreet.png"),
  },
  {
    id: 5,
    image: require("../images/Street.png"),
  },

  {
    id: 6,
    image: require("../images/Sunflower.png"),
  },
  {
    id: 7,
    image: require("../images/Sunsetflower.png"),
  },
];

export const BackgroundProvider = ({ children }) => {
  const changeBackgroundImage = async (image, convoId) => {
    try {
      await AsyncStorage.setItem(`bg-${convoId}`, `${image}`);
      return [backgroundImages[image - 1], null];
    } catch (error) {
      return [null, error.message];
    }
  };

  const getBackgroundImage = async (convoId) => {
    try {
      const imageId = await AsyncStorage.getItem(`bg-${convoId}`);
      if (imageId) return backgroundImages[imageId - 1];

      return backgroundImages[0];
    } catch (error) {
      return backgroundImages[0];
    }
  };

  return (
    <backgroundContext.Provider
      value={{
        backgroundImages,
        changeBackgroundImage,
        getBackgroundImage,
      }}
    >
      {children}
    </backgroundContext.Provider>
  );
};

export const useBackground = () => useContext(backgroundContext);
