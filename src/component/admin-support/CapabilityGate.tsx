import { COLORS } from "@/constant/colors";
import { AdminCapability } from "@/constant/adminCapabilities";
import { useCapability } from "@/hooks/useCapability";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

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
  // the admin layout sends blocked roles to their landing page
  if (!can(capability)) return null;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24, backgroundColor: COLORS.background },
});
