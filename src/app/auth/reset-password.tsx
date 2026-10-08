import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authAPI } from "@/service/api";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";

// The reset link in the email carries ?token=
export default function ResetPassword() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (pw.length < 6) e.pw = "Password must be at least 6 characters.";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(pw)) e.pw = "Must include uppercase, lowercase & a number.";
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (pw !== confirm) e.confirm = "Passwords do not match.";
    if (!token) e.general = "Reset token is missing. Please use the link from your email.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await authAPI.resetPassword(token, pw, confirm);
      setDone(true);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? "Something went wrong. The reset link may have expired." });
    } finally {
      setLoading(false);
    }
  };

  const toSignIn = () => router.replace({ pathname: "/auth/login", params: { tab: "signin" } });

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Use at least 6 characters with an uppercase letter, a lowercase letter and a number."
      testID="reset-password"
      footer={done ? <Button label="Sign in" onPress={toSignIn} full size="lg" /> : <Button label="Save new password" onPress={submit} loading={loading} full size="lg" />}
    >
      {done ? (
        <Notice tone="success" title="Password changed" body="Sign in with your new password." />
      ) : (
        <>
          {errors.general ? <Notice tone="danger" body={errors.general} /> : null}
          <Field label="New password" icon="lock" value={pw} onChangeText={setPw} error={errors.pw} secure autoCapitalize="none" autoComplete="new-password" />
          <Field label="Confirm password" icon="lock" value={confirm} onChangeText={setConfirm} error={errors.confirm} secure autoCapitalize="none" autoComplete="new-password" />
        </>
      )}
    </AuthLayout>
  );
}
