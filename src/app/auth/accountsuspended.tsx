import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import { ListRow } from "@/ds/Layout";
import { Notice } from "@/ds/States";
import { Card } from "@/ds/Surface";

// Shown when the server says the account is suspended.
export default function AccountSuspended() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const base = user?.role === "hospital" ? "hospital" : "medicalStaff";

  return (
    <AuthLayout
      title="Your account is suspended"
      subtitle="You can't take or post duties while it's suspended. You can still see why, reply to the decision, and contact us."
      testID="account-suspended"
      footer={
        <Button
          label="Sign out"
          variant="secondary"
          full
          size="lg"
          onPress={async () => {
            await logout();
            router.replace("/" as any);
          }}
        />
      }
    >
      <Notice tone="danger" icon="block" body="If you think this is a mistake, reply from Account Standing. Our team reviews every reply." />
      <Card>
        <ListRow icon="security" title="Account Standing" subtitle="See the reason and reply" onPress={() => router.push(`/${base}/support/standing` as any)} />
        <ListRow icon="mail" title="Email support" subtitle="support@hospilink.in" onPress={() => Linking.openURL("mailto:support@hospilink.in")} />
      </Card>
    </AuthLayout>
  );
}
