import { useContext, createContext, useLayoutEffect,useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMessage } from "./MessageContext";

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
const convoMap = new Map();

export const BackgroundProvider = ({ children }) => {
  const { conversations } = useMessage();
  const [ran, setRan] = useState(false);
  const convoMap = useRef(new Map()).current;
  const getBackgroundsForAllConvos = async (conversations) => {
    try {
      const bgImages = await AsyncStorage.multiGet(
        conversations.map((convo) => `bg-${convo?._id}`)
      );
      bgImages.forEach((image, index) => {
        const [key, value] = image;
        if (value) {
          convoMap.set(key, backgroundImages[value - 1]);
        }
      });
    } catch (error) {
      return [null, error.message];
    }
  };

  // useLayoutEffect(() => {
  //   if (ran) return;
  //   getBackgroundsForAllConvos(conversations).then(() => setRan(true));

  //   return () => {
  //     setRan(false);
  //   };
  // }, [conversations]);
  const changeBackgroundImage = async (image, convoId) => {
    try {
      convoMap.set(`bg-${convoId}`, backgroundImages[image - 1]);
      await AsyncStorage.setItem(`bg-${convoId}`, `${image}`);
      return [backgroundImages[image - 1], null];
    } catch (error) {
      return [null, error.message];
    }
  };

  const getBackgroundImage = async (convoId) => {
    try {
      const checkInMap = convoMap.get(`bg-${convoId}`);
      if (checkInMap) return checkInMap;
      else return backgroundImages[0];
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
