import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Icon, { IconName } from "@/ds/Icon";
import Txt from "@/ds/Txt";
import { color, depth, radius } from "@/ds/tokens";
import { useSignedInRedirect } from "@/hooks/useSignedInRedirect";

function Choice({
  icon,
  title,
  body,
  points,
  onPress,
  featured,
  testID,
}: {
  icon: IconName;
  title: string;
  body: string;
  points: string[];
  onPress: () => void;
  featured?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      testID={testID}
      style={(s: any) => [styles.choice, featured ? styles.choiceFeatured : styles.choicePlain, s.pressed && { transform: [{ scale: 0.99 }] }, s.focused && depth.focus]}
    >
      <View style={styles.choiceTop}>
        <View style={[styles.choiceIcon, featured && { backgroundColor: color.primary }]}>
          <Icon name={icon} size={26} color={featured ? color.onDark : color.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h3" color={featured ? color.onDark : color.ink}>
            {title}
          </Txt>
          <Txt v="bodySm" color={featured ? color.onDarkMuted : color.inkSoft}>
            {body}
          </Txt>
        </View>
        <View style={[styles.go, featured && { backgroundColor: color.primary }]}>
          <Icon name="forward" size={18} color={featured ? color.onDark : color.ink} />
        </View>
      </View>
      <View style={styles.points}>
        {points.map((p) => (
          <View key={p} style={[styles.point, featured ? styles.pointDark : styles.pointLight]}>
            <Icon name="check" size={13} color={featured ? "#9DB8EC" : color.primary} strokeWidth={2.5} />
            <Txt v="caption" color={featured ? color.onDark : color.inkSoft}>
              {p}
            </Txt>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// First screen of the app: who are you?
export default function RoleChoice() {
  useSignedInRedirect();
  const router = useRouter();
  const choose = (accountType: "medical" | "hospital") => router.push({ pathname: "/auth/sign-up", params: { accountType } });

  return (
    <AuthLayout
      hero="brand"
      title="How will you use HospiLink?"
      subtitle="Choose one to create your account."
      testID="role-choice"
      footer={
        <View style={styles.signIn}>
          <Txt v="bodySm" tone="soft">
            Already have an account?
          </Txt>
          <Button label="Sign in" variant="text" onPress={() => router.push({ pathname: "/auth/login", params: { tab: "signin" } })} />
        </View>
      }
    >
      <Choice
        featured
        icon="role"
        title="I'm a doctor or clinical staff"
        body="Take duties at hospitals near you, and apply for vacancies."
        points={["Duties near you", "Shifts that fit you", "Permanent vacancies"]}
        onPress={() => choose("medical")}
        testID="choose-staff"
      />
      <Choice
        icon="hospital"
        title="I represent a hospital"
        body="Post duties and find verified staff quickly."
        points={["Verified staff", "Emergency cover", "Vacancies"]}
        onPress={() => choose("hospital")}
        testID="choose-hospital"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  choice: { borderRadius: radius.card, padding: 18, gap: 14 },
  choiceFeatured: { backgroundColor: color.ink, ...depth.floating },
  choicePlain: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, ...depth.raisedSm },
  choiceTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  choiceIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: color.well, alignItems: "center", justifyContent: "center" },
  go: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.well, alignItems: "center", justifyContent: "center" },
  points: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  point: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.pill },
  pointDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  pointLight: { backgroundColor: color.ground },
  signIn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
});
