import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminAPI } from '../../../service/api';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.signin(email.trim(), password);

      if (response.success) {
        router.push({
          pathname: '/auth/verify-otp',
          params: {
            email: response.email ?? email.trim(),
            userType: 'admin',
          },
        });
      } else {
        // backend returned success: false
        setError(response.message ?? 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

        {/* Shield */}
        <View style={styles.shieldCircle}>
          <Ionicons name="shield-checkmark" size={24} color="#1a4fd6" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Administrator Access</Text>
        <Text style={styles.subtitle}>
          Sign in with your admin credentials. An OTP will be sent{'\n'}to your registered email.
        </Text>

        {/* ── Card — narrow fixed width ── */}
        <View style={styles.card}>

          <Text style={styles.fieldLabel}>Admin Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={16} color="#9aa3b0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@hospilink.org"
              placeholderTextColor="#aab0bb"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Security Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={16} color="#9aa3b0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#aab0bb"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="#9aa3b0"
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSignin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Send OTP & Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.encryptedRow}>
            <View style={styles.greenDot} />
            <Text style={styles.encryptedText}>256-BIT AES END-TO-END ENCRYPTION ACTIVE</Text>
          </View>
        </View>

        {/* Info pill */}
        <View style={styles.infoPill}>
          <Ionicons name="information-circle-outline" size={14} color="#6b7583" />
          <Text style={styles.infoPillText}>Check your inbox for the OTP after proceeding</Text>
        </View>

        {/* Compliance */}
        <View style={styles.complianceBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#4a5568" />
          <Text style={styles.complianceText}> COMPLIANCE PROTOCOL HS-920</Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerLine1}>
          © 2026 HOSPILINK + GLOBAL. PREMIUM HEALTHCARE INFRASTRUCTURE
        </Text>
        <Text style={styles.footerLine2}>
          Authorized access only. All sessions are cryptographically logged
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const BLUE = '#1a4fd6';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef0f4',
  },

  /* ── Navbar ── */
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 0,
    height: Platform.OS === 'ios' ? 88 : 56,
  },
  errorBox: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#FEF2F2',
  borderWidth: 1,
  borderColor: '#FECACA',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginTop: 16,
},
errorText: {
  flex: 1,
  fontSize: 13,
  color: '#DC2626',
  fontWeight: '500',
  lineHeight: 18,
},
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrandText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Body: centers everything, constrains width ── */
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,

    // 👇 This is the key: all children inherit this alignment
    // but the card below sets its own fixed width
  },

  /* Shield */
  shieldCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1f2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7583',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },

  /*
   * Card: fixed pixel width — small enough to look compact on any screen.
   * 380px matches the reference screenshot proportions.
   * On phones narrower than 380px, it uses 90% of the screen width.
   */
  card: {
    width: 380,
    maxWidth: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    height: 46,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1f2e',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  eyeBtn: { paddingLeft: 8 },

  loginBtn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22a05b',
  },
  encryptedText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#374151',
  },

  /* Info pill */
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  infoPillText: {
    fontSize: 12,
    color: '#6b7583',
    fontWeight: '500',
  },

  /* Compliance */
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#9aa3b0',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  complianceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#4a5568',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingTop: 8,
  },
  footerDivider: {
    width: '85%',
    height: 1,
    backgroundColor: '#d1d5db',
    marginBottom: 10,
  },
  footerLine1: {
    fontSize: 9,
    color: '#9aa3b0',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 2,
  },
  footerLine2: {
    fontSize: 9,
    color: '#9aa3b0',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});