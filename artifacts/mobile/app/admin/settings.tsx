import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

type Settings = {
  easypaisa_number: string;
  easypaisa_name: string;
  easypaisa_qr_url: string;
  whatsapp_number: string;
  instagram_url: string;
  twitter_url: string;
  tiktok_url: string;
  terms_content: string;
  privacy_content: string;
  refund_content: string;
  store_name: string;
  store_tagline: string;
};

const BLANK: Settings = {
  easypaisa_number: "", easypaisa_name: "", easypaisa_qr_url: "",
  whatsapp_number: "", instagram_url: "", twitter_url: "", tiktok_url: "",
  terms_content: "", privacy_content: "", refund_content: "",
  store_name: "", store_tagline: "",
};

type LegalTab = "terms" | "privacy" | "refund";

export default function AdminSettingsScreen() {
  const { isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 16 : 8);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Settings>(BLANK);
  const [orig, setOrig] = useState<Settings>(BLANK);

  const [dbUrl, setDbUrl] = useState("");
  const [currentMaskedUrl, setCurrentMaskedUrl] = useState("");
  const [hasCustomDb, setHasCustomDb] = useState(false);
  const [savingDb, setSavingDb] = useState(false);
  const [showDbField, setShowDbField] = useState(false);

  const [legalTab, setLegalTab] = useState<LegalTab>("terms");

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [{ settings }, dbInfo] = await Promise.all([
        api.settings.getAll(),
        api.settings.getDatabaseUrl().catch(() => ({ hasCustomUrl: false, maskedUrl: "" })),
      ]);
      const s = settings as Partial<Settings>;
      const loaded: Settings = {
        easypaisa_number: s.easypaisa_number || "",
        easypaisa_name: s.easypaisa_name || "",
        easypaisa_qr_url: s.easypaisa_qr_url || "",
        whatsapp_number: s.whatsapp_number || "",
        instagram_url: s.instagram_url || "",
        twitter_url: s.twitter_url || "",
        tiktok_url: s.tiktok_url || "",
        terms_content: s.terms_content || "",
        privacy_content: s.privacy_content || "",
        refund_content: s.refund_content || "",
        store_name: s.store_name || "",
        store_tagline: s.store_tagline || "",
      };
      setForm(loaded);
      setOrig(loaded);
      setHasCustomDb(dbInfo.hasCustomUrl);
      setCurrentMaskedUrl(dbInfo.maskedUrl);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof Settings, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const saveSection = async (keys: (keyof Settings)[], sectionName: string) => {
    setSaving(sectionName);
    try {
      for (const key of keys) {
        if (form[key] !== orig[key]) {
          await api.settings.update(key, form[key]);
        }
      }
      setOrig((o) => {
        const updated = { ...o };
        keys.forEach((k) => { updated[k] = form[k]; });
        return updated;
      });
      Alert.alert("Saved", `${sectionName} settings updated.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const hasChanges = (keys: (keyof Settings)[]) => keys.some((k) => form[k] !== orig[k]);

  const handlePickQrImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Please allow access to your media library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);
      try {
        const { url } = await api.upload.uploadFile(asset.uri, asset.fileName || `qr_${Date.now()}.jpg`, asset.mimeType || "image/jpeg", "settings");
        set("easypaisa_qr_url", url);
        await api.settings.update("easypaisa_qr_url", url);
        setOrig((o) => ({ ...o, easypaisa_qr_url: url }));
        Alert.alert("Uploaded", "QR code updated.");
      } catch (e: any) {
        Alert.alert("Upload failed", e.message || "Could not upload QR code.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSaveDbUrl = async () => {
    if (!dbUrl.trim().startsWith("postgres")) { Alert.alert("Error", "URL must start with postgresql:// or postgres://"); return; }
    setSavingDb(true);
    try {
      await api.settings.setDatabaseUrl(dbUrl.trim());
      Alert.alert("Database Saved", "Reconnecting to your new database...", [{ text: "OK", onPress: () => { setDbUrl(""); setShowDbField(false); loadSettings(); } }]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save database URL");
    } finally {
      setSavingDb(false);
    }
  };

  const handleRemoveCustomDb = () => {
    Alert.alert("Remove Custom Database", "Revert to default Replit database?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        setSavingDb(true);
        try {
          await api.settings.removeDatabaseUrl();
          Alert.alert("Done", "Reverted to default database.", [{ text: "OK", onPress: () => { setShowDbField(false); loadSettings(); } }]);
        } catch (e: any) { Alert.alert("Error", e.message || "Failed");
        } finally { setSavingDb(false); }
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: topInset, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={22} color={theme.text} /></Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingBox}><ActivityIndicator size="large" color={Colors.gold} /></View>
      </View>
    );
  }

  const LEGAL_TABS: { key: LegalTab; label: string; settingKey: keyof Settings }[] = [
    { key: "terms", label: "Terms", settingKey: "terms_content" },
    { key: "privacy", label: "Privacy", settingKey: "privacy_content" },
    { key: "refund", label: "Refund", settingKey: "refund_content" },
  ];
  const activeLegal = LEGAL_TABS.find((t) => t.key === legalTab)!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={22} color={theme.text} /></Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}>

        {/* Easypaisa */}
        <SectionCard icon="smartphone" iconColor="#6DC067" title="Easypaisa Payment" theme={theme}>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Details shown to customers when paying via Easypaisa.</Text>
          <Field label="Account Name" value={form.easypaisa_name} onChange={(v) => set("easypaisa_name", v)} placeholder="Almera Official" theme={theme} />
          <Field label="Phone Number" value={form.easypaisa_number} onChange={(v) => set("easypaisa_number", v)} placeholder="0300-1234567" keyboard="phone-pad" theme={theme} />
          {hasChanges(["easypaisa_number", "easypaisa_name"]) && (
            <SaveBtn label="Save Easypaisa" loading={saving === "Easypaisa"} onPress={() => saveSection(["easypaisa_number", "easypaisa_name"], "Easypaisa")} />
          )}
        </SectionCard>

        {/* QR Code */}
        <SectionCard icon="image" iconColor={Colors.gold} title="Easypaisa QR Code" theme={theme}>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Upload your Easypaisa QR code so customers can scan and pay.</Text>
          {form.easypaisa_qr_url ? (
            <View style={styles.qrPreviewBox}>
              <Image source={{ uri: form.easypaisa_qr_url }} style={styles.qrPreview} resizeMode="contain" />
              <View style={styles.qrActions}>
                <Pressable style={[styles.qrBtn, { backgroundColor: Colors.gold + "15", borderColor: Colors.gold }]} onPress={handlePickQrImage} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color={Colors.gold} /> : <Feather name="refresh-cw" size={14} color={Colors.gold} />}
                  <Text style={[styles.qrBtnText, { color: Colors.gold }]}>Replace</Text>
                </Pressable>
                <Pressable style={[styles.qrBtn, { backgroundColor: Colors.errorRed + "15", borderColor: Colors.errorRed }]} onPress={() => set("easypaisa_qr_url", "")}>
                  <Feather name="trash-2" size={14} color={Colors.errorRed} />
                  <Text style={[styles.qrBtnText, { color: Colors.errorRed }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={[styles.uploadQrBtn, { borderColor: Colors.gold, backgroundColor: Colors.gold + "08" }]} onPress={handlePickQrImage} disabled={uploading}>
              {uploading ? <ActivityIndicator color={Colors.gold} /> : (
                <>
                  <Feather name="upload" size={28} color={Colors.gold} />
                  <Text style={[styles.uploadQrText, { color: Colors.gold }]}>Upload QR Code</Text>
                  <Text style={[styles.uploadQrSub, { color: theme.textSecondary }]}>Tap to pick from your gallery</Text>
                </>
              )}
            </Pressable>
          )}
        </SectionCard>

        {/* Social & Contact */}
        <SectionCard icon="share-2" iconColor="#3498DB" title="Social & Contact" theme={theme}>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Links shown in the More tab. Leave blank to hide.</Text>
          <Field label="WhatsApp Number" value={form.whatsapp_number} onChange={(v) => set("whatsapp_number", v)} placeholder="923001234567 (no +)" keyboard="phone-pad" theme={theme} />
          <Field label="Instagram URL" value={form.instagram_url} onChange={(v) => set("instagram_url", v)} placeholder="https://instagram.com/almera.pk" theme={theme} />
          <Field label="Twitter / X URL" value={form.twitter_url} onChange={(v) => set("twitter_url", v)} placeholder="https://twitter.com/almera" theme={theme} />
          <Field label="TikTok URL" value={form.tiktok_url} onChange={(v) => set("tiktok_url", v)} placeholder="https://tiktok.com/@almera" theme={theme} />
          {hasChanges(["whatsapp_number", "instagram_url", "twitter_url", "tiktok_url"]) && (
            <SaveBtn label="Save Social Links" loading={saving === "Social"} onPress={() => saveSection(["whatsapp_number", "instagram_url", "twitter_url", "tiktok_url"], "Social")} />
          )}
        </SectionCard>

        {/* Legal Pages */}
        <SectionCard icon="file-text" iconColor="#9B59B6" title="Legal Pages" theme={theme}>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Edit the content of Terms, Privacy Policy, and Refund Policy pages. Use Markdown formatting (# for heading, ## for subheading, - for bullet).</Text>
          <View style={[styles.legalTabs, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            {LEGAL_TABS.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.legalTab, legalTab === t.key && { backgroundColor: theme.card }]}
                onPress={() => setLegalTab(t.key)}
              >
                <Text style={[styles.legalTabText, { color: legalTab === t.key ? Colors.gold : theme.textSecondary, fontFamily: legalTab === t.key ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={form[activeLegal.settingKey]}
            onChangeText={(v) => set(activeLegal.settingKey, v)}
            multiline
            numberOfLines={12}
            placeholder={`Enter ${legalTab === "terms" ? "Terms of Service" : legalTab === "privacy" ? "Privacy Policy" : "Refund Policy"} content...`}
            placeholderTextColor={theme.textSecondary}
            style={[styles.legalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            textAlignVertical="top"
          />
          {hasChanges([activeLegal.settingKey]) && (
            <SaveBtn label={`Save ${legalTab === "terms" ? "Terms" : legalTab === "privacy" ? "Privacy Policy" : "Refund Policy"}`} loading={saving === "Legal"} onPress={() => saveSection([activeLegal.settingKey], "Legal")} />
          )}
        </SectionCard>

        {/* Database */}
        <SectionCard icon="database" iconColor="#3498DB" title="Database Connection" theme={theme}>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Connect to your own PostgreSQL database. Useful when deploying to your own server.</Text>
          {hasCustomDb && !showDbField ? (
            <View style={styles.dbConnected}>
              <View style={[styles.dbStatusRow, { backgroundColor: "#27AE6015", borderColor: "#27AE6040" }]}>
                <View style={[styles.dbDot, { backgroundColor: Colors.successGreen }]} />
                <Text style={[styles.dbMasked, { color: theme.text }]} numberOfLines={1}>{currentMaskedUrl}</Text>
              </View>
              <View style={styles.dbBtns}>
                <Pressable style={[styles.dbBtn, { backgroundColor: Colors.gold + "15", borderColor: Colors.gold }]} onPress={() => { setDbUrl(""); setShowDbField(true); }}>
                  <Feather name="edit-2" size={14} color={Colors.gold} />
                  <Text style={[styles.dbBtnText, { color: Colors.gold }]}>Change URL</Text>
                </Pressable>
                <Pressable style={[styles.dbBtn, { backgroundColor: Colors.errorRed + "15", borderColor: Colors.errorRed }]} onPress={handleRemoveCustomDb} disabled={savingDb}>
                  {savingDb ? <ActivityIndicator size="small" color={Colors.errorRed} /> : <Feather name="trash-2" size={14} color={Colors.errorRed} />}
                  <Text style={[styles.dbBtnText, { color: Colors.errorRed }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PostgreSQL Connection URL</Text>
              <TextInput value={dbUrl} onChangeText={setDbUrl} placeholder="postgresql://user:password@host:5432/dbname" placeholderTextColor={theme.textSecondary} autoCapitalize="none" autoCorrect={false} multiline style={[styles.dbInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]} />
              <Text style={[styles.dbHint, { color: theme.textSecondary }]}>The server will restart automatically after saving.</Text>
              <View style={styles.dbBtns}>
                <Pressable style={[styles.dbSaveBtn, { opacity: savingDb ? 0.7 : 1 }]} onPress={handleSaveDbUrl} disabled={savingDb}>
                  {savingDb ? <ActivityIndicator color={Colors.charcoal} /> : <><Feather name="save" size={16} color={Colors.charcoal} /><Text style={styles.dbSaveBtnText}>Save & Connect</Text></>}
                </Pressable>
                {showDbField && hasCustomDb && (
                  <Pressable style={[styles.dbCancelBtn, { borderColor: theme.border }]} onPress={() => setShowDbField(false)}>
                    <Text style={[styles.dbCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </SectionCard>

      </ScrollView>
    </View>
  );
}

function SectionCard({ icon, iconColor, title, children, theme }: { icon: string; iconColor: string; title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={[cardStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.icon, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[cardStyles.title, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, theme }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboard?: any; theme: any }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={theme.textSecondary} keyboardType={keyboard || "default"} autoCapitalize="none" style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]} />
    </View>
  );
}

function SaveBtn({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={Colors.charcoal} /> : <Text style={styles.saveBtnText}>{label}</Text>}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginTop: -6 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  saveBtn: { backgroundColor: Colors.gold, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.charcoal },
  qrPreviewBox: { alignItems: "center", gap: 12 },
  qrPreview: { width: 180, height: 180, borderRadius: 12 },
  qrActions: { flexDirection: "row", gap: 10 },
  qrBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  qrBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  uploadQrBtn: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14, padding: 32, alignItems: "center", gap: 8 },
  uploadQrText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  uploadQrSub: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  legalTabs: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, gap: 4 },
  legalTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  legalTabText: { fontSize: 13 },
  legalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontFamily: "Inter_400Regular", fontSize: 13, minHeight: 220, lineHeight: 20 },
  dbConnected: { gap: 12 },
  dbStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  dbDot: { width: 8, height: 8, borderRadius: 4 },
  dbMasked: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  dbBtns: { flexDirection: "row", gap: 10 },
  dbBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center" },
  dbBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  dbInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  dbHint: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  dbSaveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.gold, paddingVertical: 13, borderRadius: 12, gap: 8 },
  dbSaveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.charcoal },
  dbCancelBtn: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  dbCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
