import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
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
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "men", label: "Men", icon: "user" },
  { id: "women", label: "Women", icon: "user" },
  { id: "new", label: "New In", icon: "zap" },
  { id: "sale", label: "Sale", icon: "tag" },
];

export default function HomeScreen() {
  const { products, isDarkMode, cartCount } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const scrollY = useRef(new Animated.Value(0)).current;

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : selectedCategory === "new"
      ? products.filter((p) => p.isNew)
      : selectedCategory === "sale"
      ? products.filter((p) => p.originalPrice > p.discountedPrice)
      : products.filter((p) => p.category === selectedCategory);

  const featuredProducts = products.filter((p) => p.isFeatured);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            borderBottomColor: theme.border,
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.logoSmall, { color: Colors.gold }]}>ALMERA</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Premium Fashion
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Feather name="search" size={22} color={theme.text} />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/cart");
              }}
            >
              <Feather name="shopping-bag" size={22} color={theme.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={[styles.heroBanner, { backgroundColor: Colors.charcoalLight }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NEW COLLECTION 2025</Text>
            <Text style={styles.heroTitle}>Luxury{"\n"}Redefined</Text>
            <Text style={styles.heroSubtitle}>Premium fashion crafted for Pakistan's finest</Text>
            <Pressable
              style={styles.heroButton}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Text style={styles.heroButtonText}>Explore Collection</Text>
              <Feather name="arrow-right" size={16} color={Colors.charcoal} />
            </Pressable>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Up to{"\n"}40% OFF</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.id ? Colors.gold : theme.backgroundSecondary,
                    borderColor:
                      selectedCategory === cat.id ? Colors.gold : theme.border,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web")
                    Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: selectedCategory === cat.id ? Colors.charcoal : theme.text,
                      fontFamily: selectedCategory === cat.id ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {selectedCategory === "all" && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Featured
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/shop")}>
                <Text style={[styles.seeAll, { color: Colors.gold }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}
            >
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} layout="horizontal" theme={theme} isDark={isDark} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {selectedCategory === "all"
                ? "All Products"
                : selectedCategory === "new"
                ? "New Arrivals"
                : selectedCategory === "sale"
                ? "On Sale"
                : selectedCategory === "men"
                ? "Men's Collection"
                : "Women's Collection"}
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {filteredProducts.length} items
            </Text>
          </View>
          <View style={styles.productsGrid}>
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} layout="grid" theme={theme} isDark={isDark} />
            ))}
          </View>
        </View>

        <View
          style={[styles.promoBanner, { backgroundColor: Colors.charcoalLight, borderColor: "rgba(201,168,76,0.3)" }]}
        >
          <Text style={styles.promoTitle}>FREE SHIPPING</Text>
          <Text style={styles.promoText}>On all orders above Rs. 5,000</Text>
          <View style={styles.promoLine} />
          <Text style={styles.promoSub}>Pay via EasyPaisa or JazzCash</Text>
        </View>
      </Animated.ScrollView>

      <WhatsAppButton isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoSmall: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 6,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.charcoal,
  },
  heroBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 28,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
  },
  heroContent: { flex: 1 },
  heroTag: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.offWhite,
    lineHeight: 38,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.mutedGray,
    marginBottom: 20,
    lineHeight: 18,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  heroButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  heroBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.charcoal,
    textAlign: "center",
    lineHeight: 16,
  },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  featuredRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  promoBanner: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  promoTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 3,
    marginBottom: 4,
  },
  promoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.offWhite,
    marginBottom: 12,
  },
  promoLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.5,
    marginBottom: 12,
  },
  promoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.mutedGray,
    letterSpacing: 0.5,
  },
});
