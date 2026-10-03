import { COLORS } from "@/constant/colors";
import { DUTY_INVITES_ENABLED, InviteCard, MAX_INVITEES } from "@/constant/dutyInvites";
import { roleLabel } from "@/constant/jobs";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { setPendingInvites } from "./pendingInvites";

// Doctors picked on the hospital map: one tap opens the duty form with them invited.
export default function MapInviteBar({ picked, onClear }: { picked: InviteCard[]; onClear: () => void }) {
  const router = useRouter();
  if (!DUTY_INVITES_ENABLED || picked.length === 0) return null;

  const roles = [...new Set(picked.map((c) => c.jobRole).filter(Boolean))] as string[];
  const mixed = roles.length > 1;

  return (
    <View style={s.bar}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.title}>
          {picked.length} {picked.length === 1 ? "doctor" : "doctors"} picked
          {roles.length === 1 ? ` · ${roleLabel(roles[0])}` : ""}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {mixed ? "A duty is for one role. Pick doctors of the same role." : picked.map((c) => c.name).join(", ")}
        </Text>
      </View>
      <TouchableOpacity onPress={onClear} style={s.clear} accessibilityLabel="Clear picked doctors">
        <Text style={s.clearText}>Clear</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.go, mixed && { opacity: 0.5 }]}
        disabled={mixed}
        onPress={() => {
          setPendingInvites(picked.slice(0, MAX_INVITEES), roles[0]);
          router.push("/hospital/create-duty" as any);
        }}
      >
        <Text style={s.goText}>Post a duty for them</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  clear: { paddingHorizontal: 10, paddingVertical: 8 },
  clearText: { fontSize: 13, fontWeight: "600", color: COLORS.subText },
  go: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  goText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
