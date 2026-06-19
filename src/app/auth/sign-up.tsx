import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { authAPI } from "../../service/api";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
  general?: string;
}

export default function SignUpScreen() {
  const router = useRouter();

  // Role chosen on the previous (welcome-choice) screen.
  const params = useLocalSearchParams();
  const accountType =
    (Array.isArray(params.accountType) ? params.accountType[0] : (params.accountType as string)) ||
    "medical";
  const isHospital = accountType === "hospital";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});

  // ─── SIGN UP (logic from AuthScreen.handleSignUp + terms gate) ───
  const handleSignUp = async () => {
    const errs: SignUpErrors = {};

    if (!name.trim()) errs.name = isHospital ? "Hospital name is required." : "Full name is required.";
    if (!email.trim()) errs.email = "Email address is required.";
    else if (!isValidEmail(email)) errs.email = "Please enter a valid email.";
    if (!password.trim()) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(password))
      errs.password = "Must include uppercase, lowercase & a number.";

    // New gate: must agree to terms before creating an account.
    if (!agreedToTerms) errs.terms = "Please agree to the Terms and Privacy Policy.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role: isHospital ? "hospital" : "staff",
      };

      const response = await authAPI.signup(payload);
      console.log("✅ Signup API response:", response);

      router.push({
        pathname: "/auth/verify-otp",
        params: { email: email.trim(), accountType, signupName: name.trim() },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Something went wrong. Please try again.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Create Your Account</Text>

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

        {/* Name */}
        <View style={styles.field}>
          <View style={[styles.underline, errors.name ? styles.underlineError : null]}>
            <TextInput
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              placeholder={isHospital ? "Hospital name" : "Full name"}
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <View style={[styles.underline, errors.email ? styles.underlineError : null]}>
            <TextInput
              style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              placeholder="Your email"
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

        {/* Password */}
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

        {/* Terms */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => {
            setAgreedToTerms((v) => !v);
            if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
            {agreedToTerms && <Ionicons name="checkmark" size={11} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsBold}>Terms</Text> and{" "}
            <Text style={styles.termsBold}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {errors.terms ? <Text style={[styles.errorText, { marginTop: 6 }]}>{errors.terms}</Text> : null}

        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Create */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Create an Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={styles.signinHint}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push({ pathname: "/auth/login", params: { tab: "signin" } })}>
            <Text style={styles.signinLink}>Sign In</Text>
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
    paddingTop: 64,
    paddingBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 40,
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
  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
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
  termsText: { color: "#6B7280", fontSize: 14, marginLeft: 8, flex: 1 },
  termsBold: { color: "#374151", fontWeight: "700" },
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
  signinRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signinHint: { color: "#6B7280", fontSize: 14 },
  signinLink: { color: BLUE, fontSize: 14, fontWeight: "700" },
});