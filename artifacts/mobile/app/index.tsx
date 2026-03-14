import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { hasSeenWelcome, setHasSeenWelcome } = useApp();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const bismillahAnim = useRef(new Animated.Value(0)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasSeenWelcome) {
      router.replace("/(tabs)");
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
      Animated.timing(lineAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(bismillahAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(greetingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      startPulse();
    });
  }, [hasSeenWelcome]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleEnter = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHasSeenWelcome(true);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.backgroundPattern}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgLine,
              {
                top: `${10 + i * 16}%`,
                opacity: 0.04 + i * 0.01,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}

        <View style={[styles.cardContent, { paddingTop: insets.top + 40 }]}>
          <Animated.View style={[styles.goldLineContainer, { opacity: lineAnim }]}>
            <View style={styles.goldLine} />
            <View style={styles.goldDot} />
            <View style={styles.goldLine} />
          </Animated.View>

          <Animated.Text style={[styles.bismillah, { opacity: bismillahAnim }]}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </Animated.Text>

          <View style={styles.brandSection}>
            <Animated.View style={[styles.logoContainer, { opacity: greetingAnim }]}>
              <Text style={styles.logoText}>ALMERA</Text>
              <View style={styles.logoUnderline} />
            </Animated.View>

            <Animated.Text style={[styles.greeting, { opacity: greetingAnim }]}>
              Assalamualaikum
            </Animated.Text>
            <Animated.Text style={[styles.welcomeText, { opacity: greetingAnim }]}>
              Welcome to Almera
            </Animated.Text>
            <Animated.Text style={[styles.tagline, { opacity: greetingAnim }]}>
              Premium Fashion. Crafted for You.
            </Animated.Text>
          </View>

          <Animated.View
            style={[styles.buttonContainer, { opacity: buttonAnim, transform: [{ scale: pulseAnim }] }]}
          >
            <Pressable
              onPress={handleEnter}
              style={({ pressed }) => [styles.enterButton, pressed && styles.enterButtonPressed]}
            >
              <Text style={styles.enterButtonText}>Enter Store</Text>
              <View style={styles.buttonShimmer} />
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.goldLineContainer, { opacity: lineAnim, marginTop: 24 }]}>
            <View style={styles.goldLine} />
            <View style={styles.goldDot} />
            <View style={styles.goldLine} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  bgLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gold,
  },
  glassCard: {
    width: width * 0.9,
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201, 168, 76, 0.3)",
  },
  androidBlur: {
    backgroundColor: "rgba(26, 26, 26, 0.92)",
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  goldLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginVertical: 16,
  },
  goldLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginHorizontal: 8,
  },
  bismillah: {
    fontFamily: "Inter_400Regular",
    fontSize: 22,
    color: Colors.gold,
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 2,
    writingDirection: "rtl",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: Colors.offWhite,
    letterSpacing: 10,
  },
  logoUnderline: {
    width: 60,
    height: 2,
    backgroundColor: Colors.gold,
    marginTop: 6,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.mutedGray,
    marginBottom: 8,
    letterSpacing: 1,
  },
  welcomeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: Colors.offWhite,
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.mutedGray,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  buttonContainer: {
    width: "100%",
  },
  enterButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    overflow: "hidden",
  },
  enterButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  enterButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.charcoal,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  buttonShimmer: {
    position: "absolute",
    top: 0,
    left: -100,
    width: 60,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    transform: [{ skewX: "-20deg" }],
  },
});
