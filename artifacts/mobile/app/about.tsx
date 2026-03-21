import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

const DEFAULT_ABOUT = `# About Almera

Welcome to **Almera** — a premium fashion brand crafted for Pakistan.

We believe every person deserves to feel confident, elegant, and comfortable in what they wear. That's why we source only the finest fabrics and work with skilled artisans to bring you clothing that is as beautiful as it is durable.

## Our Story

Almera was founded with a simple mission: make high-quality fashion accessible to everyone in Pakistan. From casual everyday wear to special occasion outfits, we have something for every moment.

## Our Values

- **Quality First** — Every piece is carefully selected and quality-checked before it reaches you.
- **Customer Love** — Your satisfaction is our top priority. We're always here to help.
- **Authenticity** — What you see is what you get. No filters, no misleading photos.
- **Sustainability** — We care about the environment and work to reduce our footprint.

## Contact Us

For support or queries, reach us at:
**support@almera.pk**

We typically respond within 24 hours.`;

function renderMarkdown(text: string, theme: any) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(<Text key={key++} style={[mdStyles.h2, { color: theme.text }]}>{line.slice(3)}</Text>);
    } else if (line.startsWith("# ")) {
      elements.push(<Text key={key++} style={[mdStyles.h1, { color: theme.text }]}>{line.slice(2)}</Text>);
    } else if (line.startsWith("- ")) {
      const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1");
      elements.push(
        <View key={key++} style={mdStyles.bulletRow}>
          <View style={[mdStyles.dot, { backgroundColor: Colors.gold }]} />
          <Text style={[mdStyles.bulletText, { color: theme.textSecondary }]}>{content}</Text>
        </View>
      );
    } else if (line.trim() === "") {
      elements.push(<View key={key++} style={{ height: 8 }} />);
    } else {
      const parts: React.ReactNode[] = [];
      const regex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      let pKey = 0;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<Text key={pKey++} style={{ color: theme.textSecondary }}>{line.slice(lastIndex, match.index)}</Text>);
        }
        parts.push(<Text key={pKey++} style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>{match[1]}</Text>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(<Text key={pKey++} style={{ color: theme.textSecondary }}>{line.slice(lastIndex)}</Text>);
      }
      elements.push(
        <Text key={key++} style={[mdStyles.body, { color: theme.textSecondary }]}>{parts}</Text>
      );
    }
  }
  return elements;
}

export default function AboutScreen() {
  const { isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.settings.getPublic()
      .then(({ settings }) => {
        setContent((settings as any).about_content || DEFAULT_ABOUT);
      })
      .catch(() => setContent(DEFAULT_ABOUT))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About Almera</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.badge, { backgroundColor: Colors.gold + "18" }]}>
        <Feather name="star" size={14} color={Colors.gold} />
        <Text style={[styles.badgeText, { color: Colors.gold }]}>Version 1.0.0 — Premium Fashion</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        >
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderMarkdown(content, theme)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const mdStyles = StyleSheet.create({
  h1: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 4, marginTop: 4 },
  h2: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 16, marginBottom: 4 },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 20, marginTop: 14, marginBottom: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignSelf: "flex-start" },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 4 },
});
