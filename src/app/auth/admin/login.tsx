import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { adminAPI } from '../../../service/api'; // ← adjust path to your api.js

export default function AdminLoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      // POST /api/admin/signin
      // Returns: { success, message, userId, email }
      const response = await adminAPI.signin(email.trim(), password);

      if (response.success) {
        // OTP sent → go to verify-otp, carry email so verify screen can use it
        router.push({
          pathname: '/auth/verify-otp',
          params: { 
            email: response.email ?? email.trim(),
            userType: 'admin',
           },
          
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.response?.data?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#c8cfd8" />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="pulse" size={26} color="#fff" />
        </View>
        <Text style={styles.brandName}>
          HospiLink<Text style={styles.brandPlus}>+</Text>
        </Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>ADMIN PORTAL</Text>
          <View style={styles.taglineLine} />
        </View>
      </View>

      {/* ── Card ───────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardIconWrapper}>
          <Ionicons name="shield-checkmark" size={28} color="#1a4fd6" />
        </View>
        <Text style={styles.cardTitle}>Administrator Access</Text>
        <Text style={styles.cardSubtitle}>
          Sign in with your admin credentials. An OTP will be sent to your registered email.
        </Text>

        {/* Admin Email */}
        <Text style={styles.fieldLabel}>ADMIN EMAIL</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color="#9aa3b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="name@hospilink.org"
            placeholderTextColor="#aab0bb"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>SECURITY PASSWORD</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color="#9aa3b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#aab0bb"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons
              name={showPass ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#9aa3b0"
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSignin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-outline" size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Send OTP & Continue</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Encrypted badge */}
        <View style={styles.encryptedRow}>
          <Ionicons name="lock-closed" size={11} color="#22a05b" />
          <Text style={styles.encryptedText}>  256-BIT AES ENCRYPTED CONNECTION</Text>
        </View>

        <View style={styles.divider} />

        {/* Bottom note */}
        <Text style={styles.noteText}>
          OTP will be sent to your registered admin email address after successful credential verification.
        </Text>
      </View>

      {/* ── Compliance badge ───────────────────────────── */}
      <View style={styles.complianceBadge}>
        <Ionicons name="checkmark-circle" size={14} color="#4a5568" />
        <Text style={styles.complianceText}>  COMPLIANCE PROTOCOL HS-920</Text>
      </View>

      {/* ── Footer notice ──────────────────────────────── */}
      <Text style={styles.noticeText}>
        Authorized access only. All sessions are cryptographically logged for HIPAA compliance.
      </Text>

      {/* ── Footer bar ─────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerLeft}>
          © 2024 HOSPILINK+ GLOBAL. PREMIUM HEALTHCARE INFRASTRUCTURE.
        </Text>
      </View>
    </ScrollView>
  );
}

const BLUE    = '#1a4fd6';
const CARD_BG = '#ffffff';
const BG      = '#c8cfd8';

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: BG },
  content:  { alignItems: 'center', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16 },

  // Header
  header:     { alignItems: 'center', marginBottom: 28 },
  logoBox:    { width: 56, height: 56, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6 },
  brandName:  { fontSize: 30, fontWeight: '800', color: BLUE, letterSpacing: 0.5, marginBottom: 8 },
  brandPlus:  { color: BLUE },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taglineLine:{ flex: 1, height: 1, backgroundColor: '#9aa3b0', maxWidth: 50 },
  tagline:    { fontSize: 11, letterSpacing: 3, color: '#6b7583', fontWeight: '600' },

  // Card
  card:           { width: '100%', maxWidth: 420, backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8, marginBottom: 20 },
  cardIconWrapper:{ alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle:      { fontSize: 20, fontWeight: '800', color: '#1a1f2e', textAlign: 'center', marginBottom: 6 },
  cardSubtitle:   { fontSize: 12, color: '#6b7583', textAlign: 'center', marginBottom: 28, lineHeight: 18 },

  // Field
  fieldLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#4a5568', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 0, borderRadius: 12, backgroundColor: '#f8f9fc', paddingHorizontal: 14, height: 48, borderColor: 'transparent', outlineWidth: 0 },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, color: '#1a1f2e', paddingVertical: 0, borderWidth: 0, borderBottomWidth: 0, borderColor: 'transparent', outlineWidth: 0, outlineColor: 'transparent', backgroundColor: 'transparent' },
  eyeBtn:       { paddingLeft: 8 },

  // Button
  loginBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE, borderRadius: 12, height: 50, marginTop: 28, gap: 8, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Encrypted row
  encryptedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  encryptedText:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#22a05b' },

  // Divider
  divider: { height: 1, backgroundColor: '#eaecf0', marginVertical: 20 },

  // Note
  noteText: { fontSize: 12, color: '#6b7583', textAlign: 'center', lineHeight: 18 },

  // Compliance badge
  complianceBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#9aa3b0', borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10, marginBottom: 14 },
  complianceText:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#4a5568' },

  // Notice
  noticeText: { fontSize: 12, color: '#6b7583', textAlign: 'center', lineHeight: 18, maxWidth: 380, paddingHorizontal: 12, marginBottom: 20 },

  // Footer
  footer:     { width: '100%', borderTopWidth: 1, borderTopColor: '#b0b8c4', paddingTop: 14, paddingHorizontal: 8 },
  footerLeft: { fontSize: 9, color: '#7a8494', letterSpacing: 0.5, textAlign: 'center' },
});