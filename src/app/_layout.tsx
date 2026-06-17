import { Stack } from "expo-router";
import { Platform, View, useWindowDimensions } from "react-native";
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from "@/context/SocketContext";

export default function RootLayout() {
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  // Only cap the max-width on large desktop screens
  const isLargeScreen = isWeb && width > 1200;

  return (
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
      <SocketProvider>
        <AuthProvider>
          {/* <NotificationProvider> */}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#dce6f5" },
              }}
            />
          {/* </NotificationProvider> */}
        </AuthProvider>
      </SocketProvider>
    </View>
  );
}
