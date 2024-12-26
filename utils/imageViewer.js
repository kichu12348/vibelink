import { View, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Image } from "expo-image";
import { colors } from "../constants/primary";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const ImageViewer = ({ uri, close = () => {} }) => {
  const insets = useSafeAreaInsets();
  return (
    <BlurView
      intensity={100}
      style={[styles.conatainer, { paddingTop: insets.top }]}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      blurReductionFactor={16}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={close} style={styles.closeButton}>
          <Ionicons name="close" size={30} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        cachePolicy={"memory-disk"}
      />
    </BlurView>
  );
};

export default ImageViewer;

const styles = StyleSheet.create({
  conatainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
  },
  closeButton: {
    padding: 10,
  },
  blurContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  image: {
    width: "90%",
    height: "85%",
    alignSelf: "center",
    borderRadius: 5,
  },
});
