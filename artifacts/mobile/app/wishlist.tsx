import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function WishlistScreen() {
  const { products, wishlist, toggleWishlist, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const wishlisted = products.filter((p) => wishlist.includes(p.id));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Wishlist</Text>
        <View style={[styles.countPill, { backgroundColor: Colors.gold + "18" }]}>
          <Text style={[styles.countPillText, { color: Colors.gold }]}>{wishlisted.length}</Text>
        </View>
      </View>

      {wishlisted.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
            <Feather name="heart" size={40} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your wishlist is empty</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Save items you love from our collection
          </Text>
          <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.shopBtnText}>Browse Collection</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40, padding: 14 }}>
          {wishlisted.map((product) => {
            const firstImage = product.images?.[0];
            const discount = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);
            return (
              <Pressable
                key={product.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
              >
                <View style={[styles.imageBox, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <Feather name="image" size={24} color={Colors.mutedGray} />
                  )}
                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{discount}%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.info}>
                  <Text style={[styles.category, { color: Colors.gold }]}>{product.category.toUpperCase()} · {product.subcategory}</Text>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>Rs. {product.discountedPrice.toLocaleString()}</Text>
                    {product.originalPrice > product.discountedPrice && (
                      <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
                        Rs. {product.originalPrice.toLocaleString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.variantsRow}>
                    {[...new Set(product.variants.map((v) => v.color))].slice(0, 3).map((c) => (
                      <View key={c} style={[styles.variantTag, { backgroundColor: theme.backgroundSecondary }]}>
                        <Text style={[styles.variantText, { color: theme.textSecondary }]}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  style={styles.heartBtn}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleWishlist(product.id);
                  }}
                >
                  <Feather name="heart" size={18} color={Colors.errorRed} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 18, flex: 1 },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countPillText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
  shopBtn: { backgroundColor: Colors.gold, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  shopBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.charcoal },
  card: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1,
    padding: 12, marginBottom: 10, gap: 12,
  },
  imageBox: {
    width: 80, height: 90, borderRadius: 10,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  discountBadge: {
    position: "absolute", top: 4, left: 4,
    backgroundColor: Colors.errorRed, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  discountText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },
  info: { flex: 1, gap: 4 },
  category: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 1 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  price: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.gold },
  originalPrice: { fontFamily: "Inter_400Regular", fontSize: 11, textDecorationLine: "line-through" },
  variantsRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  variantTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  variantText: { fontFamily: "Inter_400Regular", fontSize: 10 },
  heartBtn: { padding: 4, alignSelf: "flex-start" },
});
