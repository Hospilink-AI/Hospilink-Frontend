import { StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import AuthLayout, { HOSPITAL_POINTS } from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Icon, { IconName } from "@/ds/Icon";
import Txt from "@/ds/Txt";
import { color, radius } from "@/ds/tokens";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "hospital", title: "Hospital details", body: "Name, mobile number, address and services. About two minutes." },
  { icon: "documents", title: "Documents", body: "Aadhaar, PAN, CIN, GST and one accreditation certificate." },
  { icon: "verified", title: "We check them", body: "Once your hospital is verified, you can post duties." },
];

// Hospital sign-up, straight after the email code: what's ahead, then set up or look around first.
export default function HospitalWelcome() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = one(params.email as any) || one(params.prefillEmail as any);
  const name = one(params.signupName as any) || one(params.prefillName as any);

  // doctors have their own wizard (old links)
  if (one(params.accountType as any) === "medical") return <Redirect href={{ pathname: "/profile/medical-staff", params: { prefillName: name, prefillEmail: email } } as any} />;

  return (
    <AuthLayout
      hero="brand"
      title={name ? `Welcome, ${name}` : "Welcome to HospiLink"}
      subtitle="Your email is confirmed. Three steps and your hospital can start posting duties."
      points={HOSPITAL_POINTS}
      testID="hospital-welcome"
      footer={
        <View style={{ gap: 8 }}>
          <Button
            label="Set up my hospital"
            onPress={() => router.replace({ pathname: "/profile/hospital", params: { prefillName: name, prefillEmail: email } } as any)}
            full
            size="lg"
            iconRight="forward"
          />
          <Button label="Look around first" variant="text" full onPress={() => router.replace("/hospital/dashboard" as any)} />
        </View>
      }
    >
      <View style={styles.steps} accessibilityRole="list">
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={styles.num}>
                <Icon name={s.icon} size={20} color={color.primary} />
              </View>
              {i < STEPS.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.stepText}>
              <Txt v="title">{s.title}</Txt>
              <Txt v="bodySm" tone="muted">
                {s.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  steps: { paddingTop: 4 },
  step: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", width: 44 },
  num: { width: 44, height: 44, borderRadius: radius.icon, backgroundColor: color.well, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, minHeight: 14, marginVertical: 4, borderRadius: 1, backgroundColor: color.line },
  stepText: { flex: 1, gap: 2, paddingTop: 2, paddingBottom: 20 },
});
