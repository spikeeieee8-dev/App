import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { requestNotificationPermission } from "@/services/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="auth/register" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="product/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="checkout" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="order-success" options={{ animation: "fade" }} />
      <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="account/edit" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="admin/index" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="admin/login" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="admin/products" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="admin/orders" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="admin/users" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      requestNotificationPermission();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <StatusBar style="auto" />
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
