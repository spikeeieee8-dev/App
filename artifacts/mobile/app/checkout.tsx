import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect } from "react";
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
import { api } from "@/services/api";

const PROVINCES = [
  "Punjab", "Sindh", "KPK", "Balochistan",
  "Islamabad (ICT)", "Gilgit-Baltistan", "AJK",
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Punjab: [
    "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Sialkot",
    "Bahawalpur", "Sargodha", "Sheikhupura", "Jhang", "Rahim Yar Khan",
    "Gujrat", "Kasur", "Okara", "Sahiwal", "Chiniot", "Khushab", "Mandi Bahauddin",
    "Jhelum", "Attock", "Chakwal", "Khanewal", "Pakpattan", "Vehari",
    "Mianwali", "Lodhran", "Bhakkar", "Hafizabad", "Narowal", "Nankana Sahib",
    "Toba Tek Singh", "Muzaffargarh", "Layyah", "Rajanpur", "Dera Ghazi Khan",
    "Wazirabad", "Kamoke", "Muridke", "Chunian", "Sambrial",
  ],
  Sindh: [
    "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpurkhas",
    "Shikarpur", "Khairpur", "Jacobabad", "Dadu", "Thatta", "Badin",
    "Tando Adam", "Tando Allahyar", "Sanghar", "Umerkot", "Tharparkar",
    "Ghotki", "Kashmore", "Qambar Shahdadkot", "Matiari", "Jamshoro",
    "Korangi", "Landhi", "Malir", "Clifton",
  ],
  KPK: [
    "Peshawar", "Abbottabad", "Mardan", "Swat", "Kohat", "Mingora",
    "Nowshera", "Charsadda", "Bannu", "Dera Ismail Khan", "Haripur",
    "Mansehra", "Battagram", "Chitral", "Dir", "Buner", "Malakand",
    "Hangu", "Karak", "Lakki Marwat", "Tank", "Shangla", "Torghar",
    "Kohistan", "Swabi", "Timergara",
  ],
  Balochistan: [
    "Quetta", "Gwadar", "Turbat", "Khuzdar", "Hub", "Chaman", "Zhob",
    "Pishin", "Nushki", "Kalat", "Kharan", "Panjgur", "Dera Bugti",
    "Sibi", "Loralai", "Mastung", "Washuk", "Awaran", "Kech",
    "Musakhel", "Barkhan", "Sherani", "Harnai", "Ziarat",
  ],
  "Islamabad (ICT)": ["Islamabad"],
  "Gilgit-Baltistan": [
    "Gilgit", "Skardu", "Hunza", "Nagar", "Ghanche", "Shigar",
    "Astore", "Diamer", "Ghizer",
  ],
  AJK: [
    "Muzaffarabad", "Mirpur", "Rawalakot", "Bagh", "Kotli", "Bhimber",
    "Haveli", "Neelum", "Hattian Bala", "Jhelum Valley",
  ],
};

const PAYMENT_METHODS = [
  { id: "easypaisa", label: "Easypaisa", icon: "smartphone", color: "#6DC067" },
  { id: "cod", label: "Cash on Delivery", icon: "dollar-sign", color: Colors.gold },
];

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  theme: typeof Colors.light;
};

