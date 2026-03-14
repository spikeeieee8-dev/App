import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginScreen() {
  const { isDarkMode } = useApp();
  const { login, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/admin" as any);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={[styles.closeBtn, { top: insets.top + 16 }]} onPress={() => router.back()}>
        <Feather name="x" size={20} color={theme.text} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.gold + "18" }]}>
            <Feather name="shield" size={32} color={Colors.gold} />
          </View>
          <Text style={[styles.badge, { color: Colors.gold }]}>ADMIN ACCESS</Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>Admin Sign In</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          Restricted to authorized personnel only
        </Text>

        {error && (
          <View style={[styles.errorBanner, { borderColor: Colors.errorRed + "40" }]}>
            <Feather name="alert-circle" size={14} color={Colors.errorRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Admin Email</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Feather name="mail" size={16} color={theme.textSecondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@almera.pk"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Feather name="lock" size={16} color={theme.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your admin password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPw}
                style={[styles.input, { color: theme.text }]}
              />
              <Pressable onPress={() => setShowPw(!showPw)}>
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.loginBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.charcoal} />
            ) : (
              <>
                <Feather name="shield" size={16} color={Colors.charcoal} />
                <Text style={styles.loginBtnText}>Access Admin Panel</Text>
              </>
            )}
          </Pressable>

          <View style={[styles.demoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Feather name="info" size={13} color={theme.textSecondary} />
            <Text style={[styles.demoText, { color: theme.textSecondary }]}>
              Demo credentials: admin@almera.pk / admin123
            </Text>
          </View>
        </View>

        <View style={styles.securityNote}>
          <Feather name="lock" size={12} color={theme.textSecondary} />
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            All admin actions are logged and monitored
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", right: 16, zIndex: 10, padding: 8 },
  content: { paddingHorizontal: 28 },
  iconWrap: { alignItems: "center", marginBottom: 24, gap: 10 },
  iconCircle: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  badge: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 2.5 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 6 },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 28, lineHeight: 20 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#D93025" + "10", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.errorRed, flex: 1 },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  loginBtn: {
    backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 14,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 6,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal },
  demoCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  demoText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 32 },
  securityText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
