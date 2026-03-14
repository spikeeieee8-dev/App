import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const { isDarkMode, setDarkMode, orders, wishlist, setHasSeenWelcome } = useApp();
  const { user, logout, isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 8;

  type MenuItem = {
    icon: string; label: string; subtitle: string;
    onPress: () => void; isToggle?: boolean; isAdmin?: boolean; isDanger?: boolean;
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Shopping",
      items: [
        { icon: "package", label: "My Orders", subtitle: `${orders.length} orders`, onPress: () => router.push("/(tabs)/orders") },
        { icon: "heart", label: "Wishlist", subtitle: `${wishlist.length} saved items`, onPress: () => {} },
        { icon: "map-pin", label: "Saved Addresses", subtitle: "Manage delivery addresses", onPress: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "moon", label: "Dark Mode", subtitle: isDark ? "On" : "Off", onPress: () => {}, isToggle: true },
        { icon: "bell", label: "Notifications", subtitle: "Order updates & offers", onPress: () => {} },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "message-circle", label: "WhatsApp Support", subtitle: "Chat with us directly", onPress: () => {} },
        { icon: "info", label: "About Almera", subtitle: "Version 1.0.0", onPress: () => {} },
        {
          icon: "refresh-cw", label: "View Welcome Screen", subtitle: "Replay the intro",
          onPress: () => { setHasSeenWelcome(false); router.replace("/"); },
        },
      ],
    },
    ...(user?.role === "admin" ? [{
      title: "Admin",
      items: [
        { icon: "settings", label: "Admin Dashboard", subtitle: "Manage your store", onPress: () => router.push("/admin/index" as any), isAdmin: true },
      ],
    }] : []),
    ...(isAuthenticated ? [{
      title: "Account",
      items: [
        { icon: "log-out", label: "Sign Out", subtitle: `Signed in as ${user?.email}`, onPress: async () => { await logout(); }, isDanger: true },
      ],
    }] : []),
  ];

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "G";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: user ? Colors.gold : Colors.charcoalMid }]}>
              <Text style={[styles.avatarText, { color: user ? Colors.charcoal : Colors.mutedGray }]}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.userName, { color: theme.text }]}>{user ? user.name : "Guest"}</Text>
              <Text style={[styles.userRole, { color: user?.role === "admin" ? Colors.gold : theme.textSecondary }]}>
                {user?.role === "admin" ? "Admin · Almera" : user ? user.email : "Not signed in"}
              </Text>
            </View>
          </View>
          {!isAuthenticated && (
            <Pressable style={styles.signInBtn} onPress={() => router.push("/auth/login" as any)}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.statsRow}>
          {[
            { value: orders.length, label: "Orders" },
            { value: wishlist.length, label: "Wishlist" },
            { value: orders.filter((o) => o.status === "delivered").length, label: "Delivered" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: Colors.gold }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                  onPress={() => { if (!item.isToggle) { if (Platform.OS !== "web") Haptics.selectionAsync(); item.onPress(); } }}
                >
                  <View style={[styles.menuIcon, {
                    backgroundColor: item.isAdmin ? Colors.gold + "20" : item.isDanger ? Colors.errorRed + "12" : theme.backgroundSecondary,
                  }]}>
                    <Feather name={item.icon as any} size={15} color={item.isAdmin ? Colors.gold : item.isDanger ? Colors.errorRed : theme.text} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, {
                      color: item.isAdmin ? Colors.gold : item.isDanger ? Colors.errorRed : theme.text,
                      fontFamily: (item.isAdmin || item.isDanger) ? "Inter_600SemiBold" : "Inter_500Medium",
                    }]}>{item.label}</Text>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  {item.isToggle ? (
                    <Switch
                      value={isDarkMode}
                      onValueChange={(v) => { if (Platform.OS !== "web") Haptics.selectionAsync(); setDarkMode(v); }}
                      trackColor={{ false: theme.border, true: Colors.gold }}
                      thumbColor={isDarkMode ? Colors.charcoal : "#fff"}
                    />
                  ) : (
                    <Feather name="chevron-right" size={15} color={theme.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {!isAuthenticated && (
          <View style={styles.section}>
            <View style={[styles.authCard, { backgroundColor: Colors.gold + "10", borderColor: Colors.gold + "30" }]}>
              <Feather name="lock" size={20} color={Colors.gold} />
              <Text style={[styles.authCardTitle, { color: Colors.gold }]}>Sign in for full access</Text>
              <Text style={[styles.authCardText, { color: Colors.mutedGray }]}>Track orders, save wishlist, and more</Text>
              <View style={styles.authBtns}>
                <Pressable style={styles.authLoginBtn} onPress={() => router.push("/auth/login" as any)}>
                  <Text style={styles.authLoginText}>Sign In</Text>
                </Pressable>
                <Pressable style={[styles.authRegBtn, { borderColor: Colors.gold }]} onPress={() => router.push("/auth/register" as any)}>
                  <Text style={[styles.authRegText, { color: Colors.gold }]}>Register</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.brandFooter}>
          <Text style={[styles.brandName, { color: Colors.gold }]}>ALMERA</Text>
          <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>Premium Fashion for Pakistan</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  userRole: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  signInBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  signInText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.charcoal },
  statsRow: { flexDirection: "row", gap: 8, padding: 16 },
  statItem: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, marginBottom: 1 },
  menuSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11 },
  authCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  authCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 4 },
  authCardText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  authBtns: { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  authLoginBtn: { flex: 1, backgroundColor: Colors.gold, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  authLoginText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.charcoal },
  authRegBtn: { flex: 1, borderWidth: 1.5, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  authRegText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  brandFooter: { alignItems: "center", paddingVertical: 28, gap: 5 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 6 },
  brandTagline: { fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 0.5 },
});