function InputField({ label, value, onChange, placeholder, error, keyboardType, theme }: InputFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        autoCorrect={false}
        blurOnSubmit={false}
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
}

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
  const [paymentMethod, setPaymentMethod] = useState<"easypaisa" | "cod">("cod");
  const [paymentProofUri, setPaymentProofUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [easypaisaNumber, setEasypaisaNumber] = useState("0300-1234567");
  const [easypaisaName, setEasypaisaName] = useState("Almera Official");
  const [easypaisaQrUrl, setEasypaisaQrUrl] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const shipping = cartTotal >= 5000 ? 0 : 250;
  const total = cartTotal + shipping;

  useEffect(() => {
    api.settings.getPublic()
      .then(({ settings }) => {
        if (settings["easypaisa_number"]) setEasypaisaNumber(settings["easypaisa_number"]);
        if (settings["easypaisa_name"]) setEasypaisaName(settings["easypaisa_name"]);
        if (settings["easypaisa_qr_url"]) setEasypaisaQrUrl(settings["easypaisa_qr_url"]);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!phone.trim() || phone.length < 10) errs.phone = "Valid phone number required";
    if (!address.trim()) errs.address = "Address is required";
    if (!selectedProvince) errs.province = "Please select province";
    if (!selectedCity) errs.city = "Please select city";
    if (paymentMethod === "easypaisa" && !paymentProofUri) {
      errs.paymentProof = "Payment proof screenshot is required";
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
      let proofUrl: string | undefined = undefined;
      if (paymentMethod === "easypaisa" && paymentProofUri) {
        try {
          const fileName = `proof_${Date.now()}.jpg`;
          const { url } = await api.upload.uploadProof(paymentProofUri, fileName, "image/jpeg");
          proofUrl = url;
        } catch {
          proofUrl = paymentProofUri;
        }
      }
      const order = await placeOrder({
        items: cart,
        subtotal: cartTotal,
        shippingCost: shipping,
        total,
        status: paymentMethod === "cod" ? "pending" : "awaiting_verification",
        paymentMethod,
        paymentProofUri: proofUrl,
        address: { name, phone, address, city: selectedCity, province: selectedProvince },
      });
      clearCart();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/order-success", params: { orderId: order.id } });
    } catch {
      setLoading(false);
    }
  };

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
        <View style={[styles.section, { borderBottomColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Address</Text>

          <InputField
            label="Full Name"
            value={name}
            onChange={(t) => { setName(t); setErrors((e) => ({ ...e, name: "" })); }}
            placeholder="Muhammad Ali"
            error={errors.name}
            theme={theme}
          />
          <InputField
            label="Phone"
            value={phone}
            onChange={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: "" })); }}
            placeholder="03XX-XXXXXXX"
            keyboardType="phone-pad"
            error={errors.phone}
            theme={theme}
          />
          <InputField
            label="Address"
            value={address}
            onChange={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: "" })); }}
            placeholder="House #, Street, Area"
            error={errors.address}
            theme={theme}
          />

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
                    onPress={() => { setSelectedProvince(p); setSelectedCity(""); setShowProvinces(false); setErrors((e) => ({ ...e, province: "" })); }}
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
                    onPress={() => { setSelectedCity(c); setShowCities(false); setErrors((e) => ({ ...e, city: "" })); }}
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

        <View style={[styles.section, { borderBottomColor: theme.backgroundSecondary }]}>
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

        {paymentMethod === "easypaisa" && (
          <View style={[styles.walletSection, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.walletTitle, { color: theme.text }]}>Easypaisa Payment</Text>

            <View style={[styles.accountBox, { backgroundColor: theme.card, borderColor: "#6DC067" + "40" }]}>
              <View style={[styles.accountIconBox, { backgroundColor: "#6DC067" + "20" }]}>
                <Feather name="smartphone" size={20} color="#6DC067" />
              </View>
              <View style={styles.accountDetails}>
                <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Send payment to:</Text>
                <Text style={[styles.accountNumber, { color: theme.text }]}>{easypaisaNumber}</Text>
                <Text style={[styles.accountName, { color: "#6DC067" }]}>{easypaisaName}</Text>
              </View>
            </View>

            {easypaisaQrUrl ? (
              <View style={styles.qrBox}>
                <Text style={[styles.qrLabel, { color: theme.textSecondary }]}>Or scan QR code:</Text>
                <View style={[styles.qrImageWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Image source={{ uri: easypaisaQrUrl }} style={styles.qrImage} resizeMode="contain" />
                </View>
              </View>
            ) : null}

            <Pressable
              style={[styles.uploadProofBtn, { borderColor: errors.paymentProof ? Colors.errorRed : "#6DC067", backgroundColor: paymentProofUri ? "#6DC067" + "10" : "transparent" }]}
              onPress={handlePickImage}
            >
              {paymentProofUri ? (
                <>
                  <Image source={{ uri: paymentProofUri }} style={styles.proofPreview} />
                  <View style={styles.proofOverlay}>
                    <Feather name="check-circle" size={20} color={Colors.successGreen} />
                    <Text style={[styles.proofText, { color: Colors.successGreen }]}>Proof Uploaded · Tap to change</Text>
                  </View>
                </>
              ) : (
                <View style={styles.uploadContent}>
                  <Feather name="upload" size={24} color="#6DC067" />
                  <Text style={[styles.uploadText, { color: "#6DC067" }]}>Upload Payment Screenshot</Text>
                  <Text style={[styles.uploadSubtext, { color: theme.textSecondary }]}>
                    Take a screenshot after sending payment and upload it here
                  </Text>
                </View>
              )}
            </Pressable>
            {errors.paymentProof ? <Text style={styles.fieldError}>{errors.paymentProof}</Text> : null}
          </View>
        )}

        {paymentMethod === "cod" && (
          <View style={[styles.codBox, { backgroundColor: Colors.gold + "0D", borderColor: Colors.gold + "40" }]}>
            <Feather name="package" size={20} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.codTitle, { color: theme.text }]}>Cash on Delivery</Text>
              <Text style={[styles.codDesc, { color: theme.textSecondary }]}>
                Pay when your order arrives at your door. No advance payment needed.
              </Text>
            </View>
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

      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 18 },
  section: { padding: 16, borderBottomWidth: 8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5,
    marginBottom: 6, textTransform: "uppercase",
  },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  fieldError: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.errorRed, marginTop: 4 },
  dropdown: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  dropdownText: { fontSize: 15 },
  dropdownList: {
    borderWidth: 1, borderRadius: 10, marginTop: 4, overflow: "hidden",
    zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
    maxHeight: 220,
  },
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  dropdownOptionText: { fontSize: 14 },
  paymentOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 10,
  },
  paymentIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  paymentLabel: { flex: 1, fontSize: 15 },
  selectedCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  walletSection: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  walletTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  accountBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  accountIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  accountDetails: { gap: 2 },
  accountLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  accountNumber: { fontFamily: "Inter_700Bold", fontSize: 20 },
  accountName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  qrBox: { alignItems: "center", gap: 8 },
  qrLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  qrImageWrap: { borderWidth: 1, borderRadius: 14, padding: 12 },
  qrImage: { width: 160, height: 160 },
  uploadProofBtn: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, minHeight: 100, overflow: "hidden" },
  uploadContent: { alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  uploadText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  uploadSubtext: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  proofPreview: { width: "100%", height: 150, resizeMode: "cover" },
  proofOverlay: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  proofText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  codBox: {
    margin: 16, borderRadius: 14, borderWidth: 1, padding: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  codTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  codDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  orderSummary: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 12 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryItemName: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, marginRight: 12 },
  summaryItemPrice: { fontFamily: "Inter_500Medium", fontSize: 13 },
  summaryDivider: { height: 1, marginVertical: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  summaryValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.gold },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  placeOrderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 14, gap: 10,
  },
  placeOrderText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal },
});
