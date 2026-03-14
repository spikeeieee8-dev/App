import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const { isDarkMode, setDarkMode, orders, wishlist, isDarkMode: dark, setHasSeenWelcome } = useApp();
  const colorScheme = useColorScheme();
  const isDark = dark || colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  type MenuItem = {
    icon: string;
    label: string;
    subtitle: string;
    onPress: () => void;
    isToggle?: boolean;
    isAdmin?: boolean;
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Shopping",
      items: [
        {
          icon: "package",
          label: "My Orders",
          subtitle: `${orders.length} orders`,
          onPress: () => router.push("/(tabs)/orders"),
        },
        {
          icon: "heart",
          label: "Wishlist",
          subtitle: `${wishlist.length} saved items`,
          onPress: () => {},
        },
        {
          icon: "map-pin",
          label: "Saved Addresses",
          subtitle: "Manage delivery addresses",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: "moon",
          label: "Dark Mode",
          subtitle: isDark ? "Currently dark" : "Currently light",
          onPress: () => {},
          isToggle: true,
        },
        {
          icon: "bell",
          label: "Notifications",
          subtitle: "Order updates & deals",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "message-circle",
          label: "WhatsApp Support",
          subtitle: "Chat with us",
          onPress: () => {},
        },
        {
          icon: "info",
          label: "About Almera",
          subtitle: "Version 1.0.0",
          onPress: () => {},
        },
        {
          icon: "refresh-cw",
          label: "Show Welcome Screen",
          subtitle: "View welcome experience again",
          onPress: () => {
            setHasSeenWelcome(false);
            router.replace("/");
          },
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          icon: "settings",
          label: "Admin Dashboard",
          subtitle: "Manage store",
          onPress: () => router.push("/admin" as any),
          isAdmin: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.charcoalMid }]}>
            <Feather name="user" size={32} color={Colors.gold} />
          </View>
          <View>
            <Text style={[styles.profileName, { color: theme.text }]}>Welcome, Guest</Text>
            <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
              Almera Premium Member
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { borderBottomColor: theme.border }]}>
          {[
            { value: orders.length, label: "Orders" },
            { value: wishlist.length, label: "Wishlist" },
            { value: orders.filter((o) => o.status === "delivered").length, label: "Delivered" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.gold }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    if (!item.isToggle) {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      item.onPress();
                    }
                  }}
                >
                  <View
                    style={[
                      styles.menuIcon,
                      {
                        backgroundColor: item.isAdmin
                          ? Colors.gold + "20"
                          : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon as any}
                      size={16}
                      color={item.isAdmin ? Colors.gold : theme.text}
                    />
                  </View>
                  <View style={styles.menuText}>
                    <Text
                      style={[
                        styles.menuLabel,
                        {
                          color: item.isAdmin ? Colors.gold : theme.text,
                          fontFamily: item.isAdmin ? "Inter_600SemiBold" : "Inter_500Medium",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {item.isToggle ? (
                    <Switch
                      value={isDarkMode}
                      onValueChange={(v) => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        setDarkMode(v);
                      }}
                      trackColor={{ false: theme.border, true: Colors.gold }}
                      thumbColor={isDarkMode ? Colors.charcoal : "#fff"}
                    />
                  ) : (
                    <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.brandFooter}>
          <Text style={[styles.brandName, { color: Colors.gold }]}>ALMERA</Text>
          <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
            Premium Fashion for Pakistan
          </Text>
        </View>
      </ScrollView>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 4,
  },
  profileSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  brandFooter: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  brandName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 6,
  },
  brandTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
