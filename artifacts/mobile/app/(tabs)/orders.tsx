import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
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

const STATUS_CONFIG: Record<
  Order["status"],
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Pending", color: "#F39C12", icon: "clock" },
  awaiting_verification: { label: "Awaiting Verification", color: "#3498DB", icon: "eye" },
  verified: { label: "Verified", color: Colors.successGreen, icon: "check-circle" },
  dispatched: { label: "Dispatched", color: "#9B59B6", icon: "truck" },
  delivered: { label: "Delivered", color: Colors.successGreen, icon: "check-circle" },
  cancelled: { label: "Cancelled", color: Colors.errorRed, icon: "x-circle" },
};

export default function OrdersScreen() {
  const { orders, isDarkMode, refreshOrders } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders])
  );
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Orders</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: Colors.gold + "18" }]}>
            <Text style={[styles.countBadgeText, { color: Colors.gold }]}>{orders.length}</Text>
          </View>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="package" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Your order history will appear here
          </Text>
          <Pressable
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, padding: 16 }}
        >
          {orders.map((order) => {
            const statusConf = STATUS_CONFIG[order.status];
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Pressable
                key={order.id}
                style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } })}
              >
                <View style={styles.orderTop}>
                  <View>
                    <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
                    <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConf.color + "20" }]}>
                    <Feather name={statusConf.icon as any} size={12} color={statusConf.color} />
                    <Text style={[styles.statusText, { color: statusConf.color }]}>
                      {statusConf.label}
                    </Text>
                  </View>
                </View>

                <View style={[styles.orderDivider, { backgroundColor: theme.border }]} />

                <View style={styles.orderTimeline}>
                  {(["pending", "awaiting_verification", "verified", "dispatched", "delivered"] as Order["status"][]).map(
                    (step, idx) => {
                      const steps: Order["status"][] = [
                        "pending", "awaiting_verification", "verified", "dispatched", "delivered",
                      ];
                      const currentIdx = steps.indexOf(order.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <View key={step} style={styles.timelineStep}>
                          <View
                            style={[
                              styles.timelineDot,
                              {
                                backgroundColor: isCompleted ? Colors.gold : theme.backgroundSecondary,
                                borderColor: isCompleted ? Colors.gold : theme.border,
                                width: isCurrent ? 12 : 8,
                                height: isCurrent ? 12 : 8,
                              },
                            ]}
                          />
                          {idx < 4 && (
                            <View
                              style={[
                                styles.timelineLine,
                                {
                                  backgroundColor: idx < currentIdx ? Colors.gold : theme.border,
                                },
                              ]}
                            />
                          )}
                        </View>
                      );
                    }
                  )}
                </View>

                <View style={styles.orderBottom}>
                  <Text style={[styles.orderItems, { color: theme.textSecondary }]}>
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </Text>
                  <Text style={styles.orderTotal}>
                    Rs. {order.total.toLocaleString()}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={16}
                  color={theme.textSecondary}
                  style={styles.chevron}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  shopBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  shopBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.charcoal,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  orderDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  orderDivider: {
    height: 1,
    marginBottom: 12,
  },
  orderTimeline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineDot: {
    borderRadius: 6,
    borderWidth: 2,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    width: 30,
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 24,
  },
  orderItems: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  orderTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.gold,
  },
  chevron: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
