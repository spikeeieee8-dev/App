import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const THEMES = [
  { id: "default", label: "Default", color: Colors.gold, icon: "sun" },
  { id: "ramadan", label: "Ramadan", color: "#2ECC71", icon: "moon" },
  { id: "eid", label: "Eid", color: "#F39C12", icon: "star" },
  { id: "independence", label: "Independence Day", color: "#27AE60", icon: "flag" },
];

export default function AdminDashboard() {
  const { orders, products, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [activeTheme, setActiveTheme] = useState("default");

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalProfit = orders.reduce(
    (s, o) =>
      s +
      o.items.reduce(
        (ps, item) => ps + (item.product.discountedPrice - item.product.costPrice) * item.quantity,
        0
      ),
    0
  );
  const aov = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "awaiting_verification"
  ).length;
  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stock <= 5)
  ).length;

  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    awaiting_verification: orders.filter((o) => o.status === "awaiting_verification").length,
    verified: orders.filter((o) => o.status === "verified").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const metrics = [
    { label: "Gross Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, icon: "trending-up", color: Colors.successGreen },
    { label: "Total Profit", value: `Rs. ${totalProfit.toLocaleString()}`, icon: "dollar-sign", color: Colors.gold },
    { label: "Avg Order Value", value: `Rs. ${aov.toLocaleString()}`, icon: "bar-chart-2", color: "#3498DB" },
    { label: "Total Orders", value: orders.length.toString(), icon: "package", color: "#9B59B6" },
  ];

  const alerts = [
    ...(pendingOrders > 0
      ? [{ type: "warning", text: `${pendingOrders} orders need attention`, icon: "alert-circle" }]
      : []),
    ...(lowStockProducts > 0
      ? [{ type: "error", text: `${lowStockProducts} products low in stock`, icon: "alert-triangle" }]
      : []),
    ...(pendingOrders === 0 && lowStockProducts === 0
      ? [{ type: "success", text: "All systems normal. Store is running smoothly.", icon: "check-circle" }]
      : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: Colors.charcoal, borderBottomColor: "rgba(201,168,76,0.2)" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={Colors.offWhite} />
        </Pressable>
        <View>
          <Text style={styles.adminLabel}>ADMIN</Text>
          <Text style={styles.headerTitle}>Command Center</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: Colors.gold }]}>
          <Text style={styles.adminBadgeText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {alerts.map((alert, i) => (
          <View
            key={i}
            style={[
              styles.alertBanner,
              {
                backgroundColor:
                  alert.type === "success"
                    ? Colors.successGreen + "15"
                    : alert.type === "warning"
                    ? "#F39C12" + "15"
                    : Colors.errorRed + "15",
                borderColor:
                  alert.type === "success"
                    ? Colors.successGreen + "40"
                    : alert.type === "warning"
                    ? "#F39C12" + "40"
                    : Colors.errorRed + "40",
              },
            ]}
          >
            <Feather
              name={alert.icon as any}
              size={14}
              color={
                alert.type === "success"
                  ? Colors.successGreen
                  : alert.type === "warning"
                  ? "#F39C12"
                  : Colors.errorRed
              }
            />
            <Text
              style={[
                styles.alertText,
                {
                  color:
                    alert.type === "success"
                      ? Colors.successGreen
                      : alert.type === "warning"
                      ? "#F39C12"
                      : Colors.errorRed,
                },
              ]}
            >
              {alert.text}
            </Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Financial Overview</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View
                key={m.label}
                style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.metricIcon, { backgroundColor: m.color + "20" }]}>
                  <Feather name={m.icon as any} size={18} color={m.color} />
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Pipeline</Text>
          <View style={[styles.pipelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {Object.entries(statusCounts).map(([status, count], idx) => {
              const labels: Record<string, string> = {
                pending: "Pending",
                awaiting_verification: "Awaiting Verification",
                verified: "Verified",
                dispatched: "Dispatched",
                delivered: "Delivered",
              };
              const colors = {
                pending: "#F39C12",
                awaiting_verification: "#3498DB",
                verified: Colors.successGreen,
                dispatched: "#9B59B6",
                delivered: Colors.gold,
              };
              return (
                <View
                  key={status}
                  style={[
                    styles.pipelineRow,
                    idx < Object.keys(statusCounts).length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={[styles.pipelineDot, { backgroundColor: colors[status as keyof typeof colors] }]} />
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>{labels[status]}</Text>
                  <View style={[styles.pipelineCount, { backgroundColor: (colors[status as keyof typeof colors]) + "20" }]}>
                    <Text style={[styles.pipelineCountText, { color: colors[status as keyof typeof colors] }]}>{count}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: "package", label: "Manage Orders", route: "/admin/orders", color: "#3498DB" },
              { icon: "tag", label: "Products", route: "/admin/products", color: Colors.gold },
              { icon: "users", label: "Customers", route: null, color: "#9B59B6" },
              { icon: "bar-chart-2", label: "Analytics", route: null, color: Colors.successGreen },
            ].map((action) => (
              <Pressable
                key={action.label}
                style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => action.route && router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                  <Feather name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Engine</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Activate seasonal themes for your store
          </Text>
          <View style={[styles.themesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {THEMES.map((t, idx) => (
              <Pressable
                key={t.id}
                style={[
                  styles.themeRow,
                  idx < THEMES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  activeTheme === t.id && { backgroundColor: t.color + "10" },
                ]}
                onPress={() => setActiveTheme(t.id)}
              >
                <View style={[styles.themeIconBg, { backgroundColor: t.color + "20" }]}>
                  <Feather name={t.icon as any} size={16} color={t.color} />
                </View>
                <Text style={[styles.themeLabel, { color: activeTheme === t.id ? t.color : theme.text, fontFamily: activeTheme === t.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {t.label}
                </Text>
                {activeTheme === t.id && (
                  <View style={[styles.activeThemeBadge, { backgroundColor: t.color }]}>
                    <Text style={styles.activeThemeText}>Active</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Store Stats</Text>
          <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              { label: "Total Products", value: products.length },
              { label: "Low Stock Items", value: lowStockProducts, warn: lowStockProducts > 0 },
              {
                label: "Total Revenue",
                value: `Rs. ${totalRevenue.toLocaleString()}`,
              },
              { label: "Active Customers", value: "—" },
            ].map((stat, idx) => (
              <View
                key={stat.label}
                style={[
                  styles.statRow,
                  idx < 3 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: stat.warn ? Colors.errorRed : theme.text }]}>
                  {stat.value}
                </Text>
              </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  adminLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 2,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.offWhite,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.charcoal,
    letterSpacing: 1,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  metricCard: {
    width: (width - 42) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  metricLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  pipelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  pipelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipelineLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  pipelineCount: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pipelineCountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  actionCard: {
    width: (width - 42) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  themesCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  themeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    flex: 1,
    fontSize: 14,
  },
  activeThemeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeThemeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.charcoal,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  statValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
