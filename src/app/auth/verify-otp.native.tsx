import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {adminAPI , authAPI  } from "../../service/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(25);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputs = useRef<(TextInput | null)[]>([]);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const { setSession } = useAuth();

  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : (params.email as string) ?? "";
  const accountType = Array.isArray(params.accountType)
    ? params.accountType[0]
    : (params.accountType as string) ?? "";
  const signupName = Array.isArray(params.signupName)
    ? params.signupName[0]
    : (params.signupName as string) ?? "";

  const userType = Array.isArray(params.userType)
    ? params.userType[0]
    : (params.userType as string) ?? "";
  const isAdmin = userType === "admin";

  const isMobile = width <= 600;
  const horizontalPadding = 28;
  const gap = 12;
  const otpBoxSize = Math.floor((Math.min(width, 520) - horizontalPadding * 2 - gap * 5) / 6);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(25);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (otpError) setOtpError(null);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ─── Route after successful verification, based on the role already chosen.
  //     (No welcome-choice hop: the role was selected before signup.) ───
  const routeAfterVerify = () => {
    if (accountType === "hospital") {
      router.replace({
        pathname: "/profile/hospital",
        params: { prefillName: signupName, prefillEmail: email },
      });
    } else {
      router.replace({
        // pathname: "/profile/medical-staff",
        pathname: "/auth/onboarding",
        params: { prefillName: signupName, prefillEmail: email },
      });
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setOtpError(null);

    try {
      setLoading(true);

      // ── ADMIN flow ──
      if (isAdmin) {
        const response = await adminAPI.verifyOTP(email, otpCode);

        if (response?.success === false) {
          setOtpError(response.message ?? "Verification failed. Please try again.");
          setOtp(["", "", "", "", "", ""]);
          inputs.current[0]?.focus();
          return;
        }

        if (response?.token) {
          if (Platform.OS === "web") {
            localStorage.setItem("hospilink_token", response.token);
            localStorage.setItem("hospilink_user", JSON.stringify(response.user));
          } else {
            await AsyncStorage.setItem("hospilink_token", response.token);
            await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
          }
          setSession(response.token, response.user);
        }
        router.replace("/admin/dashboard");
        return;
      }

      // ── STAFF / HOSPITAL flow ──
      const response = await authAPI.verifyOTP(email, otpCode);

      if (response?.success === false) {
        setOtpError(response.message ?? "Verification failed. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }

      if (response?.token) {
        if (Platform.OS === "web") {
          localStorage.setItem("hospilink_token", response.token);
          localStorage.setItem("hospilink_user", JSON.stringify(response.user));
        } else {
          await AsyncStorage.setItem("hospilink_token", response.token);
          await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
        }
        setSession(response.token, response.user);
      }

      routeAfterVerify();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "";

      if (message.toLowerCase().includes("expired")) {
        setOtpError("⏱ Your OTP has expired. Please request a new one.");
      } else if (
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("incorrect")
      ) {
        setOtpError("✗ Invalid OTP. Please check and try again.");
      } else {
        setOtpError(message || "Verification failed. Please try again.");
      }

      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpError(null);
    setResendMessage("");

    try {
      if (isAdmin) {
        await adminAPI.resendOTP(email);
      } else {
        await authAPI.resendOTP(email);
      }

      setResendMessage("A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      startTimer();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Failed to resend OTP. Please try again.";
      setOtpError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={22} color="#1F2937" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>Enter the code sent to your registered email</Text>

        {/* OTP boxes */}
        <View style={[styles.otpContainer, { gap }]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.otpInput,
                { width: otpBoxSize, height: otpBoxSize + 4 },
                digit ? styles.otpInputFilled : null,
                otpError ? styles.otpInputError : null,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              selectionColor="#2563eb"
            />
          ))}
        </View>

        {/* Inline error */}
        {otpError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color="#dc2626" />
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        ) : null}

        {/* Resend success */}
        {resendMessage ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
            <Text style={styles.successText}>{resendMessage}</Text>
          </View>
        ) : null}

        {/* Resend */}
        <Text style={styles.resendHint}>Didn't receive the code?</Text>
        <View style={styles.resendRow}>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text style={[styles.resendLink, !canResend && { opacity: 0.4 }]}>Resend OTP</Text>
          </TouchableOpacity>
          {!canResend && (
            <Text style={styles.timer}>
              {"  "}Resend in 00:{String(timer).padStart(2, "0")}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Verify button pinned at bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginLeft: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  otpInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  otpInputFilled: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  otpInputError: { borderColor: "#dc2626", backgroundColor: "#fff5f5" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 6,
  },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500", flexShrink: 1 },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 6,
  },
  successText: { color: "#16a34a", fontSize: 13, fontWeight: "500", flex: 1 },
  resendHint: { color: "#64748b", fontSize: 14, textAlign: "center", marginBottom: 6 },
  resendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  resendLink: { color: BLUE, fontSize: 15, fontWeight: "700" },
  timer: { color: "#64748b", fontSize: 15 },
  bottomBar: { paddingHorizontal: 28, paddingBottom: 24, paddingTop: 8 },
  button: {
    backgroundColor: BLUE,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});