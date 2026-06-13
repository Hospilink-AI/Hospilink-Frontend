import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI, profileAPI } from "../../service/api";
import { useAuth } from "@/context/AuthContext";

// ─── Validation helper (same as elsewhere) ─────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface SignInErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});

  // ─── SIGN IN (logic copied verbatim from AuthScreen.handleSignIn) ───
  const handleSignIn = async () => {
    const errs: SignInErrors = {};

    if (!email.trim()) errs.email = "Email address is required.";
    else if (!isValidEmail(email)) errs.email = "Please enter a valid email.";
    if (!password.trim()) errs.password = "Password is required.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authAPI.signin(email, password);
      console.log("✅ Signin response:", response);

      if (!response.success && !response.token) {
        setErrors({ general: response.message ?? "Invalid email or password." });
        return;
      }

      if (Platform.OS === "web") {
        localStorage.setItem("hospilink_token", response.token);
        localStorage.setItem("hospilink_user", JSON.stringify(response.user));
      } else {
        await AsyncStorage.setItem("hospilink_token", response.token);
        await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
      }

      setSession(response.token, response.user);

      const role = response.user?.role;

      if (!response.user?.isEmailVerified) {
        router.replace({
          pathname: "/auth/verify-otp",
          params: {
            email: response.user?.email,
            accountType: role === "staff" ? "medical" : "hospital",
          },
        });
        return;
      }

      let profileComplete = false;
      let documentsUploaded = false;
      let profileName = "";
      let profileEmail = "";

      try {
        const profileRes = await profileAPI.getMyProfile();
        profileComplete =
          profileRes?.isProfileComplete ?? profileRes?.profile?.isProfileComplete ?? false;
        documentsUploaded =
          profileRes?.isDocumentsUploaded ?? profileRes?.profile?.isDocumentsUploaded ?? false;
        profileName =
          profileRes?.profile?.fullName ?? profileRes?.user?.name ?? response.user?.name ?? "";
        profileEmail =
          profileRes?.profile?.email ?? profileRes?.user?.email ?? response.user?.email ?? "";
      } catch (e) {
        console.warn("⚠️ Could not fetch profile, defaulting to setup screen");
        profileName = response.user?.name ?? "";
        profileEmail = response.user?.email ?? "";
        profileComplete = false;
      }

      if (role === "staff") {
        if (!profileComplete) {
          router.replace({
            pathname: "/profile/medical-staff",
            params: { prefillName: profileName, prefillEmail: profileEmail },
          });
        } else if (!documentsUploaded) {
          router.replace("/profile/document-upload");
        } else {
          router.replace("/medicalStaff/dashboard");
        }
      } else if (role === "hospital") {
        if (!profileComplete) {
          router.replace({
            pathname: "/profile/hospital",
            params: { prefillName: profileName, prefillEmail: profileEmail },
          });
        } else if (!documentsUploaded) {
          router.replace("/profile/upload-document");
        } else {
          router.replace("/hospital/dashboard");
        }
      } else {
        router.replace("/profile/medical-staff");
      }
    } catch (error: any) {
      console.error("❌ Signin error:", error?.response?.data);
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Invalid email or password.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot password: pass typed email so the next screen can prefill ───
  const goToForgotPassword = () => {
    router.push({
      pathname: "/auth/forgot-password",
      params: { email: email.trim() },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <Text style={styles.brand}>HOSPILINK</Text>

        {/* General error */}
        {errors.general ? (
          <View style={styles.generalError}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color="#dc2626"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* Email (underline) */}
        <View style={styles.field}>
          <View style={[styles.underline, errors.email ? styles.underlineError : null]}>
            <TextInput
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Password (underline) */}
        <View style={styles.field}>
          <View style={[styles.underline, errors.password ? styles.underlineError : null]}>
            <TextInput
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Remember + Forgot */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.rememberLeft} onPress={() => setRememberMe((v) => !v)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Ionicons name="checkmark" size={11} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToForgotPassword}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* Sign In */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>Don't have account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/role-choice")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 28,
  },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: BLUE,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 56,
  },
  field: { marginBottom: 22 },
  underline: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 8,
  },
  underlineError: { borderBottomColor: "#dc2626" },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 4 },
  errorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", marginTop: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  rememberLeft: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: { backgroundColor: BLUE, borderColor: BLUE },
  rememberText: { color: "#6B7280", fontSize: 14, marginLeft: 8 },
  forgot: { color: BLUE, fontSize: 14, fontWeight: "600" },
  generalError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    marginBottom: 18,
  },
  generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },
  primaryButton: {
    backgroundColor: BLUE,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signupHint: { color: "#6B7280", fontSize: 14 },
  signupLink: { color: BLUE, fontSize: 14, fontWeight: "700" },
});