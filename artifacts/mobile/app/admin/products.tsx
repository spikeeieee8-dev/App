import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

export default function AdminProductsScreen() {
  const { products, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const [filter, setFilter] = useState<"all" | "low_stock" | "men" | "women">("all");

  const filtered = products.filter((p) => {
    if (filter === "low_stock") return p.variants.some((v) => v.stock <= 5);
    if (filter === "men") return p.category === "men";
    if (filter === "women") return p.category === "women";
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Product Inventory</Text>
        <Pressable style={styles.addBtn}>
          <Feather name="plus" size={20} color={Colors.gold} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "low_stock", "men", "women"] as const).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? Colors.gold : theme.backgroundSecondary,
                borderColor: filter === f ? Colors.gold : theme.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? Colors.charcoal : theme.text, fontFamily: filter === f ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {f === "all" ? "All" : f === "low_stock" ? "Low Stock" : f === "men" ? "Men" : "Women"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {filtered.map((product) => {
          const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
          const isLowStock = product.variants.some((v) => v.stock <= 5);
          const sizes = [...new Set(product.variants.map((v) => v.size))];

          return (
            <View
              key={product.id}
              style={[styles.productRow, { backgroundColor: theme.card, borderColor: isLowStock ? Colors.errorRed + "40" : theme.border }]}
            >
              <View style={[styles.productImage, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
                <Feather name="image" size={20} color={Colors.mutedGray} />
                {isLowStock && (
                  <View style={styles.lowStockDot} />
                )}
              </View>
              <View style={styles.productInfo}>
                <View style={styles.productTopRow}>
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productCategory, { color: Colors.gold }]}>
                    {product.category.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.salePrice}>Rs. {product.discountedPrice.toLocaleString()}</Text>
                  <Text style={[styles.originalPriceSm, { color: theme.textSecondary }]}>
                    Rs. {product.originalPrice.toLocaleString()}
                  </Text>
                  <Text style={[styles.costPrice, { color: theme.textSecondary }]}>
                    Cost: Rs. {product.costPrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: isLowStock ? Colors.errorRed : theme.textSecondary }]}>
                    {isLowStock ? "Low Stock!" : "In Stock"}
                  </Text>
                  <Text style={[styles.stockCount, { color: isLowStock ? Colors.errorRed : theme.text }]}>
                    {totalStock} units
                  </Text>
                </View>
                <View style={styles.sizesRow}>
                  {sizes.slice(0, 5).map((size) => {
                    const sizeStock = product.variants
                      .filter((v) => v.size === size)
                      .reduce((s, v) => s + v.stock, 0);
                    return (
                      <View
                        key={size}
                        style={[
                          styles.sizeTag,
                          {
                            backgroundColor: sizeStock === 0 ? theme.backgroundSecondary + "50" : theme.backgroundSecondary,
                            borderColor: sizeStock <= 3 ? Colors.errorRed + "60" : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.sizeTagText, { color: sizeStock === 0 ? theme.textSecondary : theme.text }]}>
                          {size}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Pressable style={styles.editBtn}>
                <Feather name="edit-2" size={14} color={theme.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.offWhite,
  },
  addBtn: { padding: 4 },
  filterBar: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },
  productRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  productImage: {
    width: 64,
    height: 72,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lowStockDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.errorRed,
  },
  productInfo: { flex: 1 },
  productTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  productCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  salePrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#E74C3C",
  },
  originalPriceSm: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  costPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  stockLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  stockCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  sizesRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  sizeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  sizeTagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  editBtn: {
    padding: 4,
    alignSelf: "flex-start",
  },
});
