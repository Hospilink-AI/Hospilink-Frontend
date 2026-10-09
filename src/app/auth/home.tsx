import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { resolveLanding } from "@/service/landing";
import { goToSignedOutStart } from "@/service/marketing";
import { Mark } from "@/ds/brand/Brand";
import { color } from "@/ds/tokens";

// The old in-app home page. The public site replaced it, so old links follow the signed-out start rule
// (the site on the web, role choice in the apps); a signed-in visitor goes to their own landing.
export default function OldHome() {
  const router = useRouter();
  const { isLoading, token, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) return goToSignedOutStart(router);
    resolveLanding(user)
      .then((to) => router.replace(to as any))
      .catch(() => goToSignedOutStart(router));
  }, [isLoading, token, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.ground, gap: 20 }}>
      <Mark size={56} />
      <ActivityIndicator color={color.primary} />
    </View>
  );
}
