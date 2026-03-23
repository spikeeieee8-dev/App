import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Order, useApp } from "@/context/AppContext";

const STATUS_STEPS: { key: Order["status"]; label: string; icon: string }[] = [
  { key: "pending", label: "Order Placed", icon: "file-text" },
  { key: "awaiting_verification", label: "Payment Verification", icon: "eye" },
  { key: "verified", label: "Payment Verified", icon: "check-circle" },
  { key: "dispatched", label: "Dispatched", icon: "truck" },
  { key: "delivered", label: "Delivered", icon: "home" },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Pressable style={[styles.backBtn, { top: topInset + 12 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: theme.textSecondary }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);

  const paymentMethodLabel =
    order.paymentMethod === "easypaisa"
      ? "EasyPaisa"
      : "Cash on Delivery";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtnInline}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Order Details</Text>
          <Text style={[styles.orderId, { color: Colors.gold }]}>{order.id}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Order Timeline</Text>
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx && order.status !== "cancelled";
            const isCurrent = idx === currentStepIdx;
            const isLast = idx === STATUS_STEPS.length - 1;

            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: isCompleted ? Colors.gold : theme.backgroundSecondary,
                        borderColor: isCompleted ? Colors.gold : theme.border,
                        width: isCurrent ? 14 : 10,
                        height: isCurrent ? 14 : 10,
                        borderRadius: isCurrent ? 7 : 5,
                      },
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnector,
                        { backgroundColor: idx < currentStepIdx ? Colors.gold : theme.border },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Feather
                      name={step.icon as any}
                      size={14}
                      color={isCompleted ? Colors.gold : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timelineLabel,
                        {
                          color: isCompleted ? theme.text : theme.textSecondary,
                          fontFamily: isCurrent ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: Colors.gold + "20" }]}>
                        <Text style={[styles.currentBadgeText, { color: Colors.gold }]}>
                          Current
                        </Text>
                      </View>
                    )}
                  </View>
                  {step.key === "dispatched" && order.courierTrackingId && (
                    <Text style={[styles.trackingId, { color: theme.textSecondary }]}>
                      {order.courierName}: {order.courierTrackingId}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View
              key={`${item.product.id}-${item.size}-${item.color}`}
              style={[
                styles.orderItem,
                idx < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="image" size={16} color={Colors.mutedGray} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.product.name}</Text>
                <Text style={[styles.itemVariant, { color: theme.textSecondary }]}>
                  {item.size} · {item.color} · Qty: {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: theme.text }]}>
                Rs. {(item.product.discountedPrice * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Delivery Address</Text>
          <Text style={[styles.addressName, { color: theme.text }]}>{order.address.name}</Text>
          <Text style={[styles.addressText, { color: theme.textSecondary }]}>{order.address.phone}</Text>
          <Text style={[styles.addressText, { color: theme.textSecondary }]}>{order.address.address}</Text>
          <Text style={[styles.addressText, { color: theme.textSecondary }]}>
            {order.address.city}, {order.address.province}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Method</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{paymentMethodLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              Rs. {order.subtotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: order.shippingCost === 0 ? Colors.successGreen : theme.text }]}>
              {order.shippingCost === 0 ? "FREE" : `Rs. ${order.shippingCost}`}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={styles.totalValue}>Rs. {order.total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.helpSection}>
          <Feather name="message-circle" size={16} color={Colors.mutedGray} />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Need help with this order? Contact us on{" "}
            <Text style={{ color: Colors.gold }}>WhatsApp</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontFamily: "Inter_400Regular", fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  backBtnInline: { padding: 4 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  orderId: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  timelineLeft: {
    alignItems: "center",
    width: 14,
    paddingTop: 2,
  },
  timelineDot: {
    borderWidth: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    paddingTop: 0,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  timelineLabel: {
    fontSize: 13,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  trackingId: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 4,
  },
  itemVariant: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  itemPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  addressName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 4,
  },
  addressText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  summaryDivider: { height: 1, marginVertical: 8 },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.gold,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  helpText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
