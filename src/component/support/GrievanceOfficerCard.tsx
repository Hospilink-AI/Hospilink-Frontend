import { COLORS } from "@/constant/colors";
import { GRIEVANCE_OFFICER } from "@/constant/support";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Grievance officer contact, shown only once the client's details are configured.
export default function GrievanceOfficerCard() {
  const g = GRIEVANCE_OFFICER;
  if (!g) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Grievance officer</Text>
      </View>
      <Text style={styles.muted}>If you're not satisfied with how a ticket was handled, you can write to our grievance officer.</Text>
      <Text style={styles.name}>
        {g.name}
        {g.designation ? <Text style={styles.muted}> · {g.designation}</Text> : null}
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${g.email}`)} style={styles.row}>
        <Ionicons name="mail-outline" size={15} color={COLORS.primary} />
        <Text style={styles.link}>{g.email}</Text>
      </TouchableOpacity>
      {!!g.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${g.phone}`)} style={styles.row}>
          <Ionicons name="call-outline" size={15} color={COLORS.primary} />
          <Text style={styles.link}>{g.phone}</Text>
        </TouchableOpacity>
      )}
      {!!g.address && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={15} color={COLORS.subText} />
          <Text style={styles.muted}>{g.address}</Text>
        </View>
      )}
      {(!!g.acknowledgeWithin || !!g.resolveWithin) && (
        <Text style={styles.muted}>
          {g.acknowledgeWithin ? `Acknowledged within ${g.acknowledgeWithin}.` : ""}
          {g.acknowledgeWithin && g.resolveWithin ? " " : ""}
          {g.resolveWithin ? `Resolved within ${g.resolveWithin}.` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 20, gap: 8, marginTop: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  link: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19, flexShrink: 1 },
});
