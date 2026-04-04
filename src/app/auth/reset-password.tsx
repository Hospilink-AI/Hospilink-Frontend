import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { authAPI } from "../../service/api";

const validatePassword = (p: string) => {
  if (!p.trim()) return "Password is required.";
  if (p.length < 6) return "At least 6 characters required.";
  if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(p))
    return "Must include uppercase, lowercase & a number.";
  return null;
};

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width > 768;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleReset = async () => {
    const pwErr = validatePassword(newPassword);
    if (pwErr) return setError(pwErr);
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    setError("");

    try {
      const res = await authAPI.resetPassword(token as string, newPassword);
      setSuccess(res.message);
      setTimeout(() => router.replace("/"), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Reset failed. Token may be expired.");
    } finally {
      setLoading(false);
    }
  };

  // ── MOBILE ────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <View style={styles.mobileRoot}>
        {/* Header */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.mobileHeaderTitle}>Reset Password</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Center content */}
        <View style={styles.mobileCenterContent}>
          {/* Logo */}
          <View style={styles.mobileLogoWrap}>
            <View style={styles.mobileLogoBox}>
              <Ionicons name="pulse" size={22} color="#fff" />
            </View>
            <Text style={styles.mobileLogoText}>HospiLink</Text>
          </View>

          <Text style={styles.mobileHeading}>Secure Your Account</Text>
          <Text style={styles.mobileSubtext}>
            Set a new password to regain access to your medical dashboard.
          </Text>

          {/* Card */}
          <View style={styles.mobileCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.successBannerText}>{success}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={[styles.inputRow, newFocused && styles.inputRowFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={newFocused ? "#2563eb" : "#94a3b8"} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor="#adb8c9"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(""); }}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
            <View style={[styles.inputRow, confirmFocused && styles.inputRowFocused]}>
              <Ionicons name="reload-circle-outline" size={18} color={confirmFocused ? "#2563eb" : "#94a3b8"} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Re-enter new password"
                placeholderTextColor="#adb8c9"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security badge pinned to bottom */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.securityText}>END-TO-END CLINICAL SECURITY</Text>
        </View>
      </View>
    );
  }

  // ── WEB / DESKTOP ─────────────────────────────────────────
  return (
    <View style={styles.webRoot}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLogo}>
          <View style={styles.navLogoBox}>
            <Ionicons name="pulse" size={16} color="#fff" />
          </View>
          <Text style={styles.navLogoText}>Hospilink</Text>
        </View>
        <View style={styles.navRight}>
          <Text style={styles.navPortal}>Clinical Sanctuary Portal</Text>
        </View>
      </View>

      {/* Center everything */}
      <View style={styles.webCenter}>
        {/* Card */}
        <View style={styles.webCard}>
          <View style={styles.webIconWrap}>
            <Ionicons name="refresh-circle-outline" size={32} color="#2563eb" />
          </View>

          <Text style={styles.webTitle}>Reset Password</Text>
          <Text style={styles.webSubtitle}>
            Please enter a new secure password to regain access to your medical dashboard.
          </Text>

          {error ? (
            <View style={[styles.errorBanner, { marginBottom: 14, width: "100%" }]}>
              <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={[styles.successBanner, { marginBottom: 14, width: "100%" }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{success}</Text>
            </View>
          ) : null}

          <Text style={styles.webLabel}>NEW PASSWORD</Text>
          <View style={[styles.webInputRow, newFocused && styles.inputRowFocused]}>
            <Ionicons name="key-outline" size={16} color={newFocused ? "#2563eb" : "#94a3b8"} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#adb8c9"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setError(""); }}
              onFocus={() => setNewFocused(true)}
              onBlur={() => setNewFocused(false)}
              style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.webLabel, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
          <View style={[styles.webInputRow, confirmFocused && styles.inputRowFocused]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={confirmFocused ? "#2563eb" : "#94a3b8"} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#adb8c9"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.webPrimaryBtn, loading && { opacity: 0.75 }]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.primaryBtnText}>Reset Password</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace("/")}>
            <Ionicons name="arrow-back" size={14} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer pinned to bottom */}
      <View style={styles.webFooterWrap}>
        <Text style={styles.webFooter}>
          © 2024 Hospilink Medical Systems. All healthcare data is processed in compliance with global clinical security standards.
        </Text>
        <View style={styles.footerLinks}>
          {["Privacy Policy", "Terms of Service", "Contact Support"].map((t) => (
            <TouchableOpacity key={t} style={{ marginHorizontal: 12 }}>
              <Text style={styles.footerLinkText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Shared ──
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f1f5f9", borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0",
    paddingHorizontal: 14, height: 44, marginBottom: 4,
  },
  inputRowFocused: {
    borderColor: "#2563eb", backgroundColor: "#eff6ff",
    ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(37,99,235,0.10)" } as any }),
  },
  inputInner: { flex: 1, color: "#0f172a", fontSize: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  errorBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 8, padding: 10, marginBottom: 6,
  },
  errorBannerText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },
  successBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0",
    borderRadius: 8, padding: 10, marginBottom: 6,
  },
  successBannerText: { color: "#16a34a", fontSize: 12, fontWeight: "500", flex: 1 },

  // ── MOBILE ──
  mobileRoot: {
    flex: 1,
    backgroundColor: "#dce6f5",
    justifyContent: "space-between", 
  },
  mobileHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    ...Platform.select({ default: { shadowColor: "#90a8cc", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 } }),
  },
  mobileHeaderTitle: { color: "#1e3a5f", fontWeight: "700", fontSize: 17 },
  mobileCenterContent: {
    flex: 1,
    justifyContent: "flex-start", // Changed from "center" to pull content up
    marginTop: 36, // Explicit margin to control the exact spacing below header
    paddingHorizontal: 16,
  },
  mobileLogoWrap: { alignItems: "center", marginBottom: 12 },
  mobileLogoBox: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: "#2563eb",
    alignItems: "center", justifyContent: "center",
  },
  mobileLogoText: { color: "#1e3a5f", fontWeight: "800", fontSize: 15, marginTop: 8 },
  mobileHeading: { color: "#0f172a", fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  mobileSubtext: { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: 16, marginBottom: 20 },
  mobileCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 22,
    ...Platform.select({ default: { shadowColor: "#90a8cc", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 8 } }),
  },
  fieldLabel: { color: "#0f172a", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  primaryBtn: {
    backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
    ...Platform.select({ default: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 8 } }),
  },
  securityBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingBottom: 28,
  },
  securityText: { color: "#64748b", fontSize: 11, fontWeight: "600", letterSpacing: 1.2 },

  // ── WEB ──
  webRoot: {
    flex: 1,
    backgroundColor: "#dce6f5",
    justifyContent: "space-between", 
  },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 28, paddingVertical: 14, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e8eef6",
    ...Platform.select({ web: { boxShadow: "0 1px 6px rgba(100,140,200,0.10)" } as any }),
  },
  navLogo: { flexDirection: "row", alignItems: "center" },
  navLogoBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#2563eb",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  navLogoText: { color: "#0f172a", fontWeight: "800", fontSize: 17 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  navPortal: { color: "#64748b", fontSize: 13, fontWeight: "500" },
  webCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", 
    paddingVertical: 24,
  },
  webCard: {
    backgroundColor: "#fff", borderRadius: 16, 
    padding: 28, 
    width: "100%", 
    maxWidth: 380, 
    borderWidth: 1, borderColor: "#e2eaf4",
    alignItems: "center",
    ...Platform.select({ web: { boxShadow: "0 12px 40px rgba(100,140,200,0.14)" } as any }),
  },
  webIconWrap: {
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  webTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 8, textAlign: "center" },
  webSubtitle: { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 4 },
  webLabel: { color: "#475569", fontSize: 11, fontWeight: "700", letterSpacing: 1, alignSelf: "flex-start", marginBottom: 6 },
  webInputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0",
    paddingHorizontal: 14, 
    height: 44, 
    width: "100%",
    ...Platform.select({ web: { transition: "border-color 0.18s ease, box-shadow 0.18s ease" } as any }),
  },
  webPrimaryBtn: {
    backgroundColor: "#2563eb", borderRadius: 10,
    paddingVertical: 12, 
    alignItems: "center", width: "100%", marginTop: 20,
    ...Platform.select({ web: { boxShadow: "0 4px 16px rgba(37,99,235,0.32)" } as any }),
  },
  backToLogin: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  backToLoginText: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  webFooterWrap: { paddingVertical: 16, alignItems: "center" },
  webFooter: { color: "#94a3b8", fontSize: 11, textAlign: "center", paddingHorizontal: 20 },
  footerLinks: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerLinkText: { color: "#64748b", fontSize: 12, fontWeight: "500" },
});