import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Dimensions, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";

const { width } = Dimensions.get("window");

const THEMES = [
  { id: "default", label: "Default", color: Colors.gold, icon: "sun" },
  { id: "ramadan", label: "Ramadan", color: "#2ECC71", icon: "moon" },
  { id: "eid", label: "Eid", color: "#F39C12", icon: "star" },
  { id: "independence", label: "Independence Day", color: "#27AE60", icon: "flag" },
];

type Analytics = {
  totalRevenue: number; totalProfit: number; totalOrders: number; totalProducts: number;
  totalUsers: number; avgOrderValue: number; last7Days: any[]; statusBreakdown: any;
  topProducts: any[]; lowStockCount: number; pendingActions: number;
};

export default function AdminDashboard() {
  const { orders: localOrders, products, isDarkMode } = useApp();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 8;
  const [activeTheme, setActiveTheme] = useState("default");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [useApi, setUseApi] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await api.analytics.summary();
      setAnalytics(data);
      setUseApi(true);
    } catch {
      setUseApi(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const orders = localOrders;
  const totalRevenue = useApi && analytics ? analytics.totalRevenue : orders.reduce((s, o) => s + o.total, 0);
  const totalProfit = useApi && analytics ? analytics.totalProfit : orders.reduce((s, o) => s + o.items.reduce((ps, item) => ps + (item.product.discountedPrice - item.product.costPrice) * item.quantity, 0), 0);
  const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const last7 = analytics?.last7Days || Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en", { weekday: "short" }), revenue: 0, orders: 0 };
  });

  const statusBreakdown = analytics?.statusBreakdown || {
    pending: orders.filter(o => o.status === "pending").length,
    awaiting_verification: orders.filter(o => o.status === "awaiting_verification").length,
    verified: orders.filter(o => o.status === "verified").length,
    dispatched: orders.filter(o => o.status === "dispatched").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const lowStockCount = products.filter(p => p.variants.some(v => v.stock <= 5)).length;
  const pendingActions = (statusBreakdown.pending || 0) + (statusBreakdown.awaiting_verification || 0);
  const totalUsers = analytics?.totalUsers || 1;

  const revenueBarData = last7.map((d: any) => ({
    label: d.label, value: d.revenue || 0, color: Colors.gold,
  }));

  const ordersLineData = last7.map((d: any) => ({
    label: d.label, value: d.orders || 0,
  }));

  const maxRev = Math.max(...revenueBarData.map((d: any) => d.value));

  const topProducts = analytics?.topProducts || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.adminBadge, { color: Colors.gold }]}>ADMIN</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Command Center</Text>
        </View>
        <View style={[styles.liveDot, { backgroundColor: Colors.successGreen }]}>
          <Text style={styles.liveDotText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {pendingActions > 0 && (
          <Pressable
            style={[styles.alertBanner, { backgroundColor: "#F39C12" + "15", borderColor: "#F39C12" + "40" }]}
            onPress={() => router.push("/admin/orders" as any)}
          >
            <Feather name="alert-circle" size={14} color="#F39C12" />
            <Text style={[styles.alertText, { color: "#F39C12" }]}>
              {pendingActions} orders need your attention
            </Text>
            <Feather name="chevron-right" size={14} color="#F39C12" />
          </Pressable>
        )}

        {!useApi && (
          <View style={[styles.apiBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Feather name="wifi-off" size={12} color={theme.textSecondary} />
            <Text style={[styles.apiText, { color: theme.textSecondary }]}>
              Showing local data. Connect to API for live sync.
            </Text>
          </View>
        )}

        <View style={styles.metricsGrid}>
          {[
            { label: "Revenue", value: `Rs. ${(totalRevenue / 1000).toFixed(1)}k`, icon: "trending-up", color: Colors.successGreen },
            { label: "Profit", value: `Rs. ${(totalProfit / 1000).toFixed(1)}k`, icon: "dollar-sign", color: Colors.gold },
            { label: "Orders", value: orders.length.toString(), icon: "package", color: "#3498DB" },
            { label: "Avg. Order", value: `Rs. ${(avgOrder / 1000).toFixed(1)}k`, icon: "bar-chart", color: "#9B59B6" },
            { label: "Products", value: products.length.toString(), icon: "tag", color: Colors.gold },
            { label: "Users", value: totalUsers.toString(), icon: "users", color: Colors.successGreen },
            { label: "Low Stock", value: lowStockCount.toString(), icon: "alert-triangle", color: lowStockCount > 0 ? Colors.errorRed : Colors.successGreen },
            { label: "Pending", value: pendingActions.toString(), icon: "clock", color: pendingActions > 0 ? "#F39C12" : Colors.successGreen },
          ].map((m) => (
            <View key={m.label} style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.metricIcon, { backgroundColor: m.color + "18" }]}>
                <Feather name={m.icon as any} size={16} color={m.color} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Revenue — Last 7 Days</Text>
          {maxRev > 0 ? (
            <BarChart data={revenueBarData} height={140} isDark={isDark} valuePrefix="Rs." />
          ) : (
            <View style={styles.noDataBox}>
              <Feather name="bar-chart-2" size={24} color={theme.textSecondary} />
              <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No revenue data yet</Text>
            </View>
          )}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Orders — Last 7 Days</Text>
          <LineChart data={ordersLineData} height={110} color={Colors.successGreen} isDark={isDark} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Order Status Breakdown</Text>
          <View style={styles.statusGrid}>
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const colorsMap: Record<string, string> = {
                pending: "#F39C12", awaiting_verification: "#3498DB", verified: Colors.successGreen,
                dispatched: "#9B59B6", delivered: Colors.gold, cancelled: Colors.errorRed,
              };
              const labels: Record<string, string> = {
                pending: "Pending", awaiting_verification: "Awaiting", verified: "Verified",
                dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled",
              };
              const c = colorsMap[status] || Colors.mutedGray;
              const total = Object.values(statusBreakdown).reduce((a: number, b) => a + (b as number), 0) || 1;
              const pct = Math.round(((count as number) / total) * 100);
              return (
                <View key={status} style={styles.statusItem}>
                  <View style={styles.statusHeader}>
                    <View style={[styles.statusDot, { backgroundColor: c }]} />
                    <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{labels[status]}</Text>
                    <Text style={[styles.statusCount, { color: theme.text }]}>{count as number}</Text>
                  </View>
                  <View style={[styles.statusBar, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.statusBarFill, { width: `${pct}%`, backgroundColor: c }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {topProducts.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Top Products</Text>
            {topProducts.map((p: any, i: number) => (
              <View key={p.id} style={[styles.topProductRow, i < topProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={[styles.rankBadge, { backgroundColor: i === 0 ? Colors.gold : theme.backgroundSecondary }]}>
                  <Text style={[styles.rankText, { color: i === 0 ? Colors.charcoal : theme.textSecondary }]}>#{i + 1}</Text>
                </View>
                <Text style={[styles.topProductName, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                <View style={styles.topProductStats}>
                  <Text style={[styles.topProductRevenue, { color: Colors.gold }]}>Rs. {p.revenue.toLocaleString()}</Text>
                  <Text style={[styles.topProductUnits, { color: theme.textSecondary }]}>{p.unitsSold} sold</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          {[
            { icon: "package", label: "Orders", route: "/admin/orders", color: "#3498DB" },
            { icon: "tag", label: "Products", route: "/admin/products", color: Colors.gold },
            { icon: "users", label: "Users", route: "/admin/users", color: Colors.successGreen },
          ].map((a) => (
            <Pressable
              key={a.label}
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + "18" }]}>
                <Feather name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>{a.label}</Text>
              <Feather name="chevron-right" size={14} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.themesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Seasonal Theme</Text>
          <View style={styles.themesGrid}>
            {THEMES.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.themeBtn, {
                  backgroundColor: activeTheme === t.id ? t.color + "15" : theme.backgroundSecondary,
                  borderColor: activeTheme === t.id ? t.color : theme.border,
                  borderWidth: activeTheme === t.id ? 1.5 : 1,
                }]}
                onPress={() => setActiveTheme(t.id)}
              >
                <Feather name={t.icon as any} size={16} color={activeTheme === t.id ? t.color : theme.textSecondary} />
                <Text style={[styles.themeBtnText, { color: activeTheme === t.id ? t.color : theme.text, fontFamily: activeTheme === t.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
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
  headerCenter: { alignItems: "center" },
  adminBadge: { fontFamily: "Inter_500Medium", fontSize: 9, color: Colors.gold, letterSpacing: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.offWhite },
  liveDot: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  liveDotText: { fontFamily: "Inter_700Bold", fontSize: 9, color: Colors.charcoal, letterSpacing: 1 },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8, margin: 12,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  alertText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  apiBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 12, marginBottom: 4, padding: 10,
    borderRadius: 8, borderWidth: 1,
  },
  apiText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  metricsGrid: {
    flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8,
  },
  metricCard: {
    width: (width - 24 - 24) / 4,
    borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 6,
  },
  metricIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 13, textAlign: "center" },
  metricLabel: { fontFamily: "Inter_400Regular", fontSize: 9, textAlign: "center" },
  chartCard: {
    marginHorizontal: 12, marginBottom: 10, borderRadius: 16, borderWidth: 1, padding: 16,
  },
  chartTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 14 },
  noDataBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  noDataText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  statusGrid: { gap: 10 },
  statusItem: { gap: 5 },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  statusCount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statusBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  statusBarFill: { height: "100%", borderRadius: 2 },
  topProductRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  rankBadge: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  rankText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  topProductName: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  topProductStats: { alignItems: "flex-end" },
  topProductRevenue: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  topProductUnits: { fontFamily: "Inter_400Regular", fontSize: 10 },
  actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, marginBottom: 10 },
  actionCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  themesCard: { marginHorizontal: 12, marginBottom: 10, borderRadius: 16, borderWidth: 1, padding: 16 },
  themesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  themeBtnText: { fontSize: 12 },
});
