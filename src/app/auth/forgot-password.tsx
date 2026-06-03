// import React, { useState } from "react";
// import {
//   KeyboardAvoidingView,
//   Platform,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import { authAPI } from "../../service/api";

// const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// export default function ForgotPasswordScreen() {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [emailError, setEmailError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const handleSendResetLink = async () => {
//     if (!email.trim()) {
//       setEmailError("Email address is required.");
//       return;
//     }
//     if (!isValidEmail(email)) {
//       setEmailError("Please enter a valid email address.");
//       return;
//     }

//     setEmailError("");
//     setLoading(true);
//     setSuccessMessage("");

//     try {
//       const res = await authAPI.forgotPassword(email.trim());
//       setSuccessMessage(
//         res.message || "If this email is registered, a reset link has been sent."
//       );
//     } catch (error: any) {
//       const message =
//         error?.response?.data?.message || "Something went wrong. Please try again.";
//       setEmailError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.screen}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* ── Navbar ── */}
//       <View style={styles.navbar}>
//         <View style={styles.navBrand}>
//           <View style={styles.navIconBox}>
//             <Ionicons name="pulse" size={16} color="#fff" />
//           </View>
//           <Text style={styles.navBrandText}>Hospilink</Text>
//         </View>
//         <TouchableOpacity style={styles.helpBtn}>
//           <Ionicons name="help-circle-outline" size={20} color="#9aa3b0" />
//         </TouchableOpacity>
//       </View>

//       {/* ── Body ── */}
//       <View style={styles.body}>
//         <View style={styles.card}>

//           {/* Title */}
//           <Text style={styles.title}>Verify Your Email</Text>

//           {/* Success Banner */}
//           {successMessage ? (
//             <View style={styles.successBanner}>
//               <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" style={{ marginRight: 8 }} />
//               <Text style={styles.successText}>{successMessage}</Text>
//             </View>
//           ) : null}

//           {/* Email Input */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Email Address</Text>
//             <View style={[styles.inputRow, emailError ? styles.inputRowError : null]}>
//               <TextInput
//                 style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
//                 placeholder="abc@gmail.com"
//                 placeholderTextColor="#9CA3AF"
//                 value={email}
//                 onChangeText={(v) => {
//                   setEmail(v);
//                   if (emailError) setEmailError("");
//                   if (successMessage) setSuccessMessage("");
//                 }}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 autoCorrect={false}
//               />
//             </View>
//             {emailError ? (
//               <View style={styles.errorRow}>
//                 <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
//                 <Text style={styles.errorText}>{emailError}</Text>
//               </View>
//             ) : null}
//           </View>

//           {/* Send Button */}
//           <TouchableOpacity
//             style={[styles.sendBtn, loading && { opacity: 0.7 }]}
//             onPress={handleSendResetLink}
//             activeOpacity={0.8}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.sendBtnText}>Send Link</Text>
//             )}
//           </TouchableOpacity>

//           {/* Resend row */}
//           <View style={styles.resendRow}>
//             <Text style={styles.resendHint}>Didn't receive the link?</Text>
//             <TouchableOpacity onPress={handleSendResetLink} disabled={loading}>
//               <Text style={styles.resendLink}>Resend Link</Text>
//             </TouchableOpacity>
//             <Text style={styles.resendTimer}>  Resend in 00:43</Text>
//           </View>

//         </View>

//         {/* Footer */}
//         <View style={styles.footer}>
//           <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
//           <Text style={styles.footerCopy}>© 2026 Hospilink Medical Systems. All rights reserved.</Text>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const BLUE = "#2563EB";

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: "#eef0f4",
//   },

//   /* ── Navbar ── */
//   navbar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === "ios" ? 48 : 0,
//     height: Platform.OS === "ios" ? 88 : 56,
//   },
//   navBrand: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   navIconBox: {
//     width: 34,
//     height: 34,
//     borderRadius: 9,
//     backgroundColor: BLUE,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   navBrandText: {
//     fontSize: 17,
//     fontWeight: "700",
//     color: "#1a1f2e",
//   },
//   helpBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     borderWidth: 1,
//     borderColor: "#d1d5db",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   /* ── Body ── */
//   body: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 24,
//   },

//   /* ── Card ── */
//   card: {
//     width: 380,
//     maxWidth: "90%",
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 28,
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowRadius: 14,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 4,
//     marginBottom: 28,
//   },

//   title: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#1F2937",
//     marginBottom: 20,
//   },

//   /* Success */
//   successBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f0fdf4",
//     borderWidth: 1,
//     borderColor: "#bbf7d0",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//   },
//   successText: {
//     color: "#16a34a",
//     fontSize: 13,
//     fontWeight: "500",
//     flex: 1,
//     lineHeight: 18,
//   },

