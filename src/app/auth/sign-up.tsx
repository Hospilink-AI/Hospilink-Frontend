import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authAPI } from "@/service/api";
import AuthLayout, { HOSPITAL_POINTS } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import { Checkbox } from "@/ds/Controls";
import Field from "@/ds/Field";
import Icon from "@/ds/Icon";
import { Notice } from "@/ds/States";
import Txt from "@/ds/Txt";
import { color } from "@/ds/tokens";
import { useSignedInRedirect } from "@/hooks/useSignedInRedirect";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const RULES = [
  { key: "len", label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { key: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { key: "num", label: "A number", test: (p: string) => /\d/.test(p) },
];

export default function SignUp() {
  useSignedInRedirect();
  const router = useRouter();
  const { accountType: at } = useLocalSearchParams<{ accountType?: string }>();
  const accountType = at === "hospital" ? "hospital" : "medical";
  const isHospital = accountType === "hospital";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string; general?: string }>({});

  const passed = RULES.filter((r) => r.test(password)).length;

  const submit = async () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = isHospital ? "Hospital name is required." : "Full name is required.";
    if (!email.trim()) e.email = "Email address is required.";
    else if (!isValidEmail(email)) e.email = "Please enter a valid email.";
    if (!RULES.every((r) => r.test(password))) e.password = "Your password doesn't meet all the rules below.";
    if (!agreed) e.terms = "Please agree to the Terms and Privacy Policy.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await authAPI.signup({ name: name.trim(), email: email.trim(), password, role: isHospital ? "hospital" : "staff" });
      router.push({ pathname: "/auth/verify-otp", params: { email: email.trim(), accountType, signupName: name.trim() } });
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? err?.response?.data?.error ?? "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      back
      title="Create your account"
      subtitle={isHospital ? "For hospitals posting duties and vacancies." : "For doctors, nurses and clinical staff."}
      points={isHospital ? HOSPITAL_POINTS : undefined}
      testID="sign-up"
      footer={<Button label="Create account" onPress={submit} loading={loading} full size="lg" />}
    >
      <View style={styles.rolePill}>
        <Icon name={isHospital ? "hospital" : "role"} size={18} color={color.primary} />
        <Txt v="label" style={{ flex: 1 }}>
          {isHospital ? "Hospital account" : "Doctor or clinical staff account"}
        </Txt>
        <Txt v="label" tone="primary" onPress={() => router.replace("/auth/role-choice" as any)} accessibilityRole="link">
          Change
        </Txt>
      </View>
      {errors.general ? <Notice tone="danger" body={errors.general} /> : null}
      <Field
        label={isHospital ? "Hospital name" : "Full name"}
        hint={isHospital ? undefined : "As it appears on your registration certificate."}
        icon={isHospital ? "hospital" : "profile"}
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        maxLength={100}
      />
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <View style={{ gap: 10 }}>
        <Field label="Password" icon="lock" value={password} onChangeText={setPassword} error={errors.password} secure autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" />
        <View style={styles.meter} accessibilityLabel={`Password strength ${passed} of ${RULES.length}`}>
          {RULES.map((r, i) => (
            <View key={r.key} style={[styles.meterSeg, i < passed && { backgroundColor: passed === RULES.length ? color.success : color.primary }]} />
          ))}
        </View>
        <View style={styles.rules}>
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <View key={r.key} style={styles.rule}>
                <Icon name={ok ? "checkCircle" : "minus"} size={16} color={ok ? color.success : color.inkFaint} />
                <Txt v="caption" color={ok ? color.successInk : color.inkMuted}>
                  {r.label}
                </Txt>
              </View>
            );
          })}
        </View>
      </View>
      <Checkbox checked={agreed} onChange={setAgreed} label="I agree to the Terms and Privacy Policy">
        <Txt v="bodySm" tone="soft">
          I agree to the{" "}
          <Txt v="bodySm" tone="primary" onPress={() => router.push("/terms" as any)} accessibilityRole="link" style={styles.link}>
            Terms
          </Txt>{" "}
          and{" "}
          <Txt v="bodySm" tone="primary" onPress={() => router.push("/privacy-policy" as any)} accessibilityRole="link" style={styles.link}>
            Privacy Policy
          </Txt>
        </Txt>
      </Checkbox>
      {errors.terms ? (
        <Txt v="caption" tone="danger">
          {errors.terms}
        </Txt>
      ) : null}
      {!isHospital ? (
        <View style={styles.next}>
          {["Email code", "Your profile", "You're in"].map((t, i) => (
            <View key={t} style={styles.nextStep}>
              <View style={styles.nextNum}>
                <Txt v="caption" color={color.onDark} style={{ fontFamily: "Manrope_700Bold" }}>
                  {i + 1}
                </Txt>
              </View>
              <Txt v="caption" tone="soft">
                {t}
              </Txt>
              {i < 2 ? <View style={styles.nextLine} /> : null}
            </View>
          ))}
        </View>
      ) : null}
      <Pressable onPress={() => router.replace({ pathname: "/auth/login", params: { tab: "signin" } })} accessibilityRole="link" style={styles.alt}>
        <Txt v="bodySm" tone="muted">
          Already have an account? <Txt v="label" tone="primary">Sign in</Txt>
        </Txt>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  rolePill: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, minHeight: 48, borderRadius: 16, backgroundColor: color.well },
  meter: { flexDirection: "row", gap: 6, marginHorizontal: 4 },
  meterSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: color.wellStrong },
  next: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  nextStep: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  nextNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.ink, alignItems: "center", justifyContent: "center" },
  nextLine: { width: 16, height: 1, backgroundColor: color.lineStrong, marginLeft: 2 },
  rules: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginLeft: 4 },
  rule: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: "45%" },
  link: { textDecorationLine: "underline" },
  alt: { alignSelf: "center", paddingVertical: 8, minHeight: 44, justifyContent: "center" },
});
