import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { GRIEVANCE_OFFICER } from "@/constant/support";
import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Grievance officer contact, shown only once the client's details are configured.
export default function GrievanceOfficerCard() {
  const styles = useStylesThemed();
  const th = useTheme();
  const g = GRIEVANCE_OFFICER;
  if (!g) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <TIcon ion="person-circle-outline" size={20} color={th.c.primary} />
        <Text style={styles.title}>Grievance officer</Text>
      </View>
      <Text style={styles.muted}>If you're not satisfied with how a ticket was handled, you can write to our grievance officer.</Text>
      <Text style={styles.name}>
        {g.name}
        {g.designation ? <Text style={styles.muted}> · {g.designation}</Text> : null}
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${g.email}`)} style={styles.row}>
        <TIcon ion="mail-outline" size={15} color={th.c.primary} />
        <Text style={styles.link}>{g.email}</Text>
      </TouchableOpacity>
      {!!g.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${g.phone}`)} style={styles.row}>
          <TIcon ion="call-outline" size={15} color={th.c.primary} />
          <Text style={styles.link}>{g.phone}</Text>
        </TouchableOpacity>
      )}
      {!!g.address && (
        <View style={styles.row}>
          <TIcon ion="location-outline" size={15} color={th.c.subText} />
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

const make_styles = (t: Theme) => ({
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 18 : 14, borderWidth: 1, borderColor: t.c.border, padding: 20, gap: 8, marginTop: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, ...t.f("700"), color: t.c.text },
  name: { fontSize: 14, ...t.f("700"), color: t.c.text },
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  link: { fontSize: 13, ...t.f("600"), color: t.c.primary },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19, flexShrink: 1 },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
