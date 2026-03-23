import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

type Settings = {
  whatsapp_number?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  store_name?: string;
  store_tagline?: string;
};

function openUrl(url: string, fallbackMsg?: string) {
  Linking.openURL(url).catch(() => {
    if (fallbackMsg) Alert.alert("Error", fallbackMsg);
  });
}

export default function MoreScreen() {
  const { isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.settings.getPublic()
      .then(({ settings: s }) => setSettings(s as Settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const whatsapp = settings.whatsapp_number || "923001234567";

  const handleWhatsApp = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const msg = encodeURIComponent("Hi Almera, I need help with my order.");
    openUrl(`https://wa.me/${whatsapp}?text=${msg}`, "WhatsApp not available. Try support@almera.pk");
  };

  const handleSocial = (url: string, name: string) => {
    if (!url) {
      Alert.alert("Coming Soon", `Follow us on ${name} soon!`);
      return;
    }
    if (Platform.OS !== "web") Haptics.selectionAsync();
    openUrl(url, `Could not open ${name}`);
  };

  const handleLegal = (slug: "terms" | "privacy" | "refund", title: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push({ pathname: "/legal/[slug]", params: { slug, title } } as any);
  };

  const SOCIAL = [
    { name: "Instagram", icon: "instagram", color: "#E1306C", key: "instagram_url" },
    { name: "Twitter / X", icon: "twitter", color: "#1DA1F2", key: "twitter_url" },
    { name: "TikTok", icon: "video", color: "#000", key: "tiktok_url" },
  ] as const;

  const LEGAL = [
    { slug: "terms" as const, title: "Terms of Service", icon: "file-text" },
    { slug: "privacy" as const, title: "Privacy Policy", icon: "shield" },
    { slug: "refund" as const, title: "Refund & Return Policy", icon: "refresh-ccw" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>More</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

          <Pressable
            style={[styles.whatsappCard, { backgroundColor: "#25D366" + "12", borderColor: "#25D366" + "40" }]}
            onPress={handleWhatsApp}
          >
            <View style={[styles.whatsappIcon, { backgroundColor: "#25D366" }]}>
              <Feather name="message-circle" size={22} color="#fff" />
            </View>
            <View style={styles.whatsappText}>
              <Text style={[styles.whatsappTitle, { color: theme.text }]}>WhatsApp Support</Text>
              <Text style={[styles.whatsappSub, { color: theme.textSecondary }]}>Chat with us for order help</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#25D366" />
          </Pressable>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FOLLOW US</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {SOCIAL.map((s, idx) => {
                const url = settings[s.key] || "";
                return (
                  <Pressable
                    key={s.name}
                    style={[styles.row, idx < SOCIAL.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                    onPress={() => handleSocial(url, s.name)}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: s.color + "18" }]}>
                      <Feather name={s.icon as any} size={16} color={s.color} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={[styles.rowLabel, { color: theme.text }]}>{s.name}</Text>
                      {url ? (
                        <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text>
                      ) : (
                        <Text style={[styles.rowSub, { color: theme.textSecondary }]}>Not set yet</Text>
                      )}
                    </View>
                    <Feather name="external-link" size={14} color={theme.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>LEGAL</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {LEGAL.map((l, idx) => (
                <Pressable
                  key={l.slug}
                  style={[styles.row, idx < LEGAL.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                  onPress={() => handleLegal(l.slug, l.title)}
                >
                  <View style={[styles.rowIcon, { backgroundColor: Colors.gold + "18" }]}>
                    <Feather name={l.icon as any} size={16} color={Colors.gold} />
                  </View>
                  <Text style={[styles.rowLabel, { color: theme.text, flex: 1 }]}>{l.title}</Text>
                  <Feather name="chevron-right" size={15} color={theme.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ABOUT</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Pressable
                style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); router.push("/about" as any); }}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.gold + "18" }]}>
                  <Feather name="info" size={16} color={Colors.gold} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>About Almera</Text>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]}>Our story & values</Text>
                </View>
                <Feather name="chevron-right" size={15} color={theme.textSecondary} />
              </Pressable>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.gold + "18" }]}>
                  <Feather name="mail" size={16} color={Colors.gold} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>Email Support</Text>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]}>support@almera.pk</Text>
                </View>
                <Pressable onPress={() => openUrl("mailto:support@almera.pk")}>
                  <Feather name="external-link" size={14} color={theme.textSecondary} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.brandFooter}>
            <Text style={[styles.brandName, { color: Colors.gold }]}>ALMERA</Text>
            <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
              {settings.store_tagline || "Premium Fashion for Pakistan"}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: 0.3 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  whatsappCard: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, borderWidth: 1,
    padding: 16, flexDirection: "row", alignItems: "center", gap: 12,
  },
  whatsappIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  whatsappText: { flex: 1 },
  whatsappTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  whatsappSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1.5, marginBottom: 8,
  },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 1 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  brandFooter: { alignItems: "center", paddingVertical: 32, gap: 5 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 6 },
  brandTagline: { fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 0.5 },
});
