import { COLORS } from "@/constant/colors";
import { AdminCapability } from "@/constant/adminCapabilities";
import { useCapability } from "@/hooks/useCapability";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Shows the page only to admin roles that have the capability. The API checks it too.
export default function CapabilityGate({ capability, children }: { capability: AdminCapability; children: React.ReactNode }) {
  const { can, subRole } = useCapability();
  if (!subRole) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  if (!can(capability)) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={32} color={COLORS.subText} />
        <Text style={styles.text}>Your admin role doesn't have access to this page.</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24, backgroundColor: COLORS.background },
  text: { fontSize: 14, color: COLORS.subText, textAlign: "center" },
});
