import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { authAPI, profileAPI } from "../../service/api";
import { useAuth } from '@/context/AuthContext';

// ─── Validation helpers ────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  general?: string;
}

const isValidPhone = (v: string) => /^\d{10}$/.test(v.replace(/[\s\-\+]/g, ""));

interface SignInErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 900;
  const isMobile = width <= 600;
  const router = useRouter();

  const { setSession } = useAuth();

  const [activeTab, setActiveTab] = useState("signup");
  const [accountType, setAccountType] = useState("medical");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign Up fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Inline error states
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({});
  const [signInErrors, setSignInErrors] = useState<SignInErrors>({});

  //forgot password 
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  

  // ─── Tab switch: clear errors ──────────────────────────────
  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setSignUpErrors({});
    setSignInErrors({});
  };

  // ─── SIGN UP ───────────────────────────────────────────────
  const handleSignUp = async () => {
    const errs: SignUpErrors = {};

    if (!name.trim()) errs.name = "Full name is required.";
    if (!email.trim()) errs.email = "Email address is required.";
    else if (!isValidEmail(email)) errs.email = "Please enter a valid email.";
    if (!password.trim()) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(password))
      errs.password = "Must include uppercase, lowercase & a number.";

    if (phone.trim() && !isValidPhone(phone))
      errs.phone = "Phone number must be exactly 10 digits.";

    if (Object.keys(errs).length > 0) {
      setSignUpErrors(errs);
      return;
    }

    setSignUpErrors({});
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role: accountType === "medical" ? "staff" : "hospital",
      };

      const response = await authAPI.signup(payload);
      console.log("✅ Signup API response:", response);

      router.push({
        pathname: "/auth/verify-otp",
        params: { email, accountType },
      });
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      setSignUpErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // ─── SIGN IN ───────────────────────────────────────────────
  const handleSignIn = async () => {
    const errs: SignInErrors = {};

    if (!signInEmail.trim()) errs.email = "Email address is required.";
    else if (!isValidEmail(signInEmail)) errs.email = "Please enter a valid email.";
    if (!signInPassword.trim()) errs.password = "Password is required.";

    if (Object.keys(errs).length > 0) {
      setSignInErrors(errs);
      return;
    }

    setSignInErrors({});
    setLoading(true);

    try {
      // Step 1 — Sign in, get token + role
      const response = await authAPI.signin(signInEmail, signInPassword);
      console.log("✅ Signin response:", response);

      // localStorage.setItem("hospilink_token", response.token);
      // localStorage.setItem("hospilink_user", JSON.stringify(response.user));

      if (Platform.OS === "web") {
        localStorage.setItem("hospilink_token", response.token);
        localStorage.setItem("hospilink_user", JSON.stringify(response.user));
      } else {
        await AsyncStorage.setItem("hospilink_token", response.token);
        await AsyncStorage.setItem("hospilink_user", JSON.stringify(response.user));
      }

      setSession(response.token, response.user);

      const role = response.user?.role; // "staff" | "hospital"

      // Step 2 — Fetch profile to check isProfileComplete
      // Response shape: { success, profile: { isProfileComplete: true/false, ... } }
      let profileComplete = false;
      try {
        const profileRes = await profileAPI.getMyProfile();
        profileComplete = profileRes?.profile?.isProfileComplete ?? false;
        console.log("✅ Profile isProfileComplete:", profileComplete);
      } catch (e) {
        console.warn("⚠️ Could not fetch profile, defaulting to setup screen");
        profileComplete = false;
      }

      // Step 3 — Route based on role + profile completion
      if (role === "staff") {
        if (profileComplete) {
          router.replace("/medicalStaff/dashboard"); // ✅ already set up
        } else {
          router.replace("/profile/medical-staff");  // ⚠️ needs setup
        }
      } else if (role === "hospital") {
        if (profileComplete) {
          router.replace("/hospital/dashboard");     // ✅ already set up
        } else {
          router.replace("/profile/hospital");       // ⚠️ needs setup
        }
      } else {
        router.replace("/profile/medical-staff");    // fallback
      }

    } catch (error: any) {
      console.error("❌ Signin error:", error?.response?.data);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password.";
      setSignInErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async () => {
    if (!signInEmail.trim()) {
      setSignInErrors({ email: "Enter your email first, then tap Forgot Password." });
      return;
    }
    if (!isValidEmail(signInEmail)) {
      setSignInErrors({ email: "Please enter a valid email." });
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const res = await authAPI.forgotPassword(signInEmail);
      setForgotMessage(res.message); // shows success message inline
    } catch (error: any) {
      const message = error?.response?.data?.message || "Something went wrong.";
      setSignInErrors({ general: message });
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <ScrollView
      style={styles.scrollWrapper}
      contentContainerStyle={[
        styles.scrollContent,
        isMobile && { padding: 16, alignItems: "center" },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.container,
          isDesktop && { flexDirection: "row", height: 660, width: "70%", maxWidth: 820, alignSelf: "center" },
          !isDesktop && { flexDirection: "column", width: "100%", maxWidth: 520, alignSelf: "center", borderRadius: 12 },
        ]}
      >
        {/* ── LEFT PANEL ── */}
        {isDesktop && (
          <ImageBackground
            source={require("../../../assets/Images/loginbg.png")}
            style={styles.leftSection}
            imageStyle={{ borderRadius: 0 }}
          >
            <View style={styles.overlay} />
            <View style={styles.leftContent}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Ionicons name="pulse" size={20} color="#fff" />
                </View>
                <Text style={styles.logoText}>HospiLink</Text>
              </View>
              <Text style={styles.heading}>Empowering Healthcare Through Connection.</Text>
              <Text style={styles.subHeading}>
                The unified platform for medical professionals and hospital administration.
              </Text>
              <View style={{ marginTop: "auto" }}>
                <Feature title="Secure Infrastructure" desc="HIPAA compliant data management." iconName="shield-checkmark-outline" />
                <Feature title="Seamless Collaboration" desc="Connect instantly with specialized teams." iconName="people-outline" />
              </View>
            </View>
          </ImageBackground>
        )}

        {/* ── RIGHT PANEL ── */}
        <View style={[styles.rightSection, isDesktop && { flex: 1 }]}>
          <View style={[styles.cardInner, isMobile && { paddingHorizontal: 20, paddingVertical: 22 }]}>
            <View>
              <Text style={styles.welcome}>{activeTab === "signin" ? "Welcome Back" : "Create Account"}</Text>
              <Text style={styles.smallText}>Join the future of hospital management.</Text>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "signin" && styles.activeTab]}
                  onPress={() => switchTab("signin")}
                >
                  <Text style={activeTab === "signin" ? styles.activeTabText : styles.tabText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "signup" && styles.activeTab]}
                  onPress={() => switchTab("signup")}
                >
                  <Text style={activeTab === "signup" ? styles.activeTabText : styles.tabText}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* ── SIGN UP FIELDS ── */}
              {activeTab === "signup" && (
                <>
                  {/* General API error */}
                  {signUpErrors.general && (
                    <View style={styles.generalError}>
                      <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
                      <Text style={styles.generalErrorText}>{signUpErrors.general}</Text>
                    </View>
                  )}

                  <Text style={styles.label}>Register as:</Text>
                  <View style={styles.accountRow}>
                    <SelectableCard title="Medical Staff" active={accountType === "medical"} onPress={() => setAccountType("medical")} iconName="medical-outline" />
                    <SelectableCard title="Hospital" active={accountType === "hospital"} onPress={() => setAccountType("hospital")} iconName="business-outline" />
                  </View>

                  {accountType === "medical" && (
                    <Input
                      label="Full Name"
                      placeholder="Dr. Rahul"
                      iconName="person-outline"
                      value={name}
                      onChangeText={(v) => { setName(v); if (signUpErrors.name) setSignUpErrors(p => ({ ...p, name: undefined })); }}
                      error={signUpErrors.name}
                    />
                  )}
                  {accountType === "hospital" && (
                    <Input
                      label="Hospital Name"
                      placeholder="Government Hospital"
                      iconName="person-outline"
                      value={name}
                      onChangeText={(v) => { setName(v); if (signUpErrors.name) setSignUpErrors(p => ({ ...p, name: undefined })); }}
                      error={signUpErrors.name}
                    />
                  )}



                  <Input
                    label="Email Address"
                    placeholder="abc@hospital.com"
                    iconName="mail-outline"
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (signUpErrors.email) setSignUpErrors(p => ({ ...p, email: undefined })); }}
                    error={signUpErrors.email}
                    keyboardType="email-address"
                  />
                  <PasswordInput
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    value={password}
                    onChangeText={(v) => { setPassword(v); if (signUpErrors.password) setSignUpErrors(p => ({ ...p, password: undefined })); }}
                    error={signUpErrors.password}
                  />
                  {/* <Input
                    label="Phone Number"
                    placeholder="+91 000-000-0000"
                    iconName="call-outline"
                    value={phone}
                    onChangeText={(v) => { setPhone(v); if (signUpErrors.phone) setSignUpErrors(p => ({ ...p, phone: undefined })); }}
                    error={signUpErrors.phone}
                    keyboardType="phone-pad"
                  /> */}


                </>
              )}

              {/* ── SIGN IN FIELDS ── */}
              {activeTab === "signin" && (
                <>
                  {signInErrors.general && (
                    <View style={styles.generalError}>
                      <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
                      <Text style={styles.generalErrorText}>{signInErrors.general}</Text>
                    </View>
                  )}
                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    iconName="mail-outline"
                    value={signInEmail}
                    onChangeText={(v) => { setSignInEmail(v); if (signInErrors.email) setSignInErrors(p => ({ ...p, email: undefined })); }}
                    error={signInErrors.email}
                    keyboardType="email-address"
                  />
                  <PasswordInput
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    value={signInPassword}
                    onChangeText={(v) => { setSignInPassword(v); if (signInErrors.password) setSignInErrors(p => ({ ...p, password: undefined })); }}
                    error={signInErrors.password}
                  />

                  {forgotMessage ? (
                    <View style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                      <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "500" }}>{forgotMessage}</Text>
                    </View>
                  ) : null}

                  {/* Remember Me */}
                  <View style={styles.rememberRow}>
                    <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.rememberLeft}>
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                      <Text style={[styles.remember, { marginLeft: 6 }]}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleForgotPassword}  disabled={forgotLoading}>
                      <Text style={styles.forgot}>
                        {forgotLoading ? "Sending..." : "Forgot Password?"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}



              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (activeTab === "signin") handleSignIn();
                  else handleSignUp();
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>
                    {activeTab === "signin" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.copyright}>© 2026 HospiLink Medical Systems. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ── Sub-components ── */
