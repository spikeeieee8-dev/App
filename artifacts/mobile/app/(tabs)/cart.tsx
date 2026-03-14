import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function CartScreen() {
  const { cart, removeFromCart, updateCartQty, cartTotal, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 8;
  const shipping = cartTotal >= 5000 ? 0 : 250;
  const total = cartTotal + shipping;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Cart</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {cart.length === 0 ? "Empty" : `${cart.reduce((s, i) => s + i.quantity, 0)} items · Rs. ${cartTotal.toLocaleString()}`}
            </Text>
          </View>
          {cart.length > 0 && (
            <View style={[styles.totalPill, { backgroundColor: Colors.gold + "15" }]}>
              <Text style={[styles.totalPillText, { color: Colors.gold }]}>Rs. {total.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
            <Feather name="shopping-cart" size={40} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add items from our premium collection
          </Text>
          <Pressable style={styles.shopButton} onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.shopButtonText}>Browse Collection</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>
            {cart.map((item) => {
              const key = `${item.product.id}-${item.size}-${item.color}`;
              return (
                <View key={key} style={[styles.cartItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
                    <Feather name="image" size={22} color={Colors.mutedGray} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>{item.product.name}</Text>
                    <View style={styles.variantRow}>
                      {[item.size, item.color].map((v) => (
                        <View key={v} style={[styles.variantTag, { backgroundColor: theme.backgroundSecondary }]}>
                          <Text style={[styles.variantText, { color: theme.textSecondary }]}>{v}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.priceQtyRow}>
                      <Text style={styles.itemPrice}>Rs. {(item.product.discountedPrice * item.quantity).toLocaleString()}</Text>
                      <View style={[styles.qtyControl, { borderColor: theme.border }]}>
                        <Pressable style={styles.qtyBtn} onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); updateCartQty(item.product.id, item.size, item.color, item.quantity - 1); }}>
                          <Feather name="minus" size={13} color={theme.text} />
                        </Pressable>
                        <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                        <Pressable style={styles.qtyBtn} onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); updateCartQty(item.product.id, item.size, item.color, item.quantity + 1); }}>
                          <Feather name="plus" size={13} color={theme.text} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  <Pressable onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeFromCart(item.product.id, item.size, item.color); }} style={styles.removeBtn}>
                    <Feather name="trash-2" size={15} color={Colors.errorRed} />
                  </Pressable>
                </View>
              );
            })}

            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>
              {[
                { label: "Subtotal", value: `Rs. ${cartTotal.toLocaleString()}`, normal: true },
                { label: "Shipping", value: shipping === 0 ? "FREE" : `Rs. ${shipping}`, normal: shipping > 0 },
              ].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: row.normal ? theme.text : Colors.successGreen }]}>{row.value}</Text>
                </View>
              ))}
              {shipping > 0 && (
                <View style={[styles.shippingHint, { backgroundColor: Colors.gold + "10" }]}>
                  <Feather name="truck" size={12} color={Colors.gold} />
                  <Text style={[styles.shippingHintText, { color: Colors.gold }]}>Add Rs. {(5000 - cartTotal).toLocaleString()} more for free shipping</Text>
                </View>
              )}
              <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.checkoutBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
            <Pressable
              style={styles.checkoutButton}
              onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/checkout"); }}
            >
              <Text style={styles.checkoutButtonText}>Checkout · Rs. {total.toLocaleString()}</Text>
              <Feather name="arrow-right" size={16} color={Colors.charcoal} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  totalPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  totalPillText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  shopButton: { backgroundColor: Colors.gold, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  shopButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.charcoal },
  cartItem: {
    flexDirection: "row", marginHorizontal: 14, marginTop: 10,
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 12,
  },
  imagePlaceholder: { width: 72, height: 84, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6, lineHeight: 18 },
  variantRow: { flexDirection: "row", gap: 5, marginBottom: 8 },
  variantTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  variantText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  priceQtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemPrice: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.gold },
  qtyControl: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  qtyText: { fontFamily: "Inter_600SemiBold", fontSize: 13, minWidth: 22, textAlign: "center" },
  removeBtn: { padding: 4, alignSelf: "flex-start" },
  summaryCard: { margin: 14, borderRadius: 16, borderWidth: 1, padding: 18 },
  summaryTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 14 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  summaryValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  shippingHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    padding: 10, borderRadius: 8, marginBottom: 8,
  },
  shippingHintText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1 },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 19, color: Colors.gold },
  checkoutBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  checkoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.gold, paddingVertical: 15, borderRadius: 14, gap: 8,
  },
  checkoutButtonText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.charcoal },
});
