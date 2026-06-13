import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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

interface ResetErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPasswordScreen() {
  // Reset link carries the token: /auth/reset-password?token=...
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [success, setSuccess] = useState(false);

  const validate = (): ResetErrors => {
    const errs: ResetErrors = {};

    if (!newPassword.trim()) {
      errs.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters.";
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(newPassword)) {
      errs.newPassword = "Must include uppercase, lowercase & a number.";
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  };

  const handleReset = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!token) {
      setErrors({ general: "Reset token is missing. Please use the link from your email." });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => {
        router.replace("/auth/login");
      }, 2000);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Something went wrong. The reset link may have expired.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Reset your Password</Text>

          {/* Success */}
          {success ? (
            <View style={styles.successBanner}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#16a34a"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.successText}>
                Password reset successful! Redirecting you to sign in...
              </Text>
            </View>
          ) : null}

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

          {/* New Password (underline) */}
          <View style={styles.field}>
            <View style={[styles.underline, errors.newPassword ? styles.underlineError : null]}>
              <TextInput
                style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }));
                }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword((s) => !s)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <View style={styles.errorRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            ) : null}
          </View>

          {/* Confirm Password (underline) */}
          <View style={styles.field}>
            <View
              style={[styles.underline, errors.confirmPassword ? styles.underlineError : null]}
            >
              <TextInput
                style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((s) => !s)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <View style={styles.errorRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            ) : null}
          </View>

          {/* Reset button */}
          <TouchableOpacity
            style={[styles.resetBtn, (loading || success) && { opacity: 0.7 }]}
            onPress={handleReset}
            activeOpacity={0.85}
            disabled={loading || success}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetBtnText}>Reset Password</Text>
            )}
          </TouchableOpacity>
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
  generalError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },
  field: { marginBottom: 24 },
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
  resetBtn: {
    backgroundColor: BLUE,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  resetBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", paddingBottom: 24, gap: 4 },
  footerSecure: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", letterSpacing: 0.5 },
  footerCopy: { fontSize: 11, color: "#9CA3AF" },
});