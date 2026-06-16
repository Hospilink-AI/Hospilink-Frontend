import NotificationsCenterScreen from "@/component/layout/NotificationCenter";
import { View, StyleSheet } from "react-native";

export default function NotificationsPage() {
  return (
    <View style={styles.container}>
      <NotificationsCenterScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
});
