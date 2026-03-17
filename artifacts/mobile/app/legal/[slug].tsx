import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

const SLUG_TO_KEY: Record<string, string> = {
  terms: "terms_content",
  privacy: "privacy_content",
  refund: "refund_content",
};

function renderMarkdown(text: string, theme: any) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("# ")) {
      return <Text key={i} style={[styles.h1, { color: theme.text }]}>{line.slice(2)}</Text>;
    }
    if (line.startsWith("## ")) {
      return <Text key={i} style={[styles.h2, { color: theme.text }]}>{line.slice(3)}</Text>;
    }
    if (line.startsWith("- ")) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: Colors.gold }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{line.slice(2)}</Text>
        </View>
      );
    }
    if (/^\d+\./.test(line)) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: Colors.gold }]}>{line.match(/^\d+/)?.[0]}.</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{line.replace(/^\d+\.\s*/, "")}</Text>
        </View>
      );
    }
    if (line.trim() === "") {
      return <View key={i} style={{ height: 10 }} />;
    }
    return <Text key={i} style={[styles.body, { color: theme.textSecondary }]}>{line}</Text>;
  });
}

export default function LegalScreen() {
  const { slug, title } = useLocalSearchParams<{ slug: string; title: string }>();
  const { isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = SLUG_TO_KEY[slug || "terms"];
    api.settings.getPublic()
      .then(({ settings }) => {
        setContent((settings as any)[key] || "No content available yet.");
      })
      .catch(() => setContent("Could not load page."))
      .finally(() => setLoading(false));
  }, [slug]);

  const pageTitle = title || (slug === "terms" ? "Terms of Service" : slug === "privacy" ? "Privacy Policy" : "Refund Policy");

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{pageTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
          {renderMarkdown(content, theme)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 8, marginTop: 4 },
  h2: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 18, marginBottom: 6, color: Colors.gold },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", gap: 8, marginVertical: 3 },
  bullet: { fontFamily: "Inter_700Bold", fontSize: 14, width: 16 },
  bulletText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, flex: 1 },
});
