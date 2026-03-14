import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";

type NewProduct = {
  name: string;
  description: string;
  category: "men" | "women";
  subcategory: string;
  originalPrice: string;
  discountedPrice: string;
  costPrice: string;
};

const BLANK: NewProduct = {
  name: "", description: "", category: "men", subcategory: "",
  originalPrice: "", discountedPrice: "", costPrice: "",
};

function confirmDelete(message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert("Delete Product", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Delete", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export default function AdminProductsScreen() {
  const { products, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 16 : 8);

  const [filter, setFilter] = useState<"all" | "low_stock" | "men" | "women">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewProduct>(BLANK);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localDeleted, setLocalDeleted] = useState<Set<string>>(new Set());

  const [mediaItems, setMediaItems] = useState<{ uri: string; type: "image" | "video"; name: string; mimeType: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const filtered = products
    .filter((p) => !localDeleted.has(p.id))
    .filter((p) => {
      if (filter === "low_stock") return p.variants.some((v) => v.stock <= 5);
      if (filter === "men") return p.category === "men";
      if (filter === "women") return p.category === "women";
      return true;
    });

  const handlePickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newItems = result.assets.map((a) => ({
        uri: a.uri,
        type: (a.type === "video" ? "video" : "image") as "image" | "video",
        name: a.fileName || `media_${Date.now()}`,
        mimeType: a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg"),
      }));
      setMediaItems((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const removeMedia = (idx: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.originalPrice || !form.discountedPrice || !form.costPrice) {
      Alert.alert("Missing Fields", "Name and all prices are required.");
      return;
    }
    setSaving(true);
    setUploading(mediaItems.length > 0);
    try {
      const uploadedUrls: string[] = [];
      for (const item of mediaItems) {
        try {
          const { url } = await api.upload.uploadFile(item.uri, item.name, item.mimeType, "products");
          uploadedUrls.push(url);
        } catch {
          Alert.alert("Warning", `Failed to upload ${item.name}. Product will be saved without it.`);
        }
      }
      setUploading(false);

      await api.products.create({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        originalPrice: Number(form.originalPrice),
        discountedPrice: Number(form.discountedPrice),
        costPrice: Number(form.costPrice),
        variants: [],
        tags: [],
        images: uploadedUrls,
        isNew: true,
        isFeatured: false,
      });
      setShowCreate(false);
      setForm(BLANK);
      setMediaItems([]);
      Alert.alert("Success", "Product created. Refresh to see it in the list.");
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Error", e.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDelete(`Remove "${name}" from the store?`);
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await api.products.delete(id);
      setLocalDeleted((prev) => new Set([...prev, id]));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Products</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: Colors.gold + "18" }]} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={18} color={Colors.gold} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "low_stock", "men", "women"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, { backgroundColor: filter === f ? Colors.gold : theme.backgroundSecondary, borderColor: filter === f ? Colors.gold : theme.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? Colors.charcoal : theme.text, fontFamily: filter === f ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {f === "all" ? `All (${products.filter(p => !localDeleted.has(p.id)).length})` : f === "low_stock" ? "Low Stock" : f === "men" ? "Men" : "Women"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={44} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No products found</Text>
          </View>
        ) : filtered.map((product) => {
          const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
          const isLowStock = product.variants.some((v) => v.stock <= 5);
          const sizes = [...new Set(product.variants.map((v) => v.size))];
          const isDeleting = deletingId === product.id;
          const firstImage = product.images?.[0];

          return (
            <View key={product.id} style={[styles.productRow, { backgroundColor: theme.card, borderColor: isLowStock ? Colors.errorRed + "40" : theme.border }]}>
              <View style={[styles.productImageBox, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
                {firstImage ? (
                  <Image source={{ uri: firstImage }} style={styles.productImg} resizeMode="cover" />
                ) : (
                  <Feather name="image" size={20} color={Colors.mutedGray} />
                )}
                {isLowStock && <View style={styles.lowStockDot} />}
              </View>
              <View style={styles.productInfo}>
                <View style={styles.productTopRow}>
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.productCategory, { color: Colors.gold }]}>{product.category.toUpperCase()}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.salePrice}>Rs. {product.discountedPrice.toLocaleString()}</Text>
                  <Text style={[styles.originalPriceSm, { color: theme.textSecondary }]}>Rs. {product.originalPrice.toLocaleString()}</Text>
                  <Text style={[styles.costPrice, { color: theme.textSecondary }]}>Cost: Rs. {product.costPrice.toLocaleString()}</Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: isLowStock ? Colors.errorRed : theme.textSecondary }]}>{isLowStock ? "Low Stock!" : "In Stock"}</Text>
                  <Text style={[styles.stockCount, { color: isLowStock ? Colors.errorRed : theme.text }]}>{totalStock} units</Text>
                </View>
                <View style={styles.sizesRow}>
                  {sizes.slice(0, 5).map((size) => {
                    const sizeStock = product.variants.filter((v) => v.size === size).reduce((s, v) => s + v.stock, 0);
                    return (
                      <View key={size} style={[styles.sizeTag, { backgroundColor: sizeStock === 0 ? theme.backgroundSecondary + "50" : theme.backgroundSecondary, borderColor: sizeStock <= 3 ? Colors.errorRed + "60" : theme.border }]}>
                        <Text style={[styles.sizeTagText, { color: sizeStock === 0 ? theme.textSecondary : theme.text }]}>{size}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Pressable
                style={[styles.deleteBtn, { opacity: isDeleting ? 0.4 : 1 }]}
                onPress={() => !isDeleting && handleDelete(product.id, product.name)}
              >
                {isDeleting
                  ? <ActivityIndicator size="small" color={Colors.errorRed} />
                  : <Feather name="trash-2" size={15} color={Colors.errorRed} />
                }
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Pressable onPress={() => { setShowCreate(false); setForm(BLANK); setMediaItems([]); }}>
              <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Product</Text>
            <Pressable onPress={handleCreate} disabled={saving}>
              <Text style={[styles.modalSave, { color: saving ? theme.textSecondary : Colors.gold }]}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {([
              { label: "Product Name *", key: "name", placeholder: "e.g. Premium Merino Polo" },
              { label: "Description", key: "description", placeholder: "Short description..." },
              { label: "Subcategory", key: "subcategory", placeholder: "e.g. Polos, Tees, Accessories" },
              { label: "Original Price (Rs.) *", key: "originalPrice", placeholder: "8500", numeric: true },
              { label: "Sale Price (Rs.) *", key: "discountedPrice", placeholder: "5999", numeric: true },
              { label: "Cost Price (Rs.) *", key: "costPrice", placeholder: "3200", numeric: true },
            ] as { label: string; key: keyof NewProduct; placeholder: string; numeric?: boolean }[]).map(({ label, key, placeholder, numeric }) => (
              <View key={key} style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>{label}</Text>
                <TextInput
                  value={form[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={numeric ? "numeric" : "default"}
                  style={[styles.formInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                />
              </View>
            ))}

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Category *</Text>
              <View style={styles.categoryRow}>
                {(["men", "women"] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, { backgroundColor: form.category === cat ? Colors.gold : theme.card, borderColor: form.category === cat ? Colors.gold : theme.border }]}
                    onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  >
                    <Text style={[styles.categoryChipText, { color: form.category === cat ? Colors.charcoal : theme.text }]}>{cat === "men" ? "Men" : "Women"}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Photos & Videos (up to 5)</Text>
              {uploading && (
                <View style={[styles.uploadingBanner, { backgroundColor: Colors.gold + "18" }]}>
                  <ActivityIndicator size="small" color={Colors.gold} />
                  <Text style={[styles.uploadingText, { color: Colors.gold }]}>Uploading media…</Text>
                </View>
              )}
              <View style={styles.mediaGrid}>
                {mediaItems.map((item, idx) => (
                  <View key={idx} style={styles.mediaThumbnailWrap}>
                    <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} resizeMode="cover" />
                    {item.type === "video" && (
                      <View style={styles.videoOverlay}>
                        <Feather name="play" size={16} color="#fff" />
                      </View>
                    )}
                    <Pressable style={styles.mediaRemoveBtn} onPress={() => removeMedia(idx)}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {mediaItems.length < 5 && (
                  <Pressable
                    style={[styles.addMediaBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                    onPress={handlePickMedia}
                  >
                    <Feather name="plus" size={24} color={Colors.gold} />
                    <Text style={[styles.addMediaText, { color: Colors.gold }]}>Add</Text>
                  </Pressable>
                )}
              </View>
              <Text style={[styles.mediaHint, { color: theme.textSecondary }]}>
                Images and videos are uploaded to cloud storage when you save.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.gold },
  filterBar: { borderBottomWidth: 1, flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1 },
  filterChipText: { fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  productRow: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 10,
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 12, alignItems: "flex-start",
  },
  productImageBox: {
    width: 64, height: 72, borderRadius: 10,
    alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
  },
  productImg: { width: "100%", height: "100%" },
  lowStockDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.errorRed },
  productInfo: { flex: 1 },
  productTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1, marginRight: 8 },
  productCategory: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" },
  salePrice: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#E74C3C" },
  originalPriceSm: { fontFamily: "Inter_400Regular", fontSize: 11, textDecorationLine: "line-through" },
  costPrice: { fontFamily: "Inter_500Medium", fontSize: 11 },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  stockLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  stockCount: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  sizesRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  sizeTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  sizeTagText: { fontFamily: "Inter_400Regular", fontSize: 10 },
  deleteBtn: { padding: 6, alignSelf: "flex-start" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontFamily: "Inter_400Regular", fontSize: 15 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  modalSave: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  modalBody: { padding: 16, gap: 16, paddingBottom: 60 },
  formField: { gap: 6 },
  formLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  categoryRow: { flexDirection: "row", gap: 10 },
  categoryChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  categoryChipText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  uploadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, marginBottom: 8 },
  uploadingText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  mediaThumbnailWrap: { width: 80, height: 80, borderRadius: 10, overflow: "hidden", position: "relative" },
  mediaThumbnail: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  mediaRemoveBtn: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  addMediaBtn: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4,
  },
  addMediaText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  mediaHint: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
});
