import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI } from "../../service/api";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ForgotPasswordScreen() {
  // Prefilled from the login screen instead of calling getMyProfile()
  // (the user is logged out here, so a profile fetch would just 401).
  const params = useLocalSearchParams();
  const initialEmail = Array.isArray(params.email)
    ? params.email[0]
    : (params.email as string) ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ─── Resend countdown (same pattern as the OTP screen) ───
  const [timer, setTimer] = useState(43);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(43);
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

  // ─── Send reset link (logic from the original ForgotPasswordScreen) ───
  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setEmailError("Email address is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError("");
    setLoading(true);
    setSuccessMessage("");

    try {
      const res = await authAPI.forgotPassword(email.trim());
      setSuccessMessage(
        res.message ?? "If this email is registered, a reset link has been sent."
      );
      startTimer(); // restart cooldown after a successful send
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Something went wrong. Please try again.";
      setEmailError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend || loading) return;
    handleSendResetLink();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.title}>Verify Your Email</Text>

          {/* Success banner */}
          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#16a34a"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Email (underline) */}
          <View style={[styles.underline, emailError ? styles.underlineError : null]}>
            <TextInput
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (emailError) setEmailError("");
                if (successMessage) setSuccessMessage("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {emailError ? (
            <View style={styles.errorRow}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color="#dc2626"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}

          {/* Send Link */}
          <TouchableOpacity
            style={[styles.sendBtn, loading && { opacity: 0.7 }]}
            onPress={handleSendResetLink}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send Link</Text>
            )}
          </TouchableOpacity>

          {/* Resend row */}
          <Text style={styles.resendHint}>Didn't receive the link?</Text>
          <View style={styles.resendRow}>
            <TouchableOpacity onPress={handleResend} disabled={!canResend || loading}>
              {/* This screen sends a LINK, not an OTP, so the label is "Resend Link". */}
              <Text style={[styles.resendLink, (!canResend || loading) && { opacity: 0.4 }]}>
                Resend Link
              </Text>
            </TouchableOpacity>
            {!canResend && (
              <Text style={styles.resendTimer}>
                {"  "}Resend in 00:{String(timer).padStart(2, "0")}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
          <Text style={styles.footerCopy}>
            © Developed and Managed by Rasika & Co.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 56 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 44,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successText: { color: "#16a34a", fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 },
  underline: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 8,
  },
  underlineError: { borderBottomColor: "#dc2626" },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  errorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },
  sendBtn: {
    backgroundColor: BLUE,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    marginBottom: 22,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendHint: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 6 },
  resendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  resendLink: { fontSize: 15, color: BLUE, fontWeight: "700" },
  resendTimer: { fontSize: 15, color: "#6B7280" },
  footer: { alignItems: "center", paddingBottom: 24, gap: 4 },
  footerSecure: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", letterSpacing: 0.5 },
  footerCopy: { fontSize: 11, color: "#9CA3AF" },
});