import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
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

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, wishlist, toggleWishlist, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const product = products.find((p) => p.id === id);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const isWishlisted = wishlist.includes(id ?? "");

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.text }}>Product not found</Text>
      </View>
    );
  }

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const availableStock = selectedVariant?.stock ?? null;
  const discount = Math.round(
    ((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100
  );

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product, selectedSize, selectedColor, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={[styles.imageContainer, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={64} color={Colors.mutedGray} />
            <Text style={[styles.imagePlaceholderText, { color: Colors.mutedGray }]}>
              Product Image
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discount}%</Text>
            </View>
          )}
          {product.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.backBtn, { top: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={Colors.offWhite} />
        </Pressable>

        <Pressable
          style={[styles.wishlistBtn, { top: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleWishlist(product.id);
          }}
        >
          <Feather name="heart" size={20} color={isWishlisted ? "#E74C3C" : Colors.offWhite} />
        </Pressable>

        <View style={styles.details}>
          <Text style={[styles.subcategory, { color: Colors.gold }]}>
            {product.category.toUpperCase()} · {product.subcategory.toUpperCase()}
          </Text>
          <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.discountedPrice}>
              Rs. {product.discountedPrice.toLocaleString()}
            </Text>
            <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
              Rs. {product.originalPrice.toLocaleString()}
            </Text>
            <View style={[styles.saveBadge, { backgroundColor: "#E74C3C20" }]}>
              <Text style={[styles.saveText, { color: "#E74C3C" }]}>
                Save Rs. {(product.originalPrice - product.discountedPrice).toLocaleString()}
              </Text>
            </View>
          </View>

          {product.urgencyText && (
            <View style={styles.urgencyRow}>
              <Feather name="zap" size={12} color="#F39C12" />
              <Text style={styles.urgencyText}>{product.urgencyText}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </Text>
          <View style={styles.colorsRow}>
            {colors.map((color) => (
              <Pressable
                key={color}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setSelectedColor(color);
                }}
                style={[
                  styles.colorChip,
                  {
                    borderColor: selectedColor === color ? Colors.gold : theme.border,
                    backgroundColor:
                      selectedColor === color ? Colors.gold + "15" : theme.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.colorText,
                    {
                      color: selectedColor === color ? Colors.gold : theme.text,
                      fontFamily:
                        selectedColor === color ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {color}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 16 }]}>
            Size{selectedSize ? `: ${selectedSize}` : ""}
          </Text>
          <View style={styles.sizesRow}>
            {sizes.map((size) => {
              const stockForSize = product.variants
                .filter((v) => v.size === size && (!selectedColor || v.color === selectedColor))
                .reduce((s, v) => s + v.stock, 0);
              const outOfStock = stockForSize === 0;

              return (
                <Pressable
                  key={size}
                  onPress={() => {
                    if (outOfStock) return;
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSelectedSize(size);
                  }}
                  style={[
                    styles.sizeChip,
                    {
                      borderColor:
                        selectedSize === size
                          ? Colors.gold
                          : outOfStock
                          ? theme.border + "60"
                          : theme.border,
                      backgroundColor:
                        selectedSize === size
                          ? Colors.gold
                          : outOfStock
                          ? theme.backgroundSecondary + "50"
                          : theme.backgroundSecondary,
                      opacity: outOfStock ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      {
                        color: selectedSize === size ? Colors.charcoal : theme.text,
                        fontFamily:
                          selectedSize === size ? "Inter_700Bold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {availableStock !== null && availableStock <= 5 && availableStock > 0 && (
            <Text style={styles.lowStock}>Only {availableStock} left in stock!</Text>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionLabel, { color: theme.text }]}>Description</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {product.description}
          </Text>

          <View style={[styles.shippingCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            {[
              { icon: "truck", text: "Free shipping on orders over Rs. 5,000" },
              { icon: "refresh-cw", text: "Easy 7-day returns" },
              { icon: "shield", text: "100% authentic products" },
            ].map((item) => (
              <View key={item.icon} style={styles.shippingRow}>
                <Feather name={item.icon as any} size={14} color={Colors.gold} />
                <Text style={[styles.shippingText, { color: theme.textSecondary }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 8,
          },
        ]}
      >
        <View style={[styles.qtyControl, { borderColor: theme.border }]}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Feather name="minus" size={16} color={theme.text} />
          </Pressable>
          <Text style={[styles.qtyText, { color: theme.text }]}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
            <Feather name="plus" size={16} color={theme.text} />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.addToCartBtn,
            {
              backgroundColor: addedToCart ? Colors.successGreen : Colors.gold,
              opacity: !selectedSize || !selectedColor ? 0.6 : 1,
            },
          ]}
          onPress={handleAddToCart}
        >
          <Feather name={addedToCart ? "check" : "shopping-bag"} size={18} color={Colors.charcoal} />
          <Text style={styles.addToCartText}>
            {addedToCart ? "Added to Cart!" : !selectedSize || !selectedColor ? "Select Size & Color" : "Add to Cart"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: {
    height: width * 0.9,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  imagePlaceholderText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  discountBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#E74C3C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  newBadge: {
    position: "absolute",
    top: 80,
    left: 16,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.charcoal,
    letterSpacing: 1,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    padding: 20,
  },
  subcategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  productName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  discountedPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#E74C3C",
  },
  originalPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textDecorationLine: "line-through",
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  urgencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  urgencyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#F39C12",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 10,
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  colorText: {
    fontSize: 13,
  },
  sizesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    width: 52,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeText: {
    fontSize: 13,
  },
  lowStock: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 8,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  shippingCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  shippingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shippingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    minWidth: 30,
    textAlign: "center",
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.charcoal,
  },
});
