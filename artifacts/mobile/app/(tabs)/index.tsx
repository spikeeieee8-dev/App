import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated, Dimensions, Platform, Pressable,
  ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "new", label: "New In" },
  { id: "sale", label: "Sale" },
];

export default function HomeScreen() {
  const { products, isDarkMode, cartCount } = useApp();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const scrollY = useRef(new Animated.Value(0)).current;

  const topPad = insets.top + 8;

  const filteredProducts =
    selectedCategory === "all" ? products
    : selectedCategory === "new" ? products.filter((p) => p.isNew)
    : selectedCategory === "sale" ? products.filter((p) => p.originalPrice > p.discountedPrice)
    : products.filter((p) => p.category === selectedCategory);

  const featuredProducts = products.filter((p) => p.isFeatured);

  const headerBg = scrollY.interpolate({ inputRange: [0, 60], outputRange: ["rgba(0,0,0,0)", isDark ? Colors.charcoalMid : "#fff"], extrapolate: "clamp" });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.header, { paddingTop: topPad, backgroundColor: headerBg }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.logoSmall, { color: Colors.gold }]}>ALMERA</Text>
            <Text style={[styles.headerGreet, { color: theme.textSecondary }]}>
              {user ? `Hi, ${user.name.split(" ")[0]}` : "Premium Fashion"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.iconBtn, { backgroundColor: theme.card }]} onPress={() => router.push("/(tabs)/shop")}>
              <Feather name="search" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: theme.card }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/cart"); }}
            >
              <Feather name="shopping-bag" size={18} color={theme.text} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.heroBanner, { paddingTop: topPad + 56, backgroundColor: isDark ? Colors.charcoalLight : Colors.charcoalMid }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NEW COLLECTION 2025</Text>
            <Text style={styles.heroTitle}>Luxury{"\n"}Redefined</Text>
            <Text style={styles.heroSubtitle}>Premium fashion crafted for Pakistan</Text>
            <Pressable style={styles.heroButton} onPress={() => router.push("/(tabs)/shop")}>
              <Text style={styles.heroButtonText}>Explore Now</Text>
              <Feather name="arrow-right" size={14} color={Colors.charcoal} />
            </Pressable>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Up to{"\n"}40% OFF</Text>
          </View>
        </View>

        <View style={[styles.categoriesSection]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, {
                  backgroundColor: selectedCategory === cat.id ? Colors.gold : theme.card,
                  borderColor: selectedCategory === cat.id ? Colors.gold : theme.border,
                }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedCategory(cat.id); }}
              >
                <Text style={[styles.categoryChipText, {
                  color: selectedCategory === cat.id ? Colors.charcoal : theme.text,
                  fontFamily: selectedCategory === cat.id ? "Inter_600SemiBold" : "Inter_400Regular",
                }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {selectedCategory === "all" && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured</Text>
              <Pressable onPress={() => router.push("/(tabs)/shop")}>
                <Text style={[styles.seeAll, { color: Colors.gold }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} layout="horizontal" theme={theme} isDark={isDark} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {selectedCategory === "all" ? "All Products" : selectedCategory === "new" ? "New Arrivals" : selectedCategory === "sale" ? "On Sale" : selectedCategory === "men" ? "Men's" : "Women's"}
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>{filteredProducts.length} items</Text>
          </View>
          <View style={styles.productsGrid}>
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} layout="grid" theme={theme} isDark={isDark} />
            ))}
          </View>
        </View>

        <View style={[styles.promoBanner, { backgroundColor: isDark ? Colors.charcoalLight : Colors.charcoalMid }]}>
          <Text style={styles.promoTitle}>FREE SHIPPING</Text>
          <Text style={styles.promoText}>On all orders above Rs. 5,000</Text>
          <View style={styles.promoLine} />
          <Text style={styles.promoSub}>Pay via EasyPaisa · JazzCash · COD</Text>
        </View>
      </Animated.ScrollView>

      <WhatsAppButton isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 10, paddingHorizontal: 16, paddingBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoSmall: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: 5 },
  headerGreet: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  badge: {
    position: "absolute", top: 3, right: 3, minWidth: 14, height: 14,
    borderRadius: 7, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 8, color: Colors.charcoal },
  heroBanner: {
    paddingHorizontal: 24, paddingBottom: 28, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  heroContent: { flex: 1 },
  heroTag: { fontFamily: "Inter_500Medium", fontSize: 9, color: Colors.gold, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 30, color: Colors.offWhite, lineHeight: 36, marginBottom: 6 },
  heroSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.mutedGray, marginBottom: 16, lineHeight: 17 },
  heroButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.gold,
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8, alignSelf: "flex-start", gap: 5,
  },
  heroButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.charcoal },
  heroBadge: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center", marginLeft: 12,
  },
  heroBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.charcoal, textAlign: "center", lineHeight: 14 },
  categoriesSection: { paddingVertical: 14 },
  categoriesRow: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 13 },
  section: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13 },
  countText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  promoBanner: {
    margin: 16, borderRadius: 16, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(201,168,76,0.2)",
  },
  promoTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.gold, letterSpacing: 3, marginBottom: 4 },
  promoText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.offWhite, marginBottom: 10 },
  promoLine: { width: 40, height: 1, backgroundColor: Colors.gold, opacity: 0.5, marginBottom: 10 },
  promoSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.mutedGray, letterSpacing: 0.5 },
});
