import { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { adminLandingRoute } from "@/constant/adminCapabilities";
import { useAuth } from "@/context/AuthContext";
import { adminAPI, authAPI } from "@/service/api";
import { storeSession } from "@/service/landing";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Icon from "@/ds/Icon";
import OtpInput from "@/ds/OtpInput";
import { Notice } from "@/ds/States";
import Txt from "@/ds/Txt";
import { color } from "@/ds/tokens";

const RESEND_SECONDS = 45;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function VerifyOtp() {
  const router = useRouter();
  const { setSession } = useAuth();
  const params = useLocalSearchParams();
  const email = one(params.email as any);
  const accountType = one(params.accountType as any);
  const signupName = one(params.signupName as any);
  const isAdmin = one(params.userType as any) === "admin";

  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setTimer(RESEND_SECONDS);
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => setTimer((t) => (t <= 1 ? (clearInterval(tick.current!), 0) : t - 1)), 1000);
  };
  useEffect(() => {
    startTimer();
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  const afterVerify = () => {
    if (accountType === "hospital") {
      // hospitals keep their own onboarding
      if (Platform.OS === "web") router.replace({ pathname: "/auth/welcome-choice", params: { email, signupName, accountType } });
      else router.replace({ pathname: "/auth/onboardingH", params: { prefillName: signupName, prefillEmail: email } });
      return;
    }
    router.replace({ pathname: "/profile/medical-staff", params: { prefillName: signupName, prefillEmail: email } });
  };

  const verify = async (v = code) => {
    if (v.length < 6) {
      setState("error");
      setError("Enter all 6 digits.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = isAdmin ? await adminAPI.verifyOTP(email, v) : await authAPI.verifyOTP(email, v);
      if (r?.success === false) {
        setState("error");
        setError(r.message ?? "Verification failed. Please try again.");
        setCode("");
        return;
      }
      if (r?.token) {
        await storeSession(r.token, r.user);
        setSession(r.token, r.user);
      }
      setState("success");
      if (isAdmin) router.replace(adminLandingRoute(r?.user?.adminSubRole) as any);
      else afterVerify();
    } catch (err: any) {
      const m: string = err?.response?.data?.message ?? err?.response?.data?.error ?? "";
      const low = m.toLowerCase();
      setState("error");
      setError(
        low.includes("invalid") && low.includes("expired")
          ? "That OTP is wrong or has expired. Check it, or request a new one."
          : low.includes("expired")
            ? "Your OTP has expired. Please request a new one."
            : low.includes("invalid") || low.includes("incorrect")
              ? "Invalid OTP. Please check and try again."
              : m || "Verification failed. Please try again."
      );
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (timer > 0) return;
    setError(null);
    setInfo(null);
    try {
      if (isAdmin) await adminAPI.resendOTP(email);
      else await authAPI.resendOTP(email);
      setInfo("A new OTP has been sent to your email.");
      setCode("");
      setState("idle");
      startTimer();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <AuthLayout
      back
      title="Check your email"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : "We sent a 6-digit code to your email."}
      testID="verify-otp"
      footer={<Button label="Verify" onPress={() => verify()} loading={loading} disabled={code.length !== 6} full size="lg" />}
    >
      <View style={{ paddingVertical: 8 }}>
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (state !== "idle") setState("idle");
            setError(null);
          }}
          onComplete={verify}
          state={state}
          autoFocus
          label="Email code"
        />
      </View>
      {error ? <Notice tone="danger" body={error} /> : null}
      {info ? <Notice tone="success" body={info} /> : null}
      <View style={{ alignItems: "center", gap: 4 }}>
        {timer > 0 ? (
          <Txt v="bodySm" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
            Didn't get it? You can resend in 0:{String(timer).padStart(2, "0")}
          </Txt>
        ) : (
          <Button label="Resend code" variant="text" onPress={resend} />
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <Icon name="info" size={16} color={color.inkMuted} />
        <Txt v="caption" tone="muted" style={{ flex: 1 }}>
          Check your spam or promotions folder if it isn't in your inbox.
        </Txt>
      </View>
    </AuthLayout>
  );
}
