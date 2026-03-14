import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import { scheduleOrderConfirmationNotification } from "@/services/notifications";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const order = orders.find((o) => o.id === orderId);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    if (orderId) {
      scheduleOrderConfirmationNotification(orderId);
    }
  }, [orderId]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View
          style={[styles.circleOuter, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.circleInner}>
            <Animated.View style={{ opacity: checkAnim }}>
              <Feather name="check" size={48} color={Colors.charcoal} />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            {order?.status === "awaiting_verification"
              ? "Payment Proof Received"
              : "Order Placed!"}
          </Text>
          <Text style={[styles.orderId, { color: Colors.gold }]}>{orderId}</Text>
          <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
            {order?.status === "awaiting_verification"
              ? "We have received your payment proof and will verify it shortly. You'll be notified once verified."
              : "Your order has been placed successfully. We'll prepare it for dispatch soon."}
          </Text>

          <View style={[styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.timelineTitle, { color: theme.text }]}>What happens next?</Text>
            {[
              {
                icon: "check-circle",
                text:
                  order?.status === "awaiting_verification"
                    ? "Payment verification (1-2 hours)"
                    : "Order confirmed",
                done: true,
              },
              { icon: "package", text: "Order processing & packing", done: false },
              { icon: "truck", text: "Dispatch via courier", done: false },
              { icon: "map-pin", text: "Delivered to your doorstep", done: false },
            ].map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <Feather
                  name={step.icon as any}
                  size={16}
                  color={step.done ? Colors.successGreen : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.timelineText,
                    {
                      color: step.done ? theme.text : theme.textSecondary,
                      fontFamily: step.done ? "Inter_500Medium" : "Inter_400Regular",
                    },
                  ]}
                >
                  {step.text}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        <Pressable
          style={styles.trackBtn}
          onPress={() =>
            router.replace({ pathname: "/order/[id]", params: { id: orderId ?? "" } })
          }
        >
          <Feather name="package" size={18} color={Colors.charcoal} />
          <Text style={styles.trackBtnText}>Track Order</Text>
        </Pressable>
        <Pressable
          style={[styles.homeBtn, { borderColor: Colors.gold }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.homeBtnText, { color: Colors.gold }]}>Continue Shopping</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  circleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  textSection: {
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    textAlign: "center",
  },
  orderId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 1,
  },
  successMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginTop: 4,
  },
  timelineCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginTop: 8,
  },
  timelineTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttons: {
    gap: 12,
    paddingBottom: 8,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  trackBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.charcoal,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
  },
  homeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
