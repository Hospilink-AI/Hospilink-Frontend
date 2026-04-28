import { Ionicons } from "@expo/vector-icons";
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
import { router, useLocalSearchParams } from "expo-router";
import { authAPI } from "../../service/api";

interface ResetErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPasswordScreen() {
  // The reset link sent to email will contain the token as a query param
  // e.g. https://yourapp.com/auth/reset-password?token=2e3f69529c...
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
      // API: POST /api/auth/reset-password
      // Body: { token, newPassword, confirmPassword }
      // Returns: { success: true, message: "Password reset successful. Please sign in with your new password." }
      await authAPI.resetPassword(token, newPassword, confirmPassword)
      setSuccess(true);

      // Redirect to sign-in after a short delay so user sees success message
      setTimeout(() => {
        router.replace("/auth/login");
      }, 2000);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong. The reset link may have expired.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Main Card */}
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#2563EB" />
            </View>

            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong new password for your HospiLink account.
            </Text>

            {/* Success State */}
            {success ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>
                  Password reset successful! Redirecting you to sign in...
                </Text>
              </View>
            ) : null}

            {/* General Error */}
            {errors.general ? (
              <View style={styles.generalError}>
                <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={[styles.passwordContainer, errors.newPassword ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="••••••••"
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
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? (
                <View style={styles.errorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                </View>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.passwordContainer, errors.confirmPassword ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <View style={styles.errorRow}>
                  <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              ) : null}
            </View>

            {/* Password Rules Hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>Password must be at least 6 characters and include uppercase, lowercase & a number.</Text>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetBtn, (loading || success) && { opacity: 0.7 }]}
              onPress={handleReset}
              activeOpacity={0.8}
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
            <Text style={styles.footerCopy}>© 2026 HospiLink Medical Systems. All rights reserved.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 440,
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 24,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },
  generalError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  generalErrorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fff5f5",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#1F2937",
  },
  eyeIcon: {
    paddingLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11.5,
    fontWeight: "500",
    flex: 1,
  },
  hintBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hintText: {
    fontSize: 11.5,
    color: "#6B7280",
    lineHeight: 17,
  },
  resetBtn: {
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" } as any,
      default: {
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerSecure: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  footerCopy: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});