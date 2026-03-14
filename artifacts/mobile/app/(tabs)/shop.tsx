import { Feather } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import {
  Animated,
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
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const GENDER_TABS = ["All", "Men", "Women"];

const SUBCATEGORIES: Record<string, string[]> = {
  All: ["All", "Clothing", "Hoodies/Sweatshirts", "Tees", "Polos", "Accessories"],
  Men: ["All", "Tees", "Polos", "Clothing", "Hoodies/Sweatshirts", "Accessories"],
  Women: ["All", "Clothing", "Accessories"],
};

const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"];

export default function ShopScreen() {
  const { products, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [sortBy, setSortBy] = useState("Featured");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const filtered = products
    .filter((p) => {
      if (gender === "Men" && p.category !== "men") return false;
      if (gender === "Women" && p.category !== "women") return false;
      if (subcategory !== "All" && p.subcategory !== subcategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.discountedPrice - b.discountedPrice;
      if (sortBy === "Price: High to Low") return b.discountedPrice - a.discountedPrice;
      if (sortBy === "Newest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, paddingTop: topInset + 12, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Shop</Text>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.textSecondary} />
          <TextInput
            ref={searchRef}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text, fontFamily: "Inter_400Regular" }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.genderTabs}>
          {GENDER_TABS.map((g) => (
            <Pressable
              key={g}
              style={[
                styles.genderTab,
                { borderBottomColor: gender === g ? Colors.gold : "transparent" },
              ]}
              onPress={() => {
                setGender(g);
                setSubcategory("All");
              }}
            >
              <Text
                style={[
                  styles.genderTabText,
                  {
                    color: gender === g ? Colors.gold : theme.textSecondary,
                    fontFamily: gender === g ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={styles.sortButton}
            onPress={() => setShowSort(!showSort)}
          >
            <Feather name="sliders" size={16} color={theme.text} />
          </Pressable>
        </View>

        {showSort && (
          <View style={[styles.sortDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[
                  styles.sortOption,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => {
                  setSortBy(opt);
                  setShowSort(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    {
                      color: sortBy === opt ? Colors.gold : theme.text,
                      fontFamily: sortBy === opt ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {opt}
                </Text>
                {sortBy === opt && <Feather name="check" size={14} color={Colors.gold} />}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.subcatContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.subcatRow}
      >
        {SUBCATEGORIES[gender].map((sub) => (
          <Pressable
            key={sub}
            style={[
              styles.subcatChip,
              {
                backgroundColor: subcategory === sub ? Colors.gold : theme.backgroundSecondary,
                borderColor: subcategory === sub ? Colors.gold : theme.border,
              },
            ]}
            onPress={() => setSubcategory(sub)}
          >
            <Text
              style={[
                styles.subcatText,
                {
                  color: subcategory === sub ? Colors.charcoal : theme.text,
                  fontFamily: subcategory === sub ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {sub}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-bag" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No products found</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {filtered.length} products • Sorted by {sortBy}
            </Text>
            <View style={styles.grid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} layout="grid" theme={theme} isDark={isDark} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <WhatsAppButton isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  genderTabs: {
    flexDirection: "row",
    alignItems: "center",
  },
  genderTab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    marginRight: 4,
  },
  genderTabText: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sortButton: {
    marginLeft: "auto",
    padding: 10,
  },
  sortDropdown: {
    position: "absolute",
    top: "100%",
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 100,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
  },
  subcatContainer: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  subcatRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subcatChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  subcatText: {
    fontSize: 12,
  },
  content: {
    padding: 12,
  },
  resultCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
});
