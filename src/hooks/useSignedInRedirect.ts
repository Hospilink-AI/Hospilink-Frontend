import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { resolveLanding } from "@/service/landing";

// Signed-out pages (marketing home, sign in, sign up): a doctor who is already signed in goes straight to the app.
export function useSignedInRedirect() {
  const router = useRouter();
  const { isLoading, token, user } = useAuth();
  useEffect(() => {
    if (isLoading || !token || user?.role !== "staff" || !user?.isEmailVerified) return;
    let alive = true;
    resolveLanding(user)
      .then((to) => alive && router.replace(to as any))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isLoading, token, user, router]);
}