//   /* Input */
//   inputGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8,
//   },
//   inputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     height: 46,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     backgroundColor: "#fff",
//   },
//   inputRowError: {
//     borderColor: "#dc2626",
//     backgroundColor: "#fff5f5",
//   },
//   input: {
//     flex: 1,
//     fontSize: 14,
//     color: "#1F2937",
//     height: "100%",
//   },
//   errorRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 5,
//   },
//   errorText: {
//     color: "#dc2626",
//     fontSize: 11.5,
//     fontWeight: "500",
//     flex: 1,
//   },

//   /* Button */
//   sendBtn: {
//     backgroundColor: BLUE,
//     height: 46,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 16,
//     shadowColor: BLUE,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.28,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   sendBtnText: {
//     color: "#fff",
//     fontSize: 15,
//     fontWeight: "600",
//   },

//   /* Resend row */
//   resendRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     flexWrap: "wrap",
//     gap: 4,
//   },
//   resendHint: {
//     fontSize: 13,
//     color: "#6B7280",
//   },
//   resendLink: {
//     fontSize: 13,
//     color: BLUE,
//     fontWeight: "600",
//   },
//   resendTimer: {
//     fontSize: 13,
//     color: "#6B7280",
//   },

//   /* Footer */
//   footer: {
//     alignItems: "center",
//     gap: 4,
//   },
//   footerSecure: {
//     fontSize: 11,
//     fontWeight: "600",
//     color: "#9CA3AF",
//     letterSpacing: 0.5,
//   },
//   footerCopy: {
//     fontSize: 11,
//     color: "#9CA3AF",
//   },
// });

import React, { useState, useEffect } from "react"; // 1. Imported useEffect
import {
  KeyboardAvoidingView,
  Platform,
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
// Assuming getMyProfile is imported from your API layer or defined alongside authAPI
import { authAPI,profileAPI } from "../../service/api"; 

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true); // Added profile loading state
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 2. useEffect hook to fetch user profile and prefill email on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Simulating your getMyProfile logic here directly or calling it if exported
        const response = await profileAPI.getMyProfile();
        const data = response.data;
        
        // Mapping the email from your shared API structure: response.user.email
        if (data && data.success && data.user && data.user.email) {
          setEmail(data.user.email);
        }
      } catch (error) {
        console.error("Failed to prefill email from profile:", error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <View style={styles.navIconBox}>
            <Ionicons name="pulse" size={16} color="#fff" />
          </View>
          <Text style={styles.navBrandText}>Hospilink</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={20} color="#9aa3b0" />
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <View style={styles.card}>

          {/* Title */}
          <Text style={styles.title}>Verify Your Email</Text>

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
              {/* 3. Render a loader or the input based on profile fetch status */}
              {fetchingProfile ? (
                <ActivityIndicator color={BLUE} style={{ marginLeft: "auto", marginRight: "auto" }} />
              ) : (
                <TextInput
                  style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="abc@gmail.com"
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
              )}
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
            style={[styles.sendBtn, (loading || fetchingProfile) && { opacity: 0.7 }]}
            onPress={handleSendResetLink}
            activeOpacity={0.8}
            disabled={loading || fetchingProfile}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send Link</Text>
            )}
          </TouchableOpacity>

          {/* Resend row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>Didn't receive the link?</Text>
            <TouchableOpacity onPress={handleSendResetLink} disabled={loading || fetchingProfile}>
              <Text style={styles.resendLink}>Resend Link</Text>
            </TouchableOpacity>
            <Text style={styles.resendTimer}>  Resend in 00:43</Text>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
          <Text style={styles.footerCopy}>© 2026 Hospilink Medical Systems. All rights reserved.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef0f4" },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 48 : 0,
    height: Platform.OS === "ios" ? 88 : 56,
  },
  navBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  navIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  navBrandText: { fontSize: 17, fontWeight: "700", color: "#1a1f2e" },
  helpBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: 380, maxWidth: "90%", backgroundColor: "#fff", borderRadius: 16, padding: 28, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 28 },
  title: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 20 },
  successBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, padding: 12, marginBottom: 16 },
  successText: { color: "#16a34a", fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 46, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, backgroundColor: "#fff" },
  inputRowError: { borderColor: "#dc2626", backgroundColor: "#fff5f5" },
  input: { flex: 1, fontSize: 14, color: "#1F2937", height: "100%" },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  errorText: { color: "#dc2626", fontSize: 11.5, fontWeight: "500", flex: 1 },
  sendBtn: { backgroundColor: BLUE, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  resendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 4 },
  resendHint: { fontSize: 13, color: "#6B7280" },
  resendLink: { fontSize: 13, color: BLUE, fontWeight: "600" },
  resendTimer: { fontSize: 13, color: "#6B7280" },
  footer: { alignItems: "center", gap: 4 },
  footerSecure: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", letterSpacing: 0.5 },
  footerCopy: { fontSize: 11, color: "#9CA3AF" },
});