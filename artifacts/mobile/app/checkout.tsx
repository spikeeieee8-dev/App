import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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

const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "Islamabad (ICT)",
  "Gilgit-Baltistan",
  "AJK",
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Punjab: ["Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Sialkot", "Bahawalpur"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah"],
  KPK: ["Peshawar", "Abbottabad", "Mardan", "Swat", "Kohat"],
  Balochistan: ["Quetta", "Gwadar", "Turbat", "Khuzdar"],
  "Islamabad (ICT)": ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  AJK: ["Muzaffarabad", "Mirpur"],
};

const PAYMENT_METHODS = [
  { id: "easypaid", label: "EasyPaisa", icon: "smartphone", color: "#6DC067" },
  { id: "jazzcash", label: "JazzCash", icon: "credit-card", color: "#E92427" },
  { id: "cod", label: "Cash on Delivery", icon: "dollar-sign", color: Colors.gold },
];

export default function CheckoutScreen() {
  const { cart, cartTotal, placeOrder, clearCart, isDarkMode } = useApp();
  const colorScheme = useColorScheme();
  const isDark = isDarkMode || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showProvinces, setShowProvinces] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"easypaid" | "jazzcash" | "cod">("cod");
  const [paymentProofUri, setPaymentProofUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shipping = cartTotal >= 5000 ? 0 : 250;
  const total = cartTotal + shipping;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!phone.trim() || phone.length < 10) errs.phone = "Valid phone number required";
    if (!address.trim()) errs.address = "Address is required";
    if (!selectedProvince) errs.province = "Please select province";
    if (!selectedCity) errs.city = "Please select city";
    if ((paymentMethod === "easypaid" || paymentMethod === "jazzcash") && !paymentProofUri) {
      errs.paymentProof = "Payment proof screenshot required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPaymentProofUri(result.assets[0].uri);
      setErrors((e) => ({ ...e, paymentProof: "" }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const order = await placeOrder({
        items: cart,
        subtotal: cartTotal,
        shippingCost: shipping,
        total,
        status: paymentMethod === "cod" ? "pending" : "awaiting_verification",
        paymentMethod,
        paymentProofUri,
        address: { name, phone, address, city: selectedCity, province: selectedProvince },
      });
      clearCart();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/order-success", params: { orderId: order.id } });
    } catch {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, error, keyboardType }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => { onChange(t); setErrors((e) => ({ ...e, [label.toLowerCase()]: "" })); }}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        style={[
          styles.textInput,
          {
            backgroundColor: theme.backgroundSecondary,
            borderColor: error ? Colors.errorRed : theme.border,
            color: theme.text,
            fontFamily: "Inter_400Regular",
          },
        ]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Address</Text>

          <InputField label="Full Name" value={name} onChange={setName} placeholder="Muhammad Ali" error={errors.name} />
          <InputField label="Phone" value={phone} onChange={setPhone} placeholder="03XX-XXXXXXX" keyboardType="phone-pad" error={errors.phone} />
          <InputField label="Address" value={address} onChange={setAddress} placeholder="House #, Street, Area" error={errors.address} />

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Province</Text>
            <Pressable
              style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: errors.province ? Colors.errorRed : theme.border }]}
              onPress={() => { setShowProvinces(!showProvinces); setShowCities(false); }}
            >
              <Text style={[styles.dropdownText, { color: selectedProvince ? theme.text : theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {selectedProvince || "Select Province"}
              </Text>
              <Feather name={showProvinces ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
            </Pressable>
            {errors.province ? <Text style={styles.fieldError}>{errors.province}</Text> : null}
            {showProvinces && (
              <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {PROVINCES.map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                    onPress={() => { setSelectedProvince(p); setSelectedCity(""); setShowProvinces(false); }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: selectedProvince === p ? Colors.gold : theme.text, fontFamily: selectedProvince === p ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>City</Text>
            <Pressable
              style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: errors.city ? Colors.errorRed : theme.border, opacity: selectedProvince ? 1 : 0.5 }]}
              onPress={() => { if (!selectedProvince) return; setShowCities(!showCities); setShowProvinces(false); }}
            >
              <Text style={[styles.dropdownText, { color: selectedCity ? theme.text : theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {selectedCity || (selectedProvince ? "Select City" : "Select Province first")}
              </Text>
              <Feather name={showCities ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
            </Pressable>
            {errors.city ? <Text style={styles.fieldError}>{errors.city}</Text> : null}
            {showCities && selectedProvince && (
              <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {(CITIES_BY_PROVINCE[selectedProvince] ?? []).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                    onPress={() => { setSelectedCity(c); setShowCities(false); }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: selectedCity === c ? Colors.gold : theme.text, fontFamily: selectedCity === c ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Method</Text>
          {PAYMENT_METHODS.map((pm) => (
            <Pressable
              key={pm.id}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === pm.id ? pm.color + "12" : theme.backgroundSecondary,
                  borderColor: paymentMethod === pm.id ? pm.color : theme.border,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setPaymentMethod(pm.id as any);
              }}
            >
              <View style={[styles.paymentIcon, { backgroundColor: pm.color + "20" }]}>
                <Feather name={pm.icon as any} size={18} color={pm.color} />
              </View>
              <Text style={[styles.paymentLabel, { color: paymentMethod === pm.id ? pm.color : theme.text, fontFamily: paymentMethod === pm.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {pm.label}
              </Text>
              {paymentMethod === pm.id && (
                <View style={[styles.selectedCheck, { backgroundColor: pm.color }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {(paymentMethod === "easypaid" || paymentMethod === "jazzcash") && (
          <View style={[styles.walletSection, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.walletTitle, { color: theme.text }]}>
              {paymentMethod === "easypaid" ? "EasyPaisa" : "JazzCash"} Payment
            </Text>
            <View style={[styles.accountBox, { backgroundColor: theme.card, borderColor: Colors.gold + "40" }]}>
              <Feather name="smartphone" size={18} color={Colors.gold} />
              <View>
                <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Send payment to:</Text>
                <Text style={[styles.accountNumber, { color: theme.text }]}>0300-1234567</Text>
                <Text style={[styles.accountName, { color: Colors.gold }]}>Almera Official</Text>
              </View>
            </View>

            <Pressable
              style={[styles.uploadProofBtn, { borderColor: errors.paymentProof ? Colors.errorRed : Colors.gold, backgroundColor: paymentProofUri ? Colors.gold + "10" : "transparent" }]}
              onPress={handlePickImage}
            >
              {paymentProofUri ? (
                <>
                  <Image source={{ uri: paymentProofUri }} style={styles.proofPreview} />
                  <View style={styles.proofOverlay}>
                    <Feather name="check-circle" size={20} color={Colors.successGreen} />
                    <Text style={[styles.proofText, { color: Colors.successGreen }]}>Proof Uploaded</Text>
                  </View>
                </>
              ) : (
                <View style={styles.uploadContent}>
                  <Feather name="upload" size={24} color={Colors.gold} />
                  <Text style={[styles.uploadText, { color: Colors.gold }]}>Upload Payment Proof</Text>
                  <Text style={[styles.uploadSubtext, { color: theme.textSecondary }]}>
                    Screenshot of your payment confirmation
                  </Text>
                </View>
              )}
            </Pressable>
            {errors.paymentProof ? <Text style={styles.fieldError}>{errors.paymentProof}</Text> : null}
          </View>
        )}

        <View style={[styles.orderSummary, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>
          {cart.map((item) => (
            <View key={`${item.product.id}-${item.size}-${item.color}`} style={styles.summaryItem}>
              <Text style={[styles.summaryItemName, { color: theme.text }]} numberOfLines={1}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={[styles.summaryItemPrice, { color: theme.text }]}>
                Rs. {(item.product.discountedPrice * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: shipping === 0 ? Colors.successGreen : theme.text }]}>
              {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 8 }]}>
        <Pressable
          style={[styles.placeOrderBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.charcoal} />
          ) : (
            <>
              <Feather name="check-circle" size={18} color={Colors.charcoal} />
              <Text style={styles.placeOrderText}>
                Place Order · Rs. {total.toLocaleString()}
              </Text>
            </>
          )}
        </Pressable>
      </View>
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
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldError: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.errorRed,
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 15 },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: { fontSize: 14 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: { flex: 1, fontSize: 15 },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  walletSection: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  walletTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 12,
  },
  accountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  accountLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 2,
  },
  accountNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  accountName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  uploadProofBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    minHeight: 100,
    overflow: "hidden",
  },
  uploadContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  uploadText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  uploadSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  proofPreview: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  proofOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  proofText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  orderSummary: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  summaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryItemName: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  summaryItemPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  summaryDivider: { height: 1, marginVertical: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  placeOrderText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.charcoal,
  },
});
