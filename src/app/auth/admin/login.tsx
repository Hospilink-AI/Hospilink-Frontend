import { useState } from "react";
import { useRouter } from "expo-router";
import { adminAPI } from "@/service/api";
import AuthLayout, { ADMIN_POINTS } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";

// Admin sign-in: email and password, then the emailed code on the shared verify screen.
export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const submit = async () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Enter your admin email.";
    if (!password) e.password = "Enter your password.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await adminAPI.signin(email.trim(), password);
      if (r?.success) router.push({ pathname: "/auth/verify-otp", params: { email: r.email ?? email.trim(), userType: "admin" } });
      else setErrors({ general: r?.message ?? "Sign in didn't work. Try again." });
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? "That email and password don't match an admin account." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin sign in"
      subtitle="For the HospiLink team. We'll email you a code to finish signing in."
      points={ADMIN_POINTS}
      testID="admin-sign-in"
      footer={<Button label="Send code" onPress={submit} loading={loading} full size="lg" iconRight="forward" />}
    >
      {errors.general ? <Notice tone="danger" body={errors.general} /> : null}
      <Field
        label="Admin email"
        icon="mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.general || errors.email) setErrors({});
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.general || errors.password) setErrors({});
        }}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        returnKeyType="go"
      />
    </AuthLayout>
  );
}
