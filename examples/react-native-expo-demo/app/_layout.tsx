import "../polyfills";

import { useReactiveClient } from "@dynamic-labs/react-hooks";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import LoadingScreen from "@/components/login/LoadingScreen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { dynamicClient } from "@/lib/dynamic";

export const unstable_settings = {
  initialRouteName: "login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const client = useReactiveClient(dynamicClient);
  const router = useRouter();
  const segments = useSegments();

  const realIsAuthenticated = !!client.auth.authenticatedUser;

  // Use real authentication check
  const isAuthenticated = realIsAuthenticated;

  // Track if this is the initial mount and loading state
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check if auth is ready
  useEffect(() => {
    // Give a brief moment for the client to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Skip navigation on initial mount or while loading
    if (isInitialMount || isLoading) {
      setIsInitialMount(false);
      return;
    }

    // Only navigate after initial mount and loading is complete
    const inAuthGroup = segments[0] === "(tabs)";

    if (isAuthenticated && !inAuthGroup) {
      // Redirect to tabs if authenticated and not already in tabs
      router.replace("/(tabs)");
    } else if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated and in tabs
      router.replace("/login");
    }
  }, [isAuthenticated, segments, router, isInitialMount, isLoading]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen text="Loading..." />;
  }

  return (
    <>
      <dynamicClient.reactNative.WebView />
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </>
  );
}
