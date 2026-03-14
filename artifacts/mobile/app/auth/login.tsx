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
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login, error, clearError, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
      router.replace("/(tabs)");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Pressable style={[styles.closeBtn, { top: insets.top + 16 }]} onPress={() => router.back()}>
        <Feather name="x" size={20} color={theme.text} />
      </Pressable>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Text style={styles.logo}>ALMERA</Text>
          <View style={styles.logoLine} />
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>Sign In</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>Welcome back to Almera</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={Colors.errorRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="mail" size={16} color={theme.textSecondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text }]}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="lock" size={16} color={theme.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
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
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.demoRow}>
            <Text style={[styles.demoText, { color: theme.textSecondary }]}>
              Demo: admin@almera.pk / admin123
            </Text>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <Pressable onPress={() => router.replace("/auth/register")}>
            <Text style={[styles.signupLink, { color: Colors.gold }]}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", right: 16, zIndex: 10, padding: 8 },
  content: { paddingHorizontal: 28 },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logo: {
    fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.gold, letterSpacing: 8,
  },
  logoLine: { width: 40, height: 2, backgroundColor: Colors.gold, marginTop: 6 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 6 },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 24 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.errorRed + "15", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.errorRed + "40",
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.errorRed, flex: 1 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  loginBtn: {
    backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 14,
    alignItems: "center", marginTop: 8,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal },
  demoRow: { alignItems: "center" },
  demoText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  signupText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  signupLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
