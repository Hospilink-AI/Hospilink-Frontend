import { COLORS } from "@/constant/colors";
import { DUTY_INVITES_ENABLED, INVITE_WINDOW_MINUTES, InviteCard } from "@/constant/dutyInvites";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import InvitePicker, { PickerSource } from "./InvitePicker";

// Invite named doctors on a duty form. The parent sends invite_staff_ids and open_after_invite
// (see inviteFields) with the existing create body.
export default function InviteSection({
  source,
  role,
  date,
  startTime,
  endTime,
  invitees,
  onInvitees,
  openAfter,
  onOpenAfter,
  emergency,
}: {
  source: PickerSource | null;
  role: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  invitees: InviteCard[];
  onInvitees: (cards: InviteCard[]) => void;
  openAfter: boolean;
  onOpenAfter: (v: boolean) => void;
  emergency?: boolean;
}) {
  const [picking, setPicking] = useState(false);

  // invitees must be of the duty's role; drop the rest when the role changes
  useEffect(() => {
    if (invitees.some((c) => c.jobRole && c.jobRole !== role)) onInvitees(invitees.filter((c) => !c.jobRole || c.jobRole === role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!DUTY_INVITES_ENABLED) return null;

  const blocked = !role ? "Choose a role first." : !source ? "Choose a hospital first." : null;

  return (
    <View style={s.box}>
      <Text style={s.heading}>Invite doctors (optional)</Text>
      <Text style={s.muted}>Send this duty to doctors you choose before anyone else.</Text>

      {invitees.length > 0 && (
        <View style={s.chips}>
          {invitees.map((c) => (
            <View key={c.staffId} style={s.chip}>
              <Text style={s.chipText} numberOfLines={1}>
                {c.name}
              </Text>
              <TouchableOpacity
                onPress={() => onInvitees(invitees.filter((x) => x.staffId !== c.staffId))}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel={`Remove ${c.name}`}
              >
                <Ionicons name="close" size={14} color={COLORS.subText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[s.pick, !!blocked && { opacity: 0.5 }]} disabled={!!blocked} onPress={() => setPicking(true)}>
        <Ionicons name="person-add-outline" size={16} color={COLORS.primary} />
        <Text style={s.pickText}>{invitees.length ? "Change invited doctors" : "Choose doctors"}</Text>
      </TouchableOpacity>
      {!!blocked && <Text style={s.muted}>{blocked}</Text>}

      {invitees.length > 0 && (
        <View style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleLabel}>Open to other doctors if no invitee accepts</Text>
            <Text style={s.muted}>
              {openAfter
                ? `Invited doctors get the first ${INVITE_WINDOW_MINUTES} minutes. Then it goes to ${emergency ? "doctors across your city" : "nearby doctors"}.`
                : "Only the doctors you invite can see and accept this duty."}
            </Text>
          </View>
          <Switch
            value={openAfter}
            onValueChange={onOpenAfter}
            trackColor={{ true: "#93C5FD", false: "#CBD5E1" }}
            thumbColor={openAfter ? COLORS.primary : "#F8FAFC"}
            {...({ activeThumbColor: COLORS.primary, activeTrackColor: "#93C5FD" } as any)}
            accessibilityLabel="Open to other doctors if no invitee accepts"
          />
        </View>
      )}

      {!!source && !!role && (
        <InvitePicker
          visible={picking}
          onClose={() => setPicking(false)}
          source={source}
          role={role}
          date={date}
          startTime={startTime}
          endTime={endTime}
          selected={invitees}
          onDone={onInvitees}
        />
      )}
    </View>
  );
}

// The two fields the create body takes; nothing when no one is invited
export const inviteFields = (invitees: InviteCard[], openAfter: boolean) =>
  DUTY_INVITES_ENABLED && invitees.length
    ? { invite_staff_ids: invitees.map((c) => c.staffId), open_after_invite: openAfter }
    : {};

const s = StyleSheet.create({
  box: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, gap: 8, backgroundColor: "#FAFBFF" },
  heading: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 999, paddingLeft: 10, paddingRight: 8, paddingVertical: 5, maxWidth: 220 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#1D4ED8", flexShrink: 1 },
  pick: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.white },
  pickText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  toggleLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text },
});
