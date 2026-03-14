import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { Product } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - 32 - 8) / 2;

type Props = {
  product: Product;
  layout: "grid" | "horizontal";
  theme: typeof Colors.light;
  isDark: boolean;
};

export function ProductCard({ product, layout, theme, isDark }: Props) {
  const { wishlist, toggleWishlist } = useApp();
  const isWishlisted = wishlist.includes(product.id);
  const scale = React.useRef(new Animated.Value(1)).current;
  const discount = Math.round(
    ((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100
  );

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push({ pathname: "/product/[id]", params: { id: product.id } });
  };

  const handleWishlist = (e: any) => {
    e.stopPropagation?.();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWishlist(product.id);
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 10 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 10 }).start();
  };

  if (layout === "horizontal") {
    return (
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.horizontalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.horizontalImagePlaceholder, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
            <Feather name="image" size={32} color={Colors.mutedGray} />
            {product.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          <View style={styles.horizontalInfo}>
            <Text style={[styles.subcategory, { color: Colors.gold }]}>
              {product.subcategory}
            </Text>
            <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.discountedPrice}>
                Rs. {product.discountedPrice.toLocaleString()}
              </Text>
              <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
                Rs. {product.originalPrice.toLocaleString()}
              </Text>
            </View>
            {product.urgencyText && (
              <Text style={styles.urgency}>{product.urgencyText}</Text>
            )}
          </View>
          <Pressable onPress={handleWishlist} style={styles.wishlistBtn}>
            <Feather
              name="heart"
              size={18}
              color={isWishlisted ? "#E74C3C" : theme.textSecondary}
              fill={isWishlisted ? "#E74C3C" : "none"}
            />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }], width: GRID_ITEM_WIDTH }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={[styles.gridImagePlaceholder, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
          <Feather name="image" size={28} color={Colors.mutedGray} />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discount}%</Text>
            </View>
          )}
          {product.isNew && (
            <View style={[styles.newBadge, { top: 8, left: 8, right: "auto" }]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <Pressable onPress={handleWishlist} style={styles.gridWishlistBtn}>
            <Feather
              name="heart"
              size={16}
              color={isWishlisted ? "#E74C3C" : Colors.mutedGray}
            />
          </Pressable>
        </View>
        <View style={styles.gridInfo}>
          <Text style={[styles.subcategorySmall, { color: Colors.gold }]}>
            {product.subcategory}
          </Text>
          <Text style={[styles.productNameSmall, { color: theme.text }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceRowSmall}>
            <Text style={styles.discountedPriceSmall}>
              Rs. {product.discountedPrice.toLocaleString()}
            </Text>
            <Text style={[styles.originalPriceSmall, { color: theme.textSecondary }]}>
              {product.originalPrice.toLocaleString()}
            </Text>
          </View>
          {product.viewingCount && product.viewingCount > 10 ? (
            <Text style={styles.viewingCount}>
              {product.viewingCount} viewing
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  horizontalCard: {
    width: 200,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  horizontalImagePlaceholder: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalInfo: {
    padding: 12,
  },
  subcategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  discountedPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#E74C3C",
  },
  originalPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  urgency: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#E74C3C",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  newBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.charcoal,
    letterSpacing: 1,
  },
  discountBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#E74C3C",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  gridCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 0,
  },
  gridImagePlaceholder: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  gridWishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridInfo: {
    padding: 10,
  },
  subcategorySmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  productNameSmall: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 16,
  },
  priceRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  discountedPriceSmall: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#E74C3C",
  },
  originalPriceSmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  viewingCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.mutedGray,
    marginTop: 3,
  },
});
