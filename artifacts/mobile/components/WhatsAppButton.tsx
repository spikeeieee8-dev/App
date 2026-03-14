import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = { isDark: boolean };

export function WhatsAppButton({ isDark }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("https://wa.me/923001234567?text=Assalamualaikum!%20I%20have%20a%20question%20about%20Almera.");
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, friction: 10 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 90 + (Platform.OS === "web" ? 34 : 0),
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
      >
        <Feather name="message-circle" size={22} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 100,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
