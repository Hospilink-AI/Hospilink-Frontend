import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import DeleteAccount, { DeletionResult, formatDeletionDate } from "@/component/account/DeleteAccount";
import { accountAPI } from "@/service/api";
import AuthLayout, { AuthPoint } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Field from "@/ds/Field";
import Icon from "@/ds/Icon";
import { ListRow } from "@/ds/Layout";
import { Notice } from "@/ds/States";
import { Card } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import { ThemeProvider } from "@/ds/theme";
import { color, radius } from "@/ds/tokens";

// Public page (hospilink.in/delete-account) required by the app stores: delete an account without
// installing the app. Signs in only to get a token for the request; nothing is saved on this device.

const SUPPORT_EMAIL = "support@hospilink.in";

const POINTS: AuthPoint[] = [
  { icon: "lock", title: "Only you can ask", body: "Sign in with your HospiLink email and password, then confirm with your password again." },
  { icon: "time", title: "Time to change your mind", body: "Signing in to the app before the deletion date keeps your account." },
  { icon: "security", title: "Records kept without your name", body: "Completed duties, ratings and payments stay on record for accounting and safety, without your details." },
];

function Help() {
  const router = useRouter();
  return (
    <Card tone="flat" pad={6}>
      <View style={styles.help}>
        <Icon name="mail" size={20} color={color.primary} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="title">Can't sign in?</Txt>
          <Txt v="bodySm" tone="muted">
            Email us from the address on your account and we'll delete it for you.
          </Txt>
          <Txt
            v="label"
            tone="primary"
            accessibilityRole="link"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Delete my HospiLink account`)}
            style={{ paddingVertical: 4 }}
          >
            {SUPPORT_EMAIL}
          </Txt>
        </View>
      </View>
      <ListRow icon="file" title="How we handle your data" subtitle="Privacy Policy" onPress={() => router.push("/privacy-policy" as any)} />
    </Card>
  );
}

function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [session, setSession] = useState<{ token: string; role?: string; email?: string } | null>(null);
  const [done, setDone] = useState<DeletionResult | null>(null);

  const signIn = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setInfo(null);
    setSigningIn(true);
    try {
      const res = await accountAPI.signinForDeletion(email.trim(), password);
      if (!res?.token) {
        setError(res?.message ?? "That email and password don't match an account.");
        return;
      }
      if (res.deletionCancelled) {
        // signing in during the grace period cancels a pending deletion (backend rule)
        setInfo("Your earlier deletion request was cancelled because you signed in. You can ask again below.");
      }
      setSession({ token: res.token, role: res.user?.role, email: res.user?.email });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "That email and password don't match an account.");
    } finally {
      setSigningIn(false);
    }
  };

  if (done) {
    const when = formatDeletionDate(done.scheduledFor);
    return (
      <AuthLayout title="Deletion scheduled" subtitle={when ? `Your account will be deleted on ${when}.` : "Your account will be deleted soon."} points={POINTS} testID="delete-account-done">
        <View style={styles.doneMark}>
          <Icon name="checkCircle" size={36} color={color.success} />
        </View>
        <Notice tone="success" title="You've been signed out" body="If you change your mind, sign in to the HospiLink app before then and your account is kept." />
        <Help />
      </AuthLayout>
    );
  }

  if (session) {
    return (
      <AuthLayout
        back={() => {
          setSession(null);
          setPassword("");
          setInfo(null);
        }}
        step={{ at: 2, of: 2 }}
        title="Delete your account"
        subtitle="Read what happens, then confirm with your password."
        points={POINTS}
        testID="delete-account-confirm"
      >
        <View style={styles.who}>
          <Icon name="account" size={20} color={color.inkMuted} />
          <View style={{ flex: 1 }}>
            <Txt v="caption" tone="muted">
              Signed in as
            </Txt>
            <Txt v="title" numberOfLines={1}>
              {session.email ?? email.trim()}
            </Txt>
          </View>
        </View>
        {info ? <Notice tone="info" body={info} /> : null}
        <DeleteAccount role={session.role} token={session.token} onDeleted={setDone} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      step={{ at: 1, of: 2 }}
      title="Delete your HospiLink account"
      subtitle="Sign in with the email and password you use in the app. Nothing is saved on this device."
      points={POINTS}
      testID="delete-account"
      footer={<Button label="Continue" onPress={signIn} loading={signingIn} full size="lg" iconRight="forward" />}
    >
      {error ? <Notice tone="danger" body={error} /> : null}
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError(null);
        }}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={signIn}
        returnKeyType="go"
      />
      <Help />
    </AuthLayout>
  );
}

export default function DeleteAccountRoute() {
  return (
    <ThemeProvider name="v2">
      <DeleteAccountPage />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  help: { flexDirection: "row", gap: 14, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  who: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.input, backgroundColor: color.well },
  doneMark: { width: 72, height: 72, borderRadius: 36, backgroundColor: color.successSoft, alignItems: "center", justifyContent: "center", alignSelf: "center" },
});
