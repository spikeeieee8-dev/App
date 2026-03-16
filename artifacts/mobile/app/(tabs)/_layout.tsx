import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const NativeModules = isIOS
  ? (() => {
      const nativeTabs = require("expo-router/unstable-native-tabs");
      const symbols = require("expo-symbols");
      return { NativeTabs: nativeTabs.NativeTabs, Icon: nativeTabs.Icon, Label: nativeTabs.Label, SymbolView: symbols.SymbolView };
    })()
  : { NativeTabs: null, Icon: null, Label: null, SymbolView: null };

const { NativeTabs, Icon, Label, SymbolView } = NativeModules;

function TabIcon({ sf, feather, color }: { sf: string; feather: string; color: string }) {
  if (isIOS && SymbolView) {
    return <SymbolView name={sf} tintColor={color} size={22} />;
  }
  return <Feather name={feather as any} size={20} color={color} />;
}

function NativeTabLayout() {
  const { cartCount } = useApp();
  if (!NativeTabs || !Icon || !Label) return <ClassicTabLayout />;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Shop</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon sf={{ default: "cart", selected: "cart.fill" }} />
        <Label>Cart</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const { isDarkMode } = useApp();
  const isDark = isDarkMode || colorScheme === "dark";
  const safeAreaInsets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : theme.card,
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon sf="house" feather="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <TabIcon sf="bag" feather="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <TabIcon sf="cart" feather="shopping-cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <TabIcon sf="shippingbox" feather="package" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon sf="person" feather="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isIOS && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
