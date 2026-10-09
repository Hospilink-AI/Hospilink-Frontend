import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { resolveLanding } from "@/service/landing";
import { goToSignedOutStart } from "@/service/marketing";
import { Mark } from "@/ds/brand/Brand";
import { color } from "@/ds/tokens";

export default function Index() {
  const router = useRouter();
  const { isLoading, token, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      goToSignedOutStart(router);
      return;
    }
    let alive = true;
    resolveLanding(user)
      .then((to) => alive && router.replace(to as any))
      .catch(() => alive && router.replace("/auth/login?tab=signin" as any));
    return () => {
      alive = false;
    };
  }, [isLoading, token, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.ground, gap: 20 }}>
      <Mark size={56} />
      <ActivityIndicator color={color.primary} />
    </View>
  );
}
