import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
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

export default function CartScreen() {
  const { cart, removeFromCart, updateCartQty, cartTotal, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const shipping = cartTotal >= 5000 ? 0 : 250;
  const total = cartTotal + shipping;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>My Cart</Text>
        {cart.length > 0 && (
          <Text style={[styles.itemCount, { color: theme.textSecondary }]}>
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </Text>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-cart" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Explore our premium collection and add items to your cart
          </Text>
          <Pressable
            style={styles.shopButton}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopButtonText}>Browse Collection</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ paddingBottom: 200 }}
          >
            {cart.map((item) => {
              const key = `${item.product.id}-${item.size}-${item.color}`;
              return (
                <View key={key} style={[styles.cartItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? Colors.charcoalMid : Colors.cream }]}>
                    <Feather name="image" size={24} color={Colors.mutedGray} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <View style={styles.variantRow}>
                      <View style={[styles.variantTag, { backgroundColor: theme.backgroundSecondary }]}>
                        <Text style={[styles.variantText, { color: theme.textSecondary }]}>
                          {item.size}
                        </Text>
                      </View>
                      <View style={[styles.variantTag, { backgroundColor: theme.backgroundSecondary }]}>
                        <Text style={[styles.variantText, { color: theme.textSecondary }]}>
                          {item.color}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceQtyRow}>
                      <Text style={styles.itemPrice}>
                        Rs. {(item.product.discountedPrice * item.quantity).toLocaleString()}
                      </Text>
                      <View style={[styles.qtyControl, { borderColor: theme.border }]}>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                            updateCartQty(item.product.id, item.size, item.color, item.quantity - 1);
                          }}
                        >
                          <Feather name="minus" size={14} color={theme.text} />
                        </Pressable>
                        <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                            updateCartQty(item.product.id, item.size, item.color, item.quantity + 1);
                          }}
                        >
                          <Feather name="plus" size={14} color={theme.text} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      removeFromCart(item.product.id, item.size, item.color);
                    }}
                    style={styles.removeBtn}
                  >
                    <Feather name="trash-2" size={16} color="#E74C3C" />
                  </Pressable>
                </View>
              );
            })}

            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  Rs. {cartTotal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shipping</Text>
                <Text style={[styles.summaryValue, { color: shipping === 0 ? Colors.successGreen : theme.text }]}>
                  {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
                </Text>
              </View>
              {shipping > 0 && (
                <Text style={[styles.freeShippingHint, { color: theme.textSecondary }]}>
                  Add Rs. {(5000 - cartTotal).toLocaleString()} more for free shipping
                </Text>
              )}
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.checkoutBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 8 }]}>
            <View style={styles.checkoutTotal}>
              <Text style={[styles.checkoutTotalLabel, { color: theme.textSecondary }]}>Total</Text>
              <Text style={styles.checkoutTotalValue}>Rs. {total.toLocaleString()}</Text>
            </View>
            <Pressable
              style={styles.checkoutButton}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/checkout");
              }}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={18} color={Colors.charcoal} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  itemCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  shopButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  cartItem: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    gap: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 90,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  variantRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  variantTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  variantText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  priceQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.gold,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    minWidth: 24,
    textAlign: "center",
  },
  removeBtn: {
    padding: 4,
    alignSelf: "flex-start",
  },
  summaryCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  summaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  freeShippingHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.gold,
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  checkoutTotal: { gap: 2 },
  checkoutTotalLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  checkoutTotalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.gold,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.charcoal,
  },
});
