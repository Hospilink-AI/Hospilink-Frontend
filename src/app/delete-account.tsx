import DeleteAccount, { DeletionResult, formatDeletionDate } from "@/component/account/DeleteAccount";
import { COLORS } from "@/constant/colors";
import { accountAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Public page (hospilink.in/delete-account) required by the app stores: delete an account without
// installing the app. Signs in only to get a token for the request; nothing is saved on this device.

const SUPPORT_EMAIL = "info@hospilink.com";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{ token: string; role?: string; email?: string } | null>(null);
  const [done, setDone] = useState<DeletionResult | null>(null);

  const signIn = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSigningIn(true);
    try {
      const res = await accountAPI.signinForDeletion(email.trim(), password);
      if (!res?.token) {
        setError(res?.message ?? "Invalid email or password.");
        return;
      }
      if (res.deletionCancelled) {
        // signing in during the grace period cancels a pending deletion (backend rule)
        setError("Your earlier deletion request has been cancelled because you signed in. You can request it again below.");
      }
      setSession({ token: res.token, role: res.user?.role, email: res.user?.email });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.brand}>HospiLink</Text>
      <View style={s.card}>
        <Text style={s.title}>Delete your HospiLink account</Text>

        {done ? (
          <View style={s.ok}>
            <Ionicons name="checkmark-circle" size={22} color="#047857" />
            <Text style={s.okText}>
              Your account is scheduled for deletion{done.scheduledFor ? ` on ${formatDeletionDate(done.scheduledFor)}` : ""}.
              If you change your mind, sign in to the app before then and your account will be kept.
            </Text>
          </View>
        ) : session ? (
          <>
            <Text style={s.sub}>Signed in as {session.email ?? email.trim()}</Text>
            {error && <Text style={s.info}>{error}</Text>}
            <DeleteAccount role={session.role} token={session.token} onDeleted={setDone} />
          </>
        ) : (
          <>
            <Text style={s.sub}>Sign in with the email and password you use in the HospiLink app to continue.</Text>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Email"
            />
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Your password"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Password"
              onSubmitEditing={signIn}
            />
            {error && <Text style={s.err}>{error}</Text>}
            <TouchableOpacity style={[s.btn, signingIn && { opacity: 0.6 }]} onPress={signIn} disabled={signingIn}>
              {signingIn ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={s.help}>
        <Text style={s.helpTitle}>Can't sign in?</Text>
        <Text style={s.helpText}>
          Email us from the address on your account at{" "}
          <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Delete my HospiLink account`)}>
            {SUPPORT_EMAIL}
          </Text>{" "}
          and we'll delete it for you.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingVertical: 32, width: "100%", maxWidth: 560, alignSelf: "center" },
  brand: { fontSize: 22, fontWeight: "800", color: COLORS.primary, marginBottom: 16, textAlign: "center" },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.subText, marginTop: 6, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  err: { color: "#B91C1C", fontSize: 14, marginTop: 12 },
  info: { color: "#1E40AF", backgroundColor: "#EFF6FF", fontSize: 14, marginTop: 12, padding: 10, borderRadius: 8 },
  btn: { marginTop: 18, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  ok: { flexDirection: "row", gap: 10, backgroundColor: "#ECFDF5", borderRadius: 10, padding: 14, marginTop: 14 },
  okText: { flex: 1, fontSize: 14, color: "#065F46", lineHeight: 20 },
  help: { marginTop: 20, paddingHorizontal: 4 },
  helpTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  helpText: { fontSize: 14, color: COLORS.subText, marginTop: 4, lineHeight: 20 },
  link: { color: COLORS.primary, fontWeight: "600" },
});
