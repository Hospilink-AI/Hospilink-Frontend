import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { authAPI, adminAPI } from "../../service/api";
import { useAuth } from '@/context/AuthContext';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputs = useRef<(TextInput | null)[]>([]);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const { setSession } = useAuth();

  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : (params.email as string) ?? "";
  const accountType = Array.isArray(params.accountType) ? params.accountType[0] : (params.accountType as string) ?? "";

  // ── NEW: carry signupName through so profile screen can pre-fill fullName ──
  const signupName = Array.isArray(params.signupName) ? params.signupName[0] : (params.signupName as string) ?? "";

  // ── detect admin flow ──────────────────────────────────────────────
  const userType = Array.isArray(params.userType) ? params.userType[0] : (params.userType as string) ?? "";
  const isAdmin = userType === "admin";

  const isMobile = width <= 600;
  const cardWidth = isMobile ? width - 32 : Math.min(width * 0.88, 400);
  const otpBoxSize = Math.floor((cardWidth - 64 - 5 * 10) / 6);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(45);
    setCanResend(false);
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

  // const handleVerify = async () => {
  //   const otpCode = otp.join("");
  //   if (otpCode.length < 6) {
  //     Alert.alert("Incomplete OTP", "Please enter all 6 digits.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     // ── ADMIN flow ────────────────────────────────────────────────────
  //     if (isAdmin) {
  //       const response = await adminAPI.verifyOTP(email, otpCode);

  //       if (response?.token) {
  //         if (Platform.OS === "web") {
  //           localStorage.setItem("hospilink_token", response.token);
  //           localStorage.setItem("hospilink_user", JSON.stringify(response.user));
  //         } else {
  //           await AsyncStorage.setItem("hospilink_token", response.token);
  //           await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
  //         }
  //         setSession(response.token, response.user);
  //       }

  //       router.replace("/admin/dashboard");
  //       return;
  //     }

  //     // ── EXISTING flow (medical staff / hospital) ──────────────────────
  //     const response = await authAPI.verifyOTP(email, otpCode);

  //     if (response?.token) {
  //       if (Platform.OS === "web") {
  //         localStorage.setItem("hospilink_token", response.token);
  //         localStorage.setItem("hospilink_user", JSON.stringify(response.user));
  //       } else {
  //         await AsyncStorage.setItem("hospilink_token", response.token);
  //         await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
  //       }
  //       setSession(response.token, response.user);
  //     }

  //     router.replace({
  //       pathname: "/auth/welcome-choice",
  //       params: { email, signupName, accountType },
  //     });


  //     // // ── CHANGE: pass signupName so profile can pre-fill fullName ──
  //     // if (accountType === "medical") {
  //     //   router.replace({
  //     //     pathname: "/profile/medical-staff",
  //     //     params: {email, signupName },
  //     //   });
  //     // } else {
  //     //   router.replace({
  //     //     pathname: "/profile/hospital",
  //     //     params: {email, signupName },
  //     //   });
  //     // }

  //   } catch (error: any) {
  //     const message = error.response?.data?.message || "";

  //     if (message.toLowerCase().includes("expired")) {
  //       setOtpError("⏱ Your OTP has expired. Please request a new one.");
  //     } else if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("incorrect")) {
  //       setOtpError("✗ Invalid OTP. Please check and try again.");
  //     } else {
  //       setOtpError("Verification failed. Please try again.");
  //     }

  //     setOtp(["", "", "", "", "", ""]);
  //     inputs.current[0]?.focus();
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    // ← inline instead of Alert.alert
    if (otpCode.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    setOtpError(null);

    try {
      setLoading(true);

      // ── ADMIN flow ──
      if (isAdmin) {
        const response = await adminAPI.verifyOTP(email, otpCode);

        if (response?.success === false) {
          setOtpError(response.message ?? 'Verification failed. Please try again.');
          setOtp(['', '', '', '', '', '']);
          inputs.current[0]?.focus();
          return;
        }

        if (response?.token) {
          if (Platform.OS === 'web') {
            localStorage.setItem('hospilink_token', response.token);
            localStorage.setItem('hospilink_user', JSON.stringify(response.user));
          } else {
            await AsyncStorage.setItem('hospilink_token', response.token);
            await AsyncStorage.setItem('hospilink_user', JSON.stringify(response.user));
          }
          setSession(response.token, response.user);
        }
        router.replace('/admin/dashboard');
        return;
      }

      // ── STAFF / HOSPITAL flow ──
      const response = await authAPI.verifyOTP(email, otpCode);

      if (response?.success === false) {
        setOtpError(response.message ?? 'Verification failed. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
        return;
      }

      if (response?.token) {
        if (Platform.OS === 'web') {
          localStorage.setItem('hospilink_token', response.token);
          localStorage.setItem('hospilink_user', JSON.stringify(response.user));
        } else {
          await AsyncStorage.setItem('hospilink_token', response.token);
          await AsyncStorage.setItem('hospilink_user', JSON.stringify(response.user));
        }
        setSession(response.token, response.user);
      }

      router.replace({
        pathname: '/auth/welcome-choice',
        params: { email, signupName, accountType },
      });

    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        '';

      if (message.toLowerCase().includes('expired')) {
        setOtpError('⏱ Your OTP has expired. Please request a new one.');
      } else if (
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('incorrect')
      ) {
        setOtpError('✗ Invalid OTP. Please check and try again.');
      } else {
        setOtpError(message || 'Verification failed. Please try again.');
      }

      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };
  // const handleResend = async () => {
  //   if (!canResend) return;
  //   setOtpError(null);
  //   try {
  //     if (isAdmin) {
  //       await adminAPI.resendOTP(email);
  //     } else {
  //       await authAPI.resendOTP(email);
  //     }

  //     Alert.alert("Sent!", "A new OTP has been sent to your email.");
  //     setOtp(["", "", "", "", "", ""]);
  //     inputs.current[0]?.focus();
  //     startTimer();
  //   } catch (error: any) {
  //     Alert.alert(
  //       "Error",
  //       error.response?.data?.message || "Failed to resend OTP."
  //     );
  //   }
  // };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpError(null);
    setResendMessage('');

    try {
      if (isAdmin) {
        await adminAPI.resendOTP(email);
      } else {
        await authAPI.resendOTP(email);
      }

      setResendMessage('A new OTP has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      startTimer();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        'Failed to resend OTP. Please try again.';
      setOtpError(msg);                     // ← reuse same error box
    }
  };
  return (
    <View style={styles.outerContainer}>

      {/* ── TOP NAVBAR ── */}
      <View style={styles.navbar}>
        <View style={styles.navLogo}>
          <View style={styles.navLogoBox}>
            <Ionicons name="pulse" size={16} color="#fff" />
          </View>
          <Text style={styles.navLogoText}>HospiLink</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* ── CENTER CONTENT ── */}
      <ScrollView
        contentContainerStyle={styles.centerContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { width: cardWidth }]}>

          <View style={styles.iconWrapper}>
            <Ionicons name="shield-checkmark" size={28} color="#2563eb" />
          </View>

          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to your registered email
          </Text>

          <Text style={styles.email}>{email}</Text>

          {/* OTP Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
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
                ]}
                selectionColor="#2563eb"
              />
            ))}
          </View>

          {/* ── Inline error message ── */}
          {otpError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.errorText}>{otpError}</Text>
            </View>
          )}

          {/* Resend success message */}
          {resendMessage ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#f0fdf4', borderWidth: 1,
              borderColor: '#bbf7d0', borderRadius: 8,
              paddingVertical: 8, paddingHorizontal: 12,
              marginBottom: 16, width: '100%', gap: 6,
            }}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
              <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '500', flex: 1 }}>
                {resendMessage}
              </Text>
            </View>
          ) : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Account  →</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <View style={styles.resendRow}>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text style={[styles.resendLink, !canResend && { opacity: 0.4 }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
            {!canResend && (
              <Text style={styles.timer}>
                {"  "}Resend in 00:{String(timer).padStart(2, "0")}
              </Text>
            )}
          </View>

        </View>

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={11} color="#94a3b8" />
          <Text style={styles.secureText}>  SECURE END-TO-END ENCRYPTION</Text>
        </View>

      </ScrollView>

      <Text style={styles.footer}>
        © Developed and Managed by Rasika & Co.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#dce6f5" },
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#dde6f0", backgroundColor: "#ffffff" },
  navLogo: { flexDirection: "row", alignItems: "center" },
  navLogoBox: { width: 30, height: 30, backgroundColor: "#2563eb", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 8 },
  navLogoText: { color: "#0f172a", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  helpBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  centerContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, paddingVertical: 36 },
  card: { backgroundColor: "#ffffff", paddingVertical: 36, paddingHorizontal: 32, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#d0d9e8", ...Platform.select({ web: { boxShadow: "0 20px 50px rgba(100,140,200,0.18)" }, default: { shadowColor: "#90a8cc", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 20, elevation: 12 } }) },
  iconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 10, letterSpacing: 0.2 },
  subtitle: { color: "#94a3b8", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 4 },
  email: { color: "#2563eb", fontSize: 13, fontWeight: "600", marginBottom: 28 },
  otpContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", marginBottom: 24, gap: 10 },
  otpInput: { borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", textAlign: "center", fontSize: 20, fontWeight: "700", color: "#0f172a", backgroundColor: "#f8fafc" },
  otpInputFilled: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  button: { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 22, ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }, default: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 } }) },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  resendText: { color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  resendRow: { flexDirection: "row", alignItems: "center" },
  resendLink: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  timer: { color: "#94a3b8", fontSize: 13 },
  secureRow: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  secureText: { color: "#94a3b8", fontSize: 11, letterSpacing: 1.2 },
  footer: { textAlign: "center", color: "#c2cfe0", fontSize: 11, paddingBottom: 16, letterSpacing: 0.3, backgroundColor: "#dce6f5" },
  otpInputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fff5f5",
  },
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
    width: "100%",
    gap: 6,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },
});