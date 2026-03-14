import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "#F39C12",
  awaiting_verification: "#3498DB",
  verified: Colors.successGreen,
  dispatched: "#9B59B6",
  delivered: Colors.gold,
  cancelled: Colors.errorRed,
};

export default function AdminOrdersScreen() {
  const { orders, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [filter, setFilter] = useState<Order["status"] | "all">("all");

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const STATUS_LABELS: Record<string, string> = {
    all: "All",
    pending: "Pending",
    awaiting_verification: "Awaiting",
    verified: "Verified",
    dispatched: "Dispatched",
    delivered: "Delivered",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: Colors.charcoal, borderBottomColor: "rgba(201,168,76,0.2)" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.offWhite} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Management</Text>
        <Text style={[styles.orderCount, { color: Colors.gold }]}>{orders.length}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "pending", "awaiting_verification", "verified", "dispatched", "delivered"] as const).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f
                    ? f === "all"
                      ? Colors.gold
                      : STATUS_COLORS[f as Order["status"]]
                    : theme.backgroundSecondary,
                borderColor:
                  filter === f
                    ? f === "all"
                      ? Colors.gold
                      : STATUS_COLORS[f as Order["status"]]
                    : theme.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? (f === "all" ? Colors.charcoal : "#fff") : theme.text, fontFamily: filter === f ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {STATUS_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No orders in this category</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {filtered.map((order) => {
            const statusColor = STATUS_COLORS[order.status];
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
                    <Text style={[styles.orderMeta, { color: theme.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} · {itemCount} items
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.orderBottom}>
                  <View>
                    <Text style={[styles.customerName, { color: theme.text }]}>
                      {order.address.name}
                    </Text>
                    <Text style={[styles.customerCity, { color: theme.textSecondary }]}>
                      {order.address.city}, {order.address.province}
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>Rs. {order.total.toLocaleString()}</Text>
                    <Text style={[styles.paymentMethod, { color: theme.textSecondary }]}>
                      {order.paymentMethod === "cod"
                        ? "COD"
                        : order.paymentMethod === "easypaid"
                        ? "EasyPaisa"
                        : "JazzCash"}
                    </Text>
                  </View>
                </View>

                {order.status === "awaiting_verification" && (
                  <View style={[styles.actionBanner, { backgroundColor: "#3498DB" + "15", borderColor: "#3498DB" + "40" }]}>
                    <Feather name="eye" size={12} color="#3498DB" />
                    <Text style={[styles.actionBannerText, { color: "#3498DB" }]}>
                      Payment proof uploaded — verify to proceed
                    </Text>
                  </View>
                )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.offWhite,
  },
  orderCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  filterBar: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: { fontSize: 12 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  orderCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 3,
  },
  orderMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  divider: { height: 1, marginBottom: 12 },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  customerName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 2,
  },
  customerCity: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  orderRight: { alignItems: "flex-end" },
  orderTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.gold,
    marginBottom: 2,
  },
  paymentMethod: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBannerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
