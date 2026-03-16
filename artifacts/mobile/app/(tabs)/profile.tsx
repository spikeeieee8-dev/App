import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useColorScheme,
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

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "G";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en", { month: "short", year: "numeric" }) : null;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  type MenuItem = {
    icon: string; label: string; subtitle?: string;
    onPress: () => void; isToggle?: boolean; isAdmin?: boolean; isDanger?: boolean; value?: boolean;
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Shopping",
      items: [
        { icon: "package", label: "My Orders", subtitle: `${orders.length} total`, onPress: () => router.push("/(tabs)/orders") },
        { icon: "heart", label: "Wishlist", subtitle: `${wishlist.length} saved`, onPress: () => router.push("/wishlist" as any) },
        { icon: "map-pin", label: "Saved Addresses", subtitle: "Manage delivery addresses", onPress: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "moon", label: "Dark Mode", subtitle: isDark ? "Currently on" : "Currently off", onPress: () => setDarkMode(!isDarkMode), isToggle: true, value: isDarkMode },
        {
          icon: "bell", label: "Notifications", subtitle: "Order updates & offers",
          onPress: () => {
            if (Platform.OS === "web") {
              Alert.alert("Notifications", "Open your browser or device settings to manage notifications.");
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "message-circle", label: "WhatsApp Support", subtitle: "Chat with us directly",
          onPress: () => {
            const phone = "923001234567";
            const message = encodeURIComponent("Hi Almera, I need help with my order.");
            Linking.openURL(`https://wa.me/${phone}?text=${message}`).catch(() =>
              Alert.alert("WhatsApp not available", "Please install WhatsApp or reach us at support@almera.pk")
            );
          },
        },
        {
          icon: "info", label: "About Almera", subtitle: "Version 1.0.0",
          onPress: () =>
            Alert.alert(
              "About Almera",
              "Version 1.0.0\n\nAlmera is a premium fashion brand crafted for Pakistan — offering high-quality clothing with the elegance and comfort you deserve.\n\nFor support: support@almera.pk\nInstagram: @almera.pk",
              [{ text: "Close" }]
            ),
        },
        {
          icon: "refresh-cw", label: "View Welcome Screen", subtitle: "Replay the intro",
          onPress: () => { setHasSeenWelcome(false); router.replace("/"); },
        },
      ],
    },
    ...(user?.role === "admin" ? [{
      title: "Admin",
      items: [
        { icon: "settings", label: "Admin Dashboard", subtitle: "Manage your store", onPress: () => router.push("/admin" as any), isAdmin: true },
      ],
    }] : []),
    ...(isAuthenticated ? [{
      title: "Account",
      items: [
        { icon: "edit-2", label: "Edit Profile", subtitle: "Update name & phone", onPress: () => router.push("/account/edit" as any) },
        { icon: "log-out", label: "Sign Out", subtitle: `Signed in as ${user?.email}`, onPress: async () => { await logout(); }, isDanger: true },
      ],
    }] : []),
  ];

  const renderMenuRow = (item: MenuItem, idx: number, total: number) => {
    const rowStyle = [
      styles.menuItem,
      idx < total - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
    ];

    const iconBg = item.isAdmin
      ? Colors.gold + "18"
      : item.isDanger
      ? Colors.errorRed + "10"
      : theme.backgroundSecondary;

    const labelColor = item.isAdmin ? Colors.gold : item.isDanger ? Colors.errorRed : theme.text;
    const labelFont = (item.isAdmin || item.isDanger) ? "Inter_600SemiBold" : "Inter_500Medium";

    const inner = (
      <>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          <Feather
            name={item.icon as any}
            size={15}
            color={item.isAdmin ? Colors.gold : item.isDanger ? Colors.errorRed : theme.text}
          />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuLabel, { color: labelColor, fontFamily: labelFont }]}>{item.label}</Text>
          {item.subtitle && (
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
          )}
        </View>
        {item.isToggle ? (
          <Switch
            value={!!item.value}
            onValueChange={(v) => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setDarkMode(v);
            }}
            trackColor={{ false: theme.border, true: Colors.gold }}
            thumbColor={isDarkMode ? Colors.charcoal : "#fff"}
          />
        ) : (
          <Feather name="chevron-right" size={15} color={theme.textSecondary} />
        )}
      </>
    );

    if (item.isToggle) {
      return (
        <Pressable
          key={item.label}
          style={rowStyle}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            setDarkMode(!isDarkMode);
          }}
        >
          {inner}
        </Pressable>
      );
    }

    return (
      <Pressable
        key={item.label}
        style={rowStyle}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          item.onPress();
        }}
      >
        {inner}
      </Pressable>
    );
  };

  const STATS = [
    { value: orders.length, label: "Orders", icon: "package", onPress: () => router.push("/(tabs)/orders") },
    { value: wishlist.length, label: "Wishlist", icon: "heart", onPress: () => router.push("/wishlist" as any) },
    { value: deliveredCount, label: "Delivered", icon: "check-circle", onPress: () => router.push("/(tabs)/orders") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: user ? Colors.gold : theme.backgroundSecondary }]}>
            <Text style={[styles.avatarText, { color: user ? Colors.charcoal : theme.textSecondary }]}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{user ? user.name : "Guest"}</Text>
            <View style={styles.badgeRow}>
              {user?.role === "admin" && (
                <View style={[styles.roleBadge, { backgroundColor: Colors.gold + "20" }]}>
                  <Text style={[styles.roleBadgeText, { color: Colors.gold }]}>ADMIN</Text>
                </View>
              )}
              <Text style={[styles.userSub, { color: theme.textSecondary }]}>
                {user ? (memberSince ? `Member since ${memberSince}` : user.email) : "Not signed in"}
              </Text>
            </View>
          </View>
          {isAuthenticated && (
            <Pressable
              style={[styles.editBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={() => router.push("/account/edit" as any)}
            >
              <Feather name="edit-2" size={14} color={theme.textSecondary} />
            </Pressable>
          )}
          {!isAuthenticated && (
            <Pressable style={styles.signInBtn} onPress={() => router.push("/auth/login" as any)}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <Pressable
              key={stat.label}
              style={[styles.statItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                stat.onPress();
              }}
            >
              <Feather name={stat.icon as any} size={16} color={Colors.gold} style={{ marginBottom: 4 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              <Feather name="chevron-right" size={10} color={theme.textSecondary} style={{ marginTop: 2 }} />
            </Pressable>
          ))}
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, idx) => renderMenuRow(item, idx, section.items.length))}
            </View>
          </View>
        ))}

        {!isAuthenticated && (
          <View style={styles.section}>
            <View style={[styles.authCard, { backgroundColor: Colors.gold + "08", borderColor: Colors.gold + "25" }]}>
              <View style={[styles.authIconWrap, { backgroundColor: Colors.gold + "18" }]}>
                <Feather name="user-check" size={22} color={Colors.gold} />
              </View>
              <Text style={[styles.authCardTitle, { color: theme.text }]}>Sign in for full access</Text>
              <Text style={[styles.authCardText, { color: theme.textSecondary }]}>
                Track orders, save your wishlist, and manage your account
              </Text>
              <View style={styles.authBtns}>
                <Pressable style={styles.authLoginBtn} onPress={() => router.push("/auth/login" as any)}>
                  <Text style={styles.authLoginText}>Sign In</Text>
                </Pressable>
                <Pressable
                  style={[styles.authRegBtn, { borderColor: Colors.gold + "50", backgroundColor: Colors.gold + "10" }]}
                  onPress={() => router.push("/auth/register" as any)}
                >
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
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerInfo: { flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  userSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  editBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  signInBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  signInText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.charcoal },
  statsRow: { flexDirection: "row", gap: 8, padding: 16 },
  statItem: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12,
    alignItems: "center", gap: 2,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, marginBottom: 1 },
  menuSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11 },
  authCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  authIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  authCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  authCardText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  authBtns: { flexDirection: "row", gap: 10, marginTop: 6, width: "100%" },
  authLoginBtn: { flex: 1, backgroundColor: Colors.gold, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  authLoginText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.charcoal },
  authRegBtn: { flex: 1, borderWidth: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  authRegText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  brandFooter: { alignItems: "center", paddingVertical: 28, gap: 5 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 6 },
  brandTagline: { fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 0.5 },
});
