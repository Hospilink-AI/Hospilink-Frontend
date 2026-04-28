import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authAPI } from "../../service/api";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendResetLink = async () => {
    // Validate
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
      // API returns: { success: true, message: "If this email is registered, a reset link has been sent." }
      setSuccessMessage(
        res.message || "If this email is registered, a reset link has been sent."
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Something went wrong. Please try again.";
      setEmailError(message);
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#374151" />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Ionicons name="lock-open-outline" size={26} color="#2563EB" />
            </View>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address and we'll send you a link to reset your password.
            </Text>

            {/* Success Banner */}
            {successMessage ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputRow, emailError ? styles.inputRowError : null]}>
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={emailError ? "#dc2626" : "#94a3b8"}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="abc@hospital.com"
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
                  <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              ) : null}
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendBtn, loading && { opacity: 0.7 }]}
              onPress={handleSendResetLink}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send Reset Link</Text>
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 6,
    paddingHorizontal: 2,
    maxWidth: 440,
    width: "100%",
  },
  backText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 6,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
  },
  inputRowError: {
    borderColor: "#dc2626",
    backgroundColor: "#fff5f5",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    height: "100%",
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
  sendBtn: {
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
  sendBtnText: {
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