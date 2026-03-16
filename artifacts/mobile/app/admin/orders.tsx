import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Order, useApp } from "@/context/AppContext";
import { api } from "@/services/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F39C12", awaiting_verification: "#3498DB", verified: Colors.successGreen,
  dispatched: "#9B59B6", delivered: Colors.gold, cancelled: Colors.errorRed,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", awaiting_verification: "Awaiting Verification",
  verified: "Verified", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "clock", awaiting_verification: "eye", verified: "check-circle",
  dispatched: "truck", delivered: "home", cancelled: "x-circle",
};

const NEXT_STATUSES: Record<string, Order["status"][]> = {
  pending: ["awaiting_verification", "verified", "cancelled"],
  awaiting_verification: ["verified", "cancelled"],
  verified: ["dispatched", "cancelled"],
  dispatched: ["delivered"],
  delivered: [],
  cancelled: [],
};

type UpdateModal = {
  orderId: string;
  currentStatus: string;
  targetStatus: string;
};

export default function AdminOrdersScreen() {
  const { orders, isDarkMode, refreshOrders } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 8;

  const [filter, setFilter] = useState<Order["status"] | "all">("all");
  const [modal, setModal] = useState<UpdateModal | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updatedOrders, setUpdatedOrders] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
      const interval = setInterval(() => {
        refreshOrders();
      }, 20000);
      return () => clearInterval(interval);
    }, [refreshOrders])
  );

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const handleUpdateStatus = async () => {
    if (!modal) return;
    setUpdating(true);
    try {
      await api.orders.updateStatus(modal.orderId, modal.targetStatus, {
        courierName: courierName || undefined,
        courierTrackingId: trackingId || undefined,
        notes: notes || undefined,
      });
      setUpdatedOrders((prev) => ({ ...prev, [modal.orderId]: modal.targetStatus }));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSyncing(true);
      await refreshOrders();
      setSyncing(false);
    } catch (e) {
    } finally {
      setUpdating(false);
      setModal(null);
      setCourierName(""); setTrackingId(""); setNotes("");
    }
  };

  const handleManualRefresh = async () => {
    setSyncing(true);
    await refreshOrders();
    setSyncing(false);
  };

  const getOrderStatus = (order: Order): string => updatedOrders[order.id] || order.status;

  const filterCounts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => {
    filterCounts[o.status] = (filterCounts[o.status] || 0) + 1;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Management</Text>
        <Pressable onPress={handleManualRefresh} style={styles.refreshBtn}>
          {syncing
            ? <ActivityIndicator size="small" color={Colors.gold} />
            : <Feather name="refresh-cw" size={16} color={Colors.gold} />
          }
        </Pressable>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "pending", "awaiting_verification", "verified", "dispatched", "delivered"] as const).map((f) => {
          const count = filterCounts[f] || 0;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, {
                backgroundColor: filter === f ? (f === "all" ? Colors.gold : STATUS_COLORS[f] || Colors.gold) : theme.backgroundSecondary,
                borderColor: filter === f ? (f === "all" ? Colors.gold : STATUS_COLORS[f] || Colors.gold) : theme.border,
              }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, {
                color: filter === f ? (f === "all" ? Colors.charcoal : "#fff") : theme.text,
                fontFamily: filter === f ? "Inter_600SemiBold" : "Inter_400Regular",
              }]}>
                {f === "all" ? "All" : STATUS_LABELS[f]?.split(" ")[0]}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: filter === f ? "rgba(0,0,0,0.2)" : theme.border }]}>
                  <Text style={[styles.filterCountText, { color: filter === f ? "#fff" : theme.textSecondary }]}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={44} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No orders in this category</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {filtered.map((order) => {
            const currentStatus = getOrderStatus(order);
            const statusColor = STATUS_COLORS[currentStatus] || Colors.mutedGray;
            const nextStatuses = NEXT_STATUSES[currentStatus] || [];
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const isUpdated = !!updatedOrders[order.id];

            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.card, borderColor: isUpdated ? Colors.successGreen + "40" : theme.border }]}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
                    <Text style={[styles.orderMeta, { color: theme.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · {itemCount} item{itemCount !== 1 ? "s" : ""} · {order.paymentMethod === "cod" ? "COD" : order.paymentMethod === "easypaid" ? "EasyPaisa" : "JazzCash"}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <Feather name={STATUS_ICONS[currentStatus] as any || "circle"} size={10} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[currentStatus] || currentStatus}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.customerRow}>
                  <View style={[styles.customerAvatar, { backgroundColor: theme.backgroundSecondary }]}>
                    <Text style={[styles.customerInitial, { color: theme.text }]}>
                      {order.address.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={[styles.customerName, { color: theme.text }]}>{order.address.name}</Text>
                    <Text style={[styles.customerCity, { color: theme.textSecondary }]}>
                      {order.address.city}, {order.address.province} · {order.address.phone}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>Rs. {order.total.toLocaleString()}</Text>
                </View>

                {order.status === "awaiting_verification" && (
                  <View style={[styles.verifyBanner, { backgroundColor: "#3498DB" + "12", borderColor: "#3498DB" + "30" }]}>
                    <Feather name="image" size={12} color="#3498DB" />
                    <Text style={[styles.verifyText, { color: "#3498DB" }]}>Payment proof uploaded — review and verify</Text>
                  </View>
                )}

                {nextStatuses.length > 0 && (
                  <View style={styles.actionsRow}>
                    <Text style={[styles.actionsLabel, { color: theme.textSecondary }]}>Move to:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {nextStatuses.map((s) => (
                        <Pressable
                          key={s}
                          style={[styles.actionBtn, { backgroundColor: STATUS_COLORS[s] + "15", borderColor: STATUS_COLORS[s] + "50" }]}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                            setModal({ orderId: order.id, currentStatus, targetStatus: s });
                            setCourierName(""); setTrackingId(""); setNotes("");
                          }}
                        >
                          <Feather name={STATUS_ICONS[s] as any} size={12} color={STATUS_COLORS[s]} />
                          <Text style={[styles.actionBtnText, { color: STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push({ pathname: "/order/[id]", params: { id: order.id } })}
                >
                  <Text style={[styles.viewBtnText, { color: Colors.gold }]}>View Full Details</Text>
                  <Feather name="chevron-right" size={12} color={Colors.gold} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update Order Status</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              Moving to: <Text style={{ color: STATUS_COLORS[modal?.targetStatus || ""] || Colors.gold }}>
                {STATUS_LABELS[modal?.targetStatus || ""]}
              </Text>
            </Text>

            {modal?.targetStatus === "dispatched" && (
              <>
                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Courier Name</Text>
                  <TextInput
                    value={courierName}
                    onChangeText={setCourierName}
                    placeholder="TCS, Leopard, etc."
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Tracking ID</Text>
                  <TextInput
                    value={trackingId}
                    onChangeText={setTrackingId}
                    placeholder="CN123456789"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  />
                </View>
              </>
            )}

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a note..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={2}
                style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text, height: 60, textAlignVertical: "top" }]}
              />
            </View>

            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setModal(null)}>
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: STATUS_COLORS[modal?.targetStatus || ""] || Colors.gold, opacity: updating ? 0.7 : 1 }]}
                onPress={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  refreshBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  filterBar: { borderBottomWidth: 1, flexGrow: 0 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: "center" },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1 },
  filterText: { fontSize: 12 },
  filterCount: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  filterCountText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  orderCard: { marginHorizontal: 12, marginTop: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  orderId: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 3 },
  orderMeta: { fontFamily: "Inter_400Regular", fontSize: 11 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  divider: { height: 1, marginBottom: 10 },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  customerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  customerInitial: { fontFamily: "Inter_700Bold", fontSize: 15 },
  customerInfo: { flex: 1 },
  customerName: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 2 },
  customerCity: { fontFamily: "Inter_400Regular", fontSize: 11 },
  orderTotal: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.gold },
  verifyBanner: {
    flexDirection: "row", alignItems: "center", gap: 6, padding: 8,
    borderRadius: 8, borderWidth: 1, marginBottom: 8,
  },
  verifyText: { fontFamily: "Inter_500Medium", fontSize: 11, flex: 1 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  actionsLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end" },
  viewBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 14 },
  modalField: { gap: 6 },
  modalLabel: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderWidth: 1.5, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalConfirmText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
});
