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

export default function RegisterScreen() {
  const { register, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    clearError();
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, phone.trim() || undefined);
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

        <Text style={[styles.heading, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>Join Almera Premium</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={Colors.errorRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {[
            { label: "Full Name", value: name, onChange: setName, placeholder: "Muhammad Ali", icon: "user", type: "default" },
            { label: "Email", value: email, onChange: setEmail, placeholder: "you@email.com", icon: "mail", type: "email-address" },
            { label: "Phone (optional)", value: phone, onChange: setPhone, placeholder: "03XX-XXXXXXX", icon: "phone", type: "phone-pad" },
          ].map((f) => (
            <View key={f.label} style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{f.label}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <Feather name={f.icon as any} size={16} color={theme.textSecondary} />
                <TextInput
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={f.type as any}
                  autoCapitalize={f.type === "email-address" ? "none" : "words"}
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>
          ))}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="lock" size={16} color={theme.textSecondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
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
            style={[styles.registerBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.charcoal} /> : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
          <Pressable onPress={() => router.replace("/auth/login")}>
            <Text style={[styles.loginLink, { color: Colors.gold }]}>Sign In</Text>
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
  logo: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.gold, letterSpacing: 8 },
  logoLine: { width: 40, height: 2, backgroundColor: Colors.gold, marginTop: 6 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 6 },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 24 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.errorRed + "15", borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.errorRed + "40",
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.errorRed, flex: 1 },
  form: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  registerBtn: {
    backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8,
  },
  registerBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  loginText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  loginLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
