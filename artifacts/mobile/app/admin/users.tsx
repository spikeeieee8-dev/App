import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  createdAt: string;
};

export default function AdminUsersScreen() {
  const { isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "user" | "admin">("all");

  const fetchUsers = async () => {
    try {
      const data = await api.analytics.users();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + 8,
        backgroundColor: theme.card,
        borderBottomColor: theme.border,
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Users</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{users.length} total</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: Colors.gold }]}>
          <Text style={styles.countBadgeText}>{users.length}</Text>
        </View>
      </View>

      <View style={[styles.statsBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {[
          { label: "All Users", value: users.length, id: "all" as const, color: Colors.gold },
          { label: "Customers", value: userCount, id: "user" as const, color: "#3498DB" },
          { label: "Admins", value: adminCount, id: "admin" as const, color: Colors.errorRed },
        ].map((s) => (
          <Pressable
            key={s.id}
            style={[styles.statChip, {
              backgroundColor: filter === s.id ? s.color + "18" : "transparent",
              borderColor: filter === s.id ? s.color + "50" : "transparent",
              borderWidth: 1,
            }]}
            onPress={() => setFilter(s.id)}
          >
            <Text style={[styles.statChipValue, { color: filter === s.id ? s.color : theme.text }]}>{s.value}</Text>
            <Text style={[styles.statChipLabel, { color: filter === s.id ? s.color : theme.textSecondary }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchInput, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Feather name="search" size={15} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchText, { color: theme.text }]}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading users...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="users" size={44} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {search ? "No users match your search" : "No users found"}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }}
        >
          {filtered.map((user, idx) => {
            const isAdmin = user.role === "admin";
            const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const joinDate = new Date(user.createdAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });

            return (
              <View
                key={user.id}
                style={[styles.userCard, {
                  backgroundColor: theme.card,
                  borderColor: isAdmin ? Colors.gold + "30" : theme.border,
                }]}
              >
                <View style={[styles.userAvatar, {
                  backgroundColor: isAdmin ? Colors.gold + "20" : theme.backgroundSecondary,
                }]}>
                  <Text style={[styles.userInitials, { color: isAdmin ? Colors.gold : theme.text }]}>{initials}</Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
                    {isAdmin && (
                      <View style={[styles.adminBadge, { backgroundColor: Colors.gold + "18" }]}>
                        <Text style={[styles.adminBadgeText, { color: Colors.gold }]}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>{user.email}</Text>
                  <View style={styles.userMeta}>
                    {user.phone && (
                      <>
                        <Feather name="phone" size={10} color={theme.textSecondary} />
                        <Text style={[styles.userMetaText, { color: theme.textSecondary }]}>{user.phone}</Text>
                        <Text style={[styles.userMetaDot, { color: theme.border }]}>·</Text>
                      </>
                    )}
                    <Feather name="calendar" size={10} color={theme.textSecondary} />
                    <Text style={[styles.userMetaText, { color: theme.textSecondary }]}>Joined {joinDate}</Text>
                  </View>
                </View>

                <View style={[styles.userIdBadge, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.userIdText, { color: theme.textSecondary }]}>#{idx + 1}</Text>
                </View>
              </View>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.charcoal },
  statsBar: {
    flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10,
    gap: 6, borderBottomWidth: 1,
  },
  statChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, gap: 2 },
  statChipValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statChipLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  searchBar: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  userInitials: { fontFamily: "Inter_700Bold", fontSize: 16 },
  userInfo: { flex: 1, gap: 3 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 12 },
  userMeta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  userMetaText: { fontFamily: "Inter_400Regular", fontSize: 10 },
  userMetaDot: { fontSize: 12 },
  userIdBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  userIdText: { fontFamily: "Inter_500Medium", fontSize: 11 },
});
