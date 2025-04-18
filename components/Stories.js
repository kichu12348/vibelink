import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { memo } from "react";
import { colors, fontSizes } from "../constants/primary";
import { useStory } from "../context/StoryContext";
import * as ImagePicker from "expo-image-picker";
import { AntDesign } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";

const defaultAvatar =
  "https://storage.googleapis.com/vibelink-pub-bucket3/default-user.webp";

const RenderItem = memo(({ item, openStory, theme }) => {
  const [borderColor, setBorderColor] = React.useState(
    item.color || colors.primary
  );

  return (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => openStory(item)}
    >
      <View style={[styles.storyRing, { borderColor }]}>
        <Image
          source={{ uri: item.user.profileImage || defaultAvatar }}
          style={styles.storyImage}
          cachePolicy={"memory-disk"}
        />
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.user.username}
      </Text>
    </TouchableOpacity>
  );
});

const Stories = ({ openStory }) => {
  const { stories, loading, createStory } = useStory();

  const { theme } = useTheme();

  const handleAddStory = async () => {
    if (loading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.5,
    });
    if (!result.canceled) {
      await createStory(result.assets[0]);
    }
  };

  const handleStoryPress = (story) => {
    openStory(story);
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={[{ isAdd: true }, ...stories]}
        renderItem={({ item }) =>
          item.isAdd ? (
            <TouchableOpacity
              style={styles.storyContainer}
              onPress={handleAddStory}
            >
              <View
                style={[styles.addStoryButton, { borderColor: theme.primary }]}
              >
                <AntDesign name="plus" size={24} color={theme.primary} />
              </View>
              <Text style={styles.storyName}>Add Story</Text>
            </TouchableOpacity>
          ) : (
            <RenderItem
              item={item}
              openStory={handleStoryPress}
              theme={theme}
            />
          )
        }
        keyExtractor={(item) => (item.isAdd ? "add" : item._id)}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Stories;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    height: 100,
  },
  storyContainer: {
    width: 70,
    marginHorizontal: 8,
    alignItems: "center",
  },
  storyRing: {
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  storyName: {
    fontSize: fontSizes.sm,
    marginTop: 4,
    textAlign: "center",
    width: "100%",
    color: colors.textPrimary,
  },
  addStoryButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
