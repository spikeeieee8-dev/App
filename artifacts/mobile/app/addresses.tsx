import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function AddressesScreen() {
  const { isDarkMode, orders } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const usedAddresses = Array.from(
    new Map(
      orders.map((o) => [
        `${o.address.phone}`,
        o.address,
      ])
    ).values()
  ).slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Addresses</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {usedAddresses.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="map-pin" size={32} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No addresses yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Addresses from your orders will appear here for easy reuse during checkout.
            </Text>
            <Pressable
              style={[styles.shopBtn, { backgroundColor: Colors.gold }]}
              onPress={() => router.push("/(tabs)/shop" as any)}
            >
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FROM YOUR ORDERS</Text>
            {usedAddresses.map((addr, idx) => (
              <View key={idx} style={[styles.addressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.addrIcon, { backgroundColor: Colors.gold + "18" }]}>
                  <Feather name="map-pin" size={16} color={Colors.gold} />
                </View>
                <View style={styles.addrText}>
                  <Text style={[styles.addrName, { color: theme.text }]}>{addr.name}</Text>
                  <Text style={[styles.addrLine, { color: theme.textSecondary }]}>{addr.address}</Text>
                  <Text style={[styles.addrLine, { color: theme.textSecondary }]}>{addr.city}, {addr.province}</Text>
                  <Text style={[styles.addrPhone, { color: theme.textSecondary }]}>{addr.phone}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              These addresses are pulled from your order history. Full address management with saved profiles is coming soon.
            </Text>
          </>
        )}
      </ScrollView>
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
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 },
  shopBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  shopBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.charcoal },
  sectionLabel: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1.5, marginBottom: 10,
  },
  addressCard: {
    flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 10,
  },
  addrIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  addrText: { flex: 1, gap: 2 },
  addrName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  addrLine: { fontFamily: "Inter_400Regular", fontSize: 13 },
  addrPhone: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 16 },
});
