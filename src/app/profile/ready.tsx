import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import AuthLayout from "@/ds/AuthLayout";
import Button from "@/ds/Button";
import Icon, { IconName } from "@/ds/Icon";
import { Card } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import { color, radius } from "@/ds/tokens";
import { fcmService } from "@/service/fcm";
import { notificationAPI } from "@/service/api";
import { askLocation, locationPermission, markNotifyExplained, PermissionState } from "@/doctor/permissions";

function Item({ icon, title, body, state, action, onPress }: { icon: IconName; title: string; body: string; state: "done" | "todo" | "blocked"; action: string; onPress: () => void }) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.icon, state === "done" && { backgroundColor: color.successSoft }]}>
          <Icon name={state === "done" ? "checkCircle" : icon} size={24} color={state === "done" ? color.success : color.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="title">{title}</Txt>
          <Txt v="bodySm" tone="muted">
            {body}
          </Txt>
          {state === "todo" ? <Button label={action} size="sm" onPress={onPress} style={{ marginTop: 6 }} /> : null}
          {state === "blocked" ? (
            <Txt v="caption" tone="warning" style={{ marginTop: 4 }}>
              Blocked. You can allow it later in your phone settings.
            </Txt>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

// Last onboarding step: why we ask for location and notifications, before the system asks.
export default function Ready() {
  const router = useRouter();
  const [loc, setLoc] = useState<PermissionState>("undetermined");
  const [notify, setNotify] = useState<PermissionState>("undetermined");

  useEffect(() => {
    locationPermission().then(setLoc);
    (async () => {
      if (Platform.OS === "web") return setNotify("granted");
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
        const { PermissionsAndroid } = require("react-native");
        const ok = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        setNotify(ok ? "granted" : "undetermined");
      } else if (Platform.OS === "android") setNotify("granted");
    })();
  }, []);

  const askNotify = async () => {
    await markNotifyExplained();
    try {
      const ok = await fcmService.requestPermission();
      setNotify(ok ? "granted" : "denied");
      if (!ok) return;
      const t = await fcmService.getFCMToken();
      if (t) {
        const d = await fcmService.getDeviceInfo();
        await notificationAPI.registerFCMToken(t, d.deviceId, d.platform).catch(() => {});
      }
    } catch {
      setNotify("denied");
    }
  };

  return (
    <AuthLayout
      title={Platform.OS === "web" ? "One thing before you start" : "Two things before you start"}
      subtitle={Platform.OS === "web" ? "So you see the duties closest to you." : "So duty offers reach you, and you see the ones closest to you."}
      testID="onboarding-ready"
      footer={<Button label="Go to HospiLink" onPress={() => router.replace("/medicalStaff/dashboard" as any)} full size="lg" iconRight="forward" />}
    >
      <Item
        icon="myLocation"
        title="Location while the app is open"
        body="We show you duties near where you are, and check you're at the hospital when you start a duty. Never in the background."
        state={loc === "granted" ? "done" : loc === "denied" ? "blocked" : "todo"}
        action="Allow location"
        onPress={async () => setLoc(await askLocation())}
      />
      {Platform.OS !== "web" ? (
        <Item
          icon="alerts"
          title="Notifications"
          body="New duty offers near you, invites from hospitals, and reminders before your duty starts."
          state={notify === "granted" ? "done" : notify === "denied" ? "blocked" : "todo"}
          action="Allow notifications"
          onPress={askNotify}
        />
      ) : null}
      <Txt v="caption" tone="muted" align="center">
        You can change these any time in your phone settings.
      </Txt>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  icon: { width: 48, height: 48, borderRadius: radius.icon, backgroundColor: color.well, alignItems: "center", justifyContent: "center" },
});
