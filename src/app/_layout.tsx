import { Stack } from "expo-router";
import { ActivityIndicator, Platform, View, useWindowDimensions } from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { InAppNotificationsProvider } from "@/context/InAppNotificationsContext";
import FlashHost from "@/component/common/FlashHost";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";

// Icon fonts load before the first screen. An icon that mounts before its font is ready draws
// nothing, and on a slow connection the browser's 6 s font check times out (blank icons and an
// error). Try a few times, then carry on regardless so the app never hangs here.
const ICON_FONTS = {
  ...Ionicons.font,
  ...Feather.font,
  ...MaterialIcons.font,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

function useIconFonts() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await Font.loadAsync(ICON_FONTS);
          break;
        } catch {
          // still downloading: the next try keeps waiting for the same font
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const iconsReady = useIconFonts();

  const isWeb = Platform.OS === "web";
  // Only cap the max-width on large desktop screens
  const isLargeScreen = isWeb && width > 1200;

  return (
    <SafeAreaProvider>
      <View
        style={{
          flex: 1,
          // the viewport on phones (430px), causing everything to overflow & clip.
          // Instead: full width always, optional max-width cap on large screens.
          width: "100%",
          maxWidth: isLargeScreen ? "100%" : "100%",
          alignSelf: "center",
          backgroundColor: "#dce6f5",   // match light theme page bg
        }}
      >
        {!iconsReady ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
        <AuthProvider>
          <SocketProvider>
            <InAppNotificationsProvider>
            <NotificationProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#dce6f5" },
                }}
              />
              <FlashHost />
            </NotificationProvider>
            </InAppNotificationsProvider>
          </SocketProvider>
        </AuthProvider>
        )}
      </View>
    </SafeAreaProvider>
  );
}