function Feature({ title, desc, iconName }: { title: string; desc: string; iconName: any }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconBox}><Ionicons name={iconName} size={18} color="#93c5fd" /></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function Input({
  label, placeholder, iconName, value, onChangeText, error, keyboardType,
}: {
  label: string; placeholder: string; iconName: any;
  value: string; onChangeText: (v: string) => void;
  error?: string; keyboardType?: any;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && !hasError && styles.inputRowFocused,
          hasError && styles.inputRowError,
        ]}
      >
        <Ionicons
          name={iconName}
          size={16}
          color={hasError ? "#dc2626" : focused ? "#2563eb" : "#94a3b8"}
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#adb8c9"
          style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {hasError && (
        <View style={styles.errorRow}>
          <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}

function PasswordInput({
  show, onToggle, value, onChangeText, error,
}: {
  show: boolean; onToggle: () => void;
  value: string; onChangeText: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <>
      <Text style={styles.label}>Password</Text>
      <View
        style={[
          styles.inputRow,
          focused && !hasError && styles.inputRowFocused,
          hasError && styles.inputRowError,
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={16}
          color={hasError ? "#dc2626" : focused ? "#2563eb" : "#94a3b8"}
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="••••••••"
          placeholderTextColor="#adb8c9"
          secureTextEntry={!show}
          style={[styles.inputInner, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      {hasError && (
        <View style={styles.errorRow}>
          <Ionicons name="information-circle-outline" size={13} color="#dc2626" style={{ marginRight: 4 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}

function SelectableCard({ title, active, onPress, iconName }: {
  title: string; active: boolean; onPress: () => void; iconName: any;
}) {
  return (
    <TouchableOpacity style={[styles.selectCard, active && styles.selectCardActive]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={iconName} size={20} color={active ? "#2563eb" : "#94a3b8"} style={{ marginBottom: 4 }} />
      <Text style={active ? styles.selectTextActive : styles.selectText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: { flex: 1, backgroundColor: "#dce6f5" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, minHeight: "100%" },
  container: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#d0d9e8", ...Platform.select({ web: { boxShadow: "0 25px 60px rgba(100,140,200,0.20)" }, default: { shadowColor: "#90a8cc", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 } }) },
  leftSection: { flex: 1, height: "100%", overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(37,99,235,0.87)" },
  leftContent: { flex: 1, justifyContent: "flex-start", zIndex: 2, padding: 30 },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 36 },
  logoBox: { width: 34, height: 34, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", lineHeight: 38, marginBottom: 20 },
  subHeading: { color: "#bfdbfe", fontSize: 13, lineHeight: 20, marginBottom: 40 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  featureIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  featureTitle: { color: "#fff", fontWeight: "600", fontSize: 13, marginBottom: 2 },
  featureDesc: { color: "#bfdbfe", fontSize: 12, lineHeight: 17 },
  rightSection: { backgroundColor: "#ffffff" },
  cardInner: { flex: 1, paddingVertical: 24, paddingHorizontal: Platform.OS === "web" ? 32 : 20, justifyContent: "space-between" },
  welcome: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  smallText: { color: "#94a3b8", fontSize: 13, marginBottom: 14 },
  tabContainer: { flexDirection: "row", backgroundColor: "#f0f4fa", borderRadius: 10, padding: 4, marginBottom: 14 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 7 },
  activeTab: { backgroundColor: "#ffffff", ...Platform.select({ web: { boxShadow: "0 1px 5px rgba(0,0,0,0.10)" }, default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 } }) },
  tabText: { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  activeTabText: { color: "#1e40af", fontSize: 13, fontWeight: "700" },
  label: { color: "#475569", fontSize: 12, marginBottom: 5, fontWeight: "600" },
  accountRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  selectCard: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center", backgroundColor: "#f8fafc" },
  selectCardActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  selectText: { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  selectTextActive: { color: "#1d4ed8", fontSize: 13, fontWeight: "700" },

  // ── Input styles ──
  inputRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc",
    borderRadius: 8, borderWidth: 1.5, borderColor: "#e2e8f0",
    paddingHorizontal: 12, marginBottom: 4, height: 42,
    ...Platform.select({ web: { transition: "border-color 0.18s ease, box-shadow 0.18s ease" } as any }),
  },
  inputRowFocused: {
    borderColor: "#2563eb", backgroundColor: "#f0f6ff",
    ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(37,99,235,0.10)" } as any }),
  },
  inputRowError: {
    borderColor: "#dc2626", backgroundColor: "#fff5f5",
    ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(220,38,38,0.08)" } as any }),
  },
  inputInner: { flex: 1, color: "#0f172a", fontSize: 13 },

  // ── Error messages ──
  errorRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 1 },
  errorText: { color: "#dc2626", fontSize: 11.5, fontWeight: "500", flex: 1 },

  // ── General (API) error banner ──
  generalError: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 8, padding: 10, marginBottom: 10,
  },
  generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },

  // ── Rest ──
  rememberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: 4 },
  rememberLeft: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 15, height: 15, borderWidth: 1.5, borderColor: "#cbd5e1", borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  remember: { color: "#64748b", fontSize: 13 },
  forgot: { color: "#2563eb", fontSize: 12, fontWeight: "600" },
  primaryButton: {marginTop:8, backgroundColor: "#2563eb", paddingVertical: 12, borderRadius: 9, alignItems: "center", marginBottom: 14, ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }, default: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 } }) },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
  copyright: { color: "#c2cfe0", textAlign: "center", fontSize: 11, letterSpacing: 0.4 },
});
