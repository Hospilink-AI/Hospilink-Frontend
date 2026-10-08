import PhoneHeader from "@/hospital/PhoneHeader";
import NotificationsCenterScreen from "@/component/layout/NotificationCenter";
import InAppCenter from "@/component/inAppNotifications/InAppCenter";
import { INAPP_NOTIFICATIONS_ENABLED } from "@/constant/inAppNotifications";
import { View, StyleSheet } from "react-native";

export default function NotificationsPage() {
  return (
    <>
      <PhoneHeader title="Notifications" fallback="/hospital/dashboard" />
      <View style={{ flex: 1 }}>
        {INAPP_NOTIFICATIONS_ENABLED ? (
          <InAppCenter />
        ) : (
          <NotificationsCenterScreen />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
});
