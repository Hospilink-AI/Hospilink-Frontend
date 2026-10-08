import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authAPI } from "@/service/api";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await authAPI.forgotPassword(email.trim());
      setSent(r?.message || "If this email is registered, a reset link has been sent.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      back
      title="Reset your password"
      subtitle="Enter the email you signed up with. We'll send you a link to set a new password."
      testID="forgot-password"
      footer={
        sent ? (
          <Button label="Back to sign in" variant="secondary" onPress={() => router.replace({ pathname: "/auth/login", params: { tab: "signin" } })} full size="lg" />
        ) : (
          <Button label="Send reset link" onPress={submit} loading={loading} full size="lg" />
        )
      }
    >
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError(null);
        }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!sent}
        onSubmitEditing={submit}
      />
      {sent ? <Notice tone="success" title="Check your email" body={`${sent} Check spam if you don't see it.`} /> : null}
    </AuthLayout>
  );
}
