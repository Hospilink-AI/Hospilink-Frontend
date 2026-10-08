import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/service/api";
import { resolveLanding, storeSession } from "@/service/landing";
import { flash } from "@/service/session";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import { Notice } from "@/ds/States";
import Txt from "@/ds/Txt";
import { useSignedInRedirect } from "@/hooks/useSignedInRedirect";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function SignIn() {
  useSignedInRedirect();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // old links to the sign-up tab land on the role choice
  if (tab === "signup") return <Redirect href="/auth/role-choice" />;

  const submit = async () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email address is required.";
    else if (!isValidEmail(email)) e.email = "Please enter a valid email.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const r = await authAPI.signin(email.trim(), password);
      if (!r?.token) {
        setErrors({ general: r?.message ?? "Invalid email or password." });
        return;
      }
      await storeSession(r.token, r.user);
      setSession(r.token, r.user);
      // signing in during the grace period keeps the account (backend cancels the deletion)
      if (r.deletionCancelled) {
        flash(
          r.user?.role === "staff"
            ? "Welcome back, your account deletion has been cancelled. Your availability is off; turn it on when you're ready for duties."
            : "Welcome back, your account deletion has been cancelled.",
          "success"
        );
      }
      router.replace((await resolveLanding(r.user)) as any);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message ?? err?.response?.data?.error ?? "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      back={() => router.replace("/" as any)}
      title="Welcome back"
      subtitle="Sign in to see your duties."
      testID="sign-in"
      footer={<Button label="Sign in" onPress={submit} loading={loading} full size="lg" />}
    >
      {errors.general ? <Notice tone="danger" body={errors.general} /> : null}
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.general) setErrors({});
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.general) setErrors({});
        }}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      <Pressable
        onPress={() => router.push({ pathname: "/auth/forgot-password", params: { email: email.trim() } })}
        accessibilityRole="link"
        style={styles.forgot}
      >
        <Txt v="label" tone="primary">
          Forgot password?
        </Txt>
      </Pressable>
      <View style={styles.divider} />
      <Pressable onPress={() => router.push("/auth/role-choice")} accessibilityRole="link" style={styles.alt}>
        <Txt v="bodySm" tone="muted" align="center">
          New to HospiLink? <Txt v="label" tone="primary">Create an account</Txt>
        </Txt>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  divider: { height: 1, backgroundColor: "#DCE3F0" },
  alt: { alignSelf: "center", minHeight: 44, justifyContent: "center" },
});
