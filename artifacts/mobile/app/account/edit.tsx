import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

type Tab = "profile" | "password";

export default function EditAccountScreen() {
  const { isDarkMode } = useApp();
  const { user, updateProfile, changePassword, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("profile");

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUpdateProfile = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setLocalError("Name must be at least 2 characters");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProfileLoading(true);
    setLocalError(null);
    setProfileSuccess(false);
    clearError();
    try {
      await updateProfile(name.trim(), phone.trim() || undefined);
      setProfileSuccess(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {}
    setProfileLoading(false);
  };

  const handleChangePassword = async () => {
    setLocalError(null);
    if (!currentPw || !newPw || !confirmPw) {
      setLocalError("All password fields are required");
      return;
    }
    if (newPw.length < 6) {
      setLocalError("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setLocalError("New passwords do not match");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPwLoading(true);
    setPwSuccess(false);
    clearError();
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {}
    setPwLoading(false);
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, {
        paddingTop: insets.top + 8,
        backgroundColor: theme.card,
        borderBottomColor: theme.border,
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Account Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {([
          { id: "profile" as Tab, label: "Profile", icon: "user" },
          { id: "password" as Tab, label: "Password", icon: "lock" },
        ]).map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tabBtn, tab === t.id && { borderBottomColor: Colors.gold, borderBottomWidth: 2 }]}
            onPress={() => { setTab(t.id); setLocalError(null); clearError(); }}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.id ? Colors.gold : theme.textSecondary} />
            <Text style={[styles.tabLabel, { color: tab === t.id ? Colors.gold : theme.textSecondary,
              fontFamily: tab === t.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        {displayError && (
          <View style={[styles.errorBanner, { borderColor: Colors.errorRed + "40" }]}>
            <Feather name="alert-circle" size={14} color={Colors.errorRed} />
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {tab === "profile" && (
          <>
            <View style={[styles.emailCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <View style={[styles.emailIcon, { backgroundColor: Colors.gold + "18" }]}>
                <Feather name="mail" size={16} color={Colors.gold} />
              </View>
              <View>
                <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>Email address</Text>
                <Text style={[styles.emailValue, { color: theme.text }]}>{user?.email}</Text>
              </View>
              <View style={[styles.lockBadge, { backgroundColor: theme.border }]}>
                <Feather name="lock" size={10} color={theme.textSecondary} />
              </View>
            </View>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputRow, {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                }]}>
                  <Feather name="user" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
                <View style={[styles.inputRow, {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                }]}>
                  <Feather name="phone" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="03XX-XXXXXXX"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
              </View>
            </View>

            {profileSuccess && (
              <View style={[styles.successBanner, { borderColor: Colors.successGreen + "40" }]}>
                <Feather name="check-circle" size={14} color={Colors.successGreen} />
                <Text style={[styles.successText, { color: Colors.successGreen }]}>Profile updated successfully</Text>
              </View>
            )}

            <Pressable
              style={[styles.saveBtn, { opacity: profileLoading ? 0.7 : 1 }]}
              onPress={handleUpdateProfile}
              disabled={profileLoading}
            >
              {profileLoading
                ? <ActivityIndicator color={Colors.charcoal} />
                : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>

            <View style={[styles.memberCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="calendar" size={14} color={theme.textSecondary} />
              <Text style={[styles.memberText, { color: theme.textSecondary }]}>
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" }) : "—"}
              </Text>
            </View>
          </>
        )}

        {tab === "password" && (
          <>
            <View style={[styles.pwInfo, { backgroundColor: Colors.gold + "10", borderColor: Colors.gold + "25" }]}>
              <Feather name="shield" size={14} color={Colors.gold} />
              <Text style={[styles.pwInfoText, { color: theme.textSecondary }]}>
                Choose a strong password with at least 6 characters.
              </Text>
            </View>

            {([
              { label: "Current Password", value: currentPw, onChange: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { label: "New Password", value: newPw, onChange: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
              { label: "Confirm New Password", value: confirmPw, onChange: setConfirmPw, show: showNew, toggle: () => {} },
            ]).map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Feather name="lock" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!f.show}
                    style={[styles.input, { color: theme.text }]}
                  />
                  {f.toggle !== (() => {}) && (
                    <Pressable onPress={f.toggle}>
                      <Feather name={f.show ? "eye-off" : "eye"} size={16} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}

            {pwSuccess && (
              <View style={[styles.successBanner, { borderColor: Colors.successGreen + "40" }]}>
                <Feather name="check-circle" size={14} color={Colors.successGreen} />
                <Text style={[styles.successText, { color: Colors.successGreen }]}>Password changed successfully</Text>
              </View>
            )}

            <Pressable
              style={[styles.saveBtn, { opacity: pwLoading ? 0.7 : 1 }]}
              onPress={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading
                ? <ActivityIndicator color={Colors.charcoal} />
                : <Text style={styles.saveBtnText}>Change Password</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  tabLabel: { fontSize: 14 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#D93025" + "10", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.errorRed, flex: 1 },
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1E9E55" + "10", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1,
  },
  successText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  emailCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  emailIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emailLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
  emailValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  lockBadge: { marginLeft: "auto", width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fields: { gap: 14, marginBottom: 20 },
  field: { gap: 6, marginBottom: 14 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  saveBtn: {
    backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 14,
    alignItems: "center", marginBottom: 16,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal },
  memberCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  memberText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  pwInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 20,
  },
  pwInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
});
