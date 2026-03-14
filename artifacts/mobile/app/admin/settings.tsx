import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

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

  const [easypaisaNumber, setEasypaisaNumber] = useState("");
  const [easypaisaName, setEasypaisaName] = useState("");
  const [easypaisaQrUrl, setEasypaisaQrUrl] = useState("");

  const [origNumber, setOrigNumber] = useState("");
  const [origName, setOrigName] = useState("");
  const [origQr, setOrigQr] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { settings } = await api.settings.getAll();
      const num = settings["easypaisa_number"] || "";
      const name = settings["easypaisa_name"] || "";
      const qr = settings["easypaisa_qr_url"] || "";
      setEasypaisaNumber(num);
      setEasypaisaName(name);
      setEasypaisaQrUrl(qr);
      setOrigNumber(num);
      setOrigName(name);
      setOrigQr(qr);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await api.settings.update(key, value);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving("all");
    try {
      if (easypaisaNumber !== origNumber) await api.settings.update("easypaisa_number", easypaisaNumber);
      if (easypaisaName !== origName) await api.settings.update("easypaisa_name", easypaisaName);
      if (easypaisaQrUrl !== origQr) await api.settings.update("easypaisa_qr_url", easypaisaQrUrl);
      setOrigNumber(easypaisaNumber);
      setOrigName(easypaisaName);
      setOrigQr(easypaisaQrUrl);
      Alert.alert("Saved", "Settings have been updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  const handlePickQrImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);
      try {
        const { url } = await api.upload.uploadFile(
          asset.uri,
          asset.fileName || `qr_${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg",
          "settings"
        );
        setEasypaisaQrUrl(url);
        await api.settings.update("easypaisa_qr_url", url);
        setOrigQr(url);
        Alert.alert("Uploaded", "QR code has been updated.");
      } catch (e: any) {
        Alert.alert("Upload failed", e.message || "Could not upload QR code.");
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: topInset, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Settings</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </View>
    );
  }

  const hasChanges =
    easypaisaNumber !== origNumber ||
    easypaisaName !== origName ||
    easypaisaQrUrl !== origQr;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 120 }}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: "#6DC067" + "20" }]}>
              <Feather name="smartphone" size={18} color="#6DC067" />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Easypaisa Details</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Customers will see these details when they choose Easypaisa payment.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Account Name</Text>
            <TextInput
              value={easypaisaName}
              onChangeText={setEasypaisaName}
              placeholder="e.g. Almera Official"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <TextInput
              value={easypaisaNumber}
              onChangeText={setEasypaisaNumber}
              placeholder="e.g. 0300-1234567"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: Colors.gold + "20" }]}>
              <Feather name="image" size={18} color={Colors.gold} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>QR Code</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Upload your Easypaisa QR code. Customers can scan it to make payment.
          </Text>

          {easypaisaQrUrl ? (
            <View style={styles.qrPreviewBox}>
              <Image
                source={{ uri: easypaisaQrUrl }}
                style={styles.qrPreview}
                resizeMode="contain"
              />
              <View style={styles.qrActions}>
                <Pressable
                  style={[styles.qrActionBtn, { backgroundColor: Colors.gold + "15", borderColor: Colors.gold }]}
                  onPress={handlePickQrImage}
                  disabled={uploading}
                >
                  {uploading
                    ? <ActivityIndicator size="small" color={Colors.gold} />
                    : <Feather name="refresh-cw" size={14} color={Colors.gold} />
                  }
                  <Text style={[styles.qrActionText, { color: Colors.gold }]}>Replace QR</Text>
                </Pressable>
                <Pressable
                  style={[styles.qrActionBtn, { backgroundColor: Colors.errorRed + "15", borderColor: Colors.errorRed }]}
                  onPress={() => {
                    setEasypaisaQrUrl("");
                  }}
                >
                  <Feather name="trash-2" size={14} color={Colors.errorRed} />
                  <Text style={[styles.qrActionText, { color: Colors.errorRed }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.uploadQrBtn, { borderColor: Colors.gold, backgroundColor: Colors.gold + "08" }]}
              onPress={handlePickQrImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.gold} />
              ) : (
                <>
                  <Feather name="upload" size={28} color={Colors.gold} />
                  <Text style={[styles.uploadQrText, { color: Colors.gold }]}>Upload QR Code</Text>
                  <Text style={[styles.uploadQrSub, { color: theme.textSecondary }]}>Tap to pick an image from your gallery</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      {hasChanges && (
        <View style={[styles.saveBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={[styles.saveBtn, { opacity: saving === "all" ? 0.7 : 1 }]}
            onPress={handleSaveAll}
            disabled={saving === "all"}
          >
            {saving === "all"
              ? <ActivityIndicator color={Colors.charcoal} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>
            }
          </Pressable>
        </View>
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
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cardSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginTop: -8 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.3 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Inter_400Regular", fontSize: 15,
  },
  qrPreviewBox: { alignItems: "center", gap: 12 },
  qrPreview: { width: 180, height: 180, borderRadius: 12 },
  qrActions: { flexDirection: "row", gap: 10 },
  qrActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  qrActionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  uploadQrBtn: {
    borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14,
    padding: 32, alignItems: "center", gap: 8,
  },
  uploadQrText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  uploadQrSub: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  saveBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  saveBtn: {
    backgroundColor: Colors.gold, paddingVertical: 15, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.charcoal },
});
