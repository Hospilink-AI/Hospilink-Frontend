import { COLORS } from "@/constant/colors";
import { accountAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Account deletion: explanation, password confirmation and the request.
// Used in the app (signed in) and on the public /delete-account page (token from a sign-in that
// isn't saved as a session). Wording below needs client sign-off.

export type DeletionResult = {
  scheduled?: boolean;
  scheduledFor?: string;
  graceDays?: number;
  dutiesCancelled?: number;
  vacanciesClosed?: number;
  applicationsWithdrawn?: number;
  message?: string;
};

type Props = {
  role?: string; // "staff" | "hospital"
  token?: string; // public page only
  onDeleted: (result: DeletionResult) => void;
};

export const formatDeletionDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

export default function DeleteAccount({ role, token, onDeleted }: Props) {
  const [graceDays, setGraceDays] = useState<number>(7);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    accountAPI
      .getDeletion(token)
      .then((res: any) => {
        if (!alive) return;
        if (typeof res?.graceDays === "number") setGraceDays(res.graceDays);
        if (res?.scheduled) setScheduledFor(res.scheduledFor ?? "");
      })
      .catch(() => {
        // keep the default grace period; the POST still reports the real date
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const submit = async () => {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await accountAPI.requestDeletion(password, reason.trim(), token);
      onDeleted(res ?? {});
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 401) setError("Incorrect password");
      else if (msg) setError(String(msg)); // 409: a duty under way or starting soon, or already scheduled
      else setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />;
  }

  if (scheduledFor !== null) {
    return (
      <View style={[s.notice, s.noticeWarn]}>
        <Ionicons name="time-outline" size={20} color="#92400E" />
        <Text style={s.noticeText}>
          This account is already scheduled for deletion{scheduledFor ? ` on ${formatDeletionDate(scheduledFor)}` : ""}.
          Signing in before then keeps it.
        </Text>
      </View>
    );
  }

  const isHospital = role === "hospital";

  return (
    <View>
      <Text style={s.h}>What happens</Text>
      <Bullet>
        Your upcoming duties are cancelled and the {isHospital ? "doctors" : "hospitals"} involved are notified.
      </Bullet>
      {isHospital ? (
        <Bullet>Your open vacancies are closed.</Bullet>
      ) : (
        <Bullet>Your pending job applications are withdrawn.</Bullet>
      )}
      <Bullet>
        You are signed out now. Your account is deleted after {graceDays} days. Signing in before then cancels the
        deletion and keeps your account.
      </Bullet>

      <Text style={s.h}>What is deleted</Text>
      <Bullet>Your profile, contact details, documents and sign-in details.</Bullet>

      <Text style={s.h}>What is kept</Text>
      <Bullet>
        Records of completed duties, ratings, payments and support requests are kept without your name or contact
        details, as required for accounting and safety.
      </Bullet>

      <Text style={s.label}>Password</Text>
      <View style={s.pwRow}>
        <TextInput
          style={[s.input, { flex: 1, borderWidth: 0 }]}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          secureTextEntry={!showPassword}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          accessibilityLabel="Password"
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          style={{ paddingHorizontal: 10 }}
        >
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.subText} />
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Reason (optional)</Text>
      <TextInput
        style={[s.input, { minHeight: 72, textAlignVertical: "top" }]}
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={500}
        placeholder="Tell us why you're leaving"
        placeholderTextColor="#94A3B8"
        accessibilityLabel="Reason"
      />

      <TouchableOpacity
        style={s.check}
        onPress={() => setConfirmed((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: confirmed }}
      >
        <Ionicons name={confirmed ? "checkbox" : "square-outline"} size={22} color={confirmed ? COLORS.red : COLORS.subText} />
        <Text style={s.checkText}>I understand my account will be deleted after {graceDays} days.</Text>
      </TouchableOpacity>

      {error && (
        <View style={[s.notice, s.noticeErr]}>
          <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
          <Text style={[s.noticeText, { color: "#B91C1C" }]}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.btn, (!confirmed || submitting) && { opacity: 0.5 }]}
        disabled={!confirmed || submitting}
        onPress={submit}
        accessibilityRole="button"
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Delete my account</Text>}
      </TouchableOpacity>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bullet}>
      <Text style={s.dot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 14, marginBottom: 6 },
  bullet: { flexDirection: "row", gap: 8, marginBottom: 6 },
  dot: { fontSize: 14, color: COLORS.subText, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 14, color: "#334155", lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  pwRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  check: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  checkText: { flex: 1, fontSize: 14, color: COLORS.text },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10, marginTop: 14 },
  noticeWarn: { backgroundColor: "#FFFBEB" },
  noticeErr: { backgroundColor: "#FEF2F2" },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, color: "#92400E" },
  btn: {
    marginTop: 18,
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
