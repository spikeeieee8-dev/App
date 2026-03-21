import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
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

type ConfirmModal = {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
} | null;

const BLANK_FORM = { name: "", email: "", password: "", phone: "", role: "user" as "user" | "admin" };

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
  const [actionId, setActionId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

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

  const handleDelete = (user: User) => {
    setConfirmModal({
      title: "Delete Account",
      message: `Permanently delete ${user.name}'s account? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: Colors.errorRed,
      onConfirm: async () => {
        setConfirmLoading(true);
        setActionId(user.id);
        try {
          await api.analytics.deleteUser(user.id);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setConfirmModal(null);
          showToast(`${user.name} deleted`);
        } catch (e: any) {
          showToast(e.message || "Failed to delete user", false);
        } finally {
          setConfirmLoading(false);
          setActionId(null);
        }
      },
    });
  };

  const handleRoleChange = (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "Promote to Admin" : "Demote to Customer";
    setConfirmModal({
      title: action,
      message: `${action} for ${user.name}?`,
      confirmLabel: action,
      confirmColor: newRole === "admin" ? Colors.gold : "#3498DB",
      onConfirm: async () => {
        setConfirmLoading(true);
        setActionId(user.id);
        try {
          const res = await api.analytics.changeRole(user.id, newRole);
          setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: res.user.role } : u));
          setConfirmModal(null);
          showToast(`${user.name} ${newRole === "admin" ? "promoted to Admin" : "demoted to Customer"}`);
        } catch (e: any) {
          showToast(e.message || "Failed to change role", false);
        } finally {
          setConfirmLoading(false);
          setActionId(null);
        }
      },
    });
  };

  const handleAddUser = async () => {
    setAddError("");
    if (!addForm.name.trim()) { setAddError("Name is required"); return; }
    if (!addForm.email.trim()) { setAddError("Email is required"); return; }
    if (!addForm.password || addForm.password.length < 6) { setAddError("Password must be at least 6 characters"); return; }
    setAddLoading(true);
    try {
      const res = await api.analytics.createUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        phone: addForm.phone.trim() || undefined,
        role: addForm.role,
      });
      setUsers((prev) => [res.user, ...prev]);
      setShowAddModal(false);
      setAddForm(BLANK_FORM);
      showToast(`${res.user.name} added successfully`);
    } catch (e: any) {
      setAddError(e.message || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
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
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Accounts</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{users.length} total</Text>
        </View>
        <Pressable style={[styles.addBtn, { backgroundColor: Colors.gold }]} onPress={() => { setAddForm(BLANK_FORM); setAddError(""); setShowAddModal(true); }}>
          <Feather name="user-plus" size={16} color={Colors.charcoal} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <View style={[styles.statsBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {[
          { label: "All", value: users.length, id: "all" as const, color: Colors.gold },
          { label: "Customers", value: userCount, id: "user" as const, color: "#3498DB" },
          { label: "Admins", value: adminCount, id: "admin" as const, color: Colors.errorRed },
        ].map((s) => (
          <Pressable
            key={s.id}
            style={[styles.statChip, { backgroundColor: filter === s.id ? s.color + "18" : "transparent", borderColor: filter === s.id ? s.color + "50" : "transparent", borderWidth: 1 }]}
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
            value={search} onChangeText={setSearch}
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
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>Loading accounts...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerState}>
          <Feather name="users" size={44} color={theme.textSecondary} />
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>
            {search ? "No users match your search" : "No users found"}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }}
        >
          {filtered.map((user) => {
            const isAdmin = user.role === "admin";
            const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const joinDate = new Date(user.createdAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
            const isBusy = actionId === user.id;

            return (
              <View
                key={user.id}
                style={[styles.userCard, { backgroundColor: theme.card, borderColor: isAdmin ? Colors.gold + "30" : theme.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.userAvatar, { backgroundColor: isAdmin ? Colors.gold + "20" : theme.backgroundSecondary }]}>
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
                          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{user.phone}</Text>
                          <Text style={[styles.dot, { color: theme.border }]}>·</Text>
                        </>
                      )}
                      <Feather name="calendar" size={10} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>Joined {joinDate}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: isAdmin ? "#3498DB18" : Colors.gold + "18", opacity: isBusy ? 0.4 : 1 }]}
                    onPress={() => { if (!isBusy) handleRoleChange(user); }}
                    disabled={isBusy}
                  >
                    <Feather name={isAdmin ? "user" : "shield"} size={13} color={isAdmin ? "#3498DB" : Colors.gold} />
                    <Text style={[styles.actionBtnText, { color: isAdmin ? "#3498DB" : Colors.gold }]}>
                      {isAdmin ? "Demote" : "Promote"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: Colors.errorRed + "12", opacity: isBusy ? 0.4 : 1 }]}
                    onPress={() => { if (!isBusy) handleDelete(user); }}
                    disabled={isBusy}
                  >
                    {isBusy ? <ActivityIndicator size="small" color={Colors.errorRed} /> : <Feather name="trash-2" size={13} color={Colors.errorRed} />}
                    <Text style={[styles.actionBtnText, { color: Colors.errorRed }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.ok ? "#27AE60" : Colors.errorRed }]}>
          <Feather name={toast.ok ? "check-circle" : "alert-circle"} size={15} color="#fff" />
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <Modal visible={!!confirmModal} transparent animationType="fade" onRequestClose={() => !confirmLoading && setConfirmModal(null)}>
        <Pressable style={styles.overlay} onPress={() => !confirmLoading && setConfirmModal(null)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.card }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{confirmModal?.title}</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>{confirmModal?.message}</Text>
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setConfirmModal(null)} disabled={confirmLoading}>
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: confirmModal?.confirmColor || Colors.gold, opacity: confirmLoading ? 0.7 : 1 }]}
                onPress={confirmModal?.onConfirm}
                disabled={confirmLoading}
              >
                {confirmLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>{confirmModal?.confirmLabel}</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => !addLoading && setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => !addLoading && setShowAddModal(false)}>
            <Pressable style={[styles.addModalBox, { backgroundColor: theme.card }]} onPress={() => {}}>
              <View style={styles.addModalHeader}>
                <Feather name="user-plus" size={20} color={Colors.gold} />
                <Text style={[styles.addModalTitle, { color: theme.text }]}>Add New User</Text>
                <Pressable onPress={() => setShowAddModal(false)} disabled={addLoading}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <AddField label="Full Name *" value={addForm.name} onChange={(v) => setAddForm((f) => ({ ...f, name: v }))} placeholder="e.g. Sara Ahmed" theme={theme} />
              <AddField label="Email *" value={addForm.email} onChange={(v) => setAddForm((f) => ({ ...f, email: v }))} placeholder="sara@example.com" keyboard="email-address" theme={theme} />
              <AddField label="Password *" value={addForm.password} onChange={(v) => setAddForm((f) => ({ ...f, password: v }))} placeholder="Min 6 characters" secure theme={theme} />
              <AddField label="Phone (optional)" value={addForm.phone} onChange={(v) => setAddForm((f) => ({ ...f, phone: v }))} placeholder="e.g. 0300-1234567" keyboard="phone-pad" theme={theme} />

              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Role</Text>
                <View style={[styles.roleRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  {(["user", "admin"] as const).map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.roleChip, addForm.role === r && { backgroundColor: Colors.gold }]}
                      onPress={() => setAddForm((f) => ({ ...f, role: r }))}
                    >
                      <Text style={[styles.roleChipText, { color: addForm.role === r ? Colors.charcoal : theme.textSecondary }]}>
                        {r === "user" ? "Customer" : "Admin"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {!!addError && (
                <View style={[styles.errorBox, { backgroundColor: Colors.errorRed + "15", borderColor: Colors.errorRed + "40" }]}>
                  <Feather name="alert-circle" size={14} color={Colors.errorRed} />
                  <Text style={[styles.errorText, { color: Colors.errorRed }]}>{addError}</Text>
                </View>
              )}

              <Pressable style={[styles.addSubmitBtn, { opacity: addLoading ? 0.7 : 1 }]} onPress={handleAddUser} disabled={addLoading}>
                {addLoading ? <ActivityIndicator color={Colors.charcoal} /> : (
                  <>
                    <Feather name="user-check" size={16} color={Colors.charcoal} />
                    <Text style={styles.addSubmitText}>Create Account</Text>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function AddField({ label, value, onChange, placeholder, keyboard, secure, theme }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboard?: any; secure?: boolean; theme: any;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={theme.textSecondary} keyboardType={keyboard || "default"}
        secureTextEntry={secure} autoCapitalize="none" autoCorrect={false}
        style={[styles.addInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
      />
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
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.charcoal },
  statsBar: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderBottomWidth: 1 },
  statChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, gap: 2 },
  statChipValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statChipLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  searchBar: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  centerText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  userCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 10 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  userAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  userInitials: { fontFamily: "Inter_700Bold", fontSize: 16 },
  userInfo: { flex: 1, gap: 3 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 12 },
  userMeta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 10 },
  dot: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 8 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  toast: { position: "absolute", bottom: 30, left: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  toastText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff", flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 380, borderRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  modalMessage: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  modalCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  addModalBox: { width: "100%", maxWidth: 420, borderRadius: 20, padding: 22, gap: 14 },
  addModalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  addModalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, flex: 1 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.3 },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  roleRow: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 4, gap: 4 },
  roleChip: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  roleChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  addSubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.gold, paddingVertical: 14, borderRadius: 12 },
  addSubmitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.charcoal },
});
