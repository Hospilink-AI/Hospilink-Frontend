import AutoRelistOption from "@/component/autoRelist/AutoRelistOption";
import InviteSection, { inviteFields } from "@/component/dutyInvites/InviteSection";
import { InviteCard } from "@/constant/dutyInvites";
import DateTimeField from "@/component/common/DateTimeField";
import { SelectSheet } from "@/component/common/FilterSheet";
import { AUTO_RELIST_ENABLED } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import {
  addDays,
  CREATE_URGENCY,
  dayTitle,
  isOvernight,
  MAX_SLOTS,
  MIN_LEAD_MINUTES,
  minutesUntil,
  SUB_TYPE_LABELS,
} from "@/constant/dutyCalendar";
import { apiError, JOB_ROLES, roleLabel } from "@/constant/jobs";
import { dutyAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const hhmm = (d: Date | null) =>
  d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";

// Inline create on the selected date: role, times, rate and a quantity stepper.
// The stepper sends staff_count; the server creates that many duties and sends one notification.
export default function CreateDutyCard({
  date,
  onPosted,
  onCancel,
}: {
  date: string;
  onPosted: (count: number) => void;
  onCancel?: () => void;
}) {
  const [role, setRole] = useState("");
  const [subType, setSubType] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [rate, setRate] = useState("");
  const [count, setCount] = useState(1);
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");
  const [autoRelist, setAutoRelist] = useState(true);
  const [invitees, setInvitees] = useState<InviteCard[]>([]);
  const [openAfter, setOpenAfter] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const startText = hhmm(start);
  const endText = hhmm(end);
  const overnight = isOvernight(startText, endText);

  const post = async () => {
    setError(null);
    if (!role) return setError("Choose a role.");
    if (role === "rmo" && !subType) return setError("Choose ward, ICU or casualty for an RMO duty.");
    if (!startText || !endText) return setError("Set a start and end time.");
    if (startText === endText) return setError("The end time must be different from the start time.");
    const lead = minutesUntil(date, startText);
    if (lead !== null && lead < MIN_LEAD_MINUTES) {
      return setError(`The duty must start at least ${MIN_LEAD_MINUTES} minutes from now.`);
    }
    const r = Number(rate);
    if (!rate || isNaN(r) || r <= 0) return setError("Enter a rate per hour.");

    setPosting(true);
    try {
      await dutyAPI.createDuty({
        staff_role: role,
        date,
        ...(overnight && { end_date: addDays(date, 1) }),
        start_time: startText,
        end_time: endText,
        urgency,
        ...(notes.trim() && { description: notes.trim() }),
        offered_rate: r,
        is_overnight_duty: overnight,
        staff_count: count,
        ...(role === "rmo" && { duty_sub_type: subType }),
        ...(AUTO_RELIST_ENABLED && { auto_relist_enabled: autoRelist }),
        ...inviteFields(invitees, openAfter),
      });
      onPosted(count);
    } catch (err: any) {
      setError(apiError(err, "Couldn't post the duty. Please try again."));
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Post a duty on {dayTitle(date)}</Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close">
            <Ionicons name="close" size={20} color={COLORS.subText} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Role</Text>
      <TouchableOpacity style={styles.select} onPress={() => setPicking(true)}>
        <Text style={[styles.selectText, !role && { color: COLORS.subText }]} numberOfLines={1}>
          {role ? roleLabel(role) : "Choose a role"}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.subText} />
      </TouchableOpacity>

      {role === "rmo" && (
        <View style={styles.chips}>
          {Object.entries(SUB_TYPE_LABELS).map(([value, label]) => (
            <Chip key={value} label={label} on={subType === value} onPress={() => setSubType(value)} />
          ))}
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Start</Text>
          <DateTimeField mode="time" value={start} onChange={setStart} placeholder="Start time" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>End</Text>
          <DateTimeField mode="time" value={end} onChange={setEnd} placeholder="End time" />
        </View>
      </View>
      {overnight && (
        <Text style={styles.hint}>Overnight: ends on {dayTitle(addDays(date, 1))}. It shows on {dayTitle(date)}.</Text>
      )}

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Rate per hour (₹)</Text>
          <TextInput
            style={styles.input}
            value={rate}
            onChangeText={(v) => setRate(v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            placeholder="e.g. 1500"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>How many staff</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, count <= 1 && styles.dim]}
              disabled={count <= 1}
              onPress={() => setCount((c) => Math.max(1, c - 1))}
              accessibilityLabel="One fewer"
            >
              <Ionicons name="remove" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.count}>{count}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, count >= MAX_SLOTS && styles.dim]}
              disabled={count >= MAX_SLOTS}
              onPress={() => setCount((c) => Math.min(MAX_SLOTS, c + 1))}
              accessibilityLabel="One more"
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chips}>
        {CREATE_URGENCY.map((u) => (
          <Chip key={u.value} label={u.label} on={urgency === u.value} onPress={() => setUrgency(u.value)} />
        ))}
      </View>
      <Text style={styles.hint}>Need someone within the hour? Use Emergency on the dashboard.</Text>

      <Text style={styles.label}>Notes for staff (optional)</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
        placeholder="Ward, what to bring, who to report to"
        placeholderTextColor="#94A3B8"
      />

      <InviteSection
        source={{ kind: "hospital" }}
        role={role}
        date={date}
        startTime={startText || undefined}
        endTime={endText || undefined}
        invitees={invitees}
        onInvitees={setInvitees}
        openAfter={openAfter}
        onOpenAfter={setOpenAfter}
      />

      {AUTO_RELIST_ENABLED && <AutoRelistOption value={autoRelist} onChange={setAutoRelist} rate={rate} />}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={[styles.post, posting && { opacity: 0.6 }]} disabled={posting} onPress={post}>
        {posting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postText}>{count > 1 ? `Post ${count} duties` : "Post duty"}</Text>
        )}
      </TouchableOpacity>
      {count > 1 && !invitees.length && <Text style={styles.hint}>Nearby staff get one notification for all {count}.</Text>}

      <SelectSheet
        visible={picking}
        title="Role"
        options={JOB_ROLES}
        value={role}
        onSelect={(v) => {
          setRole(v);
          if (v !== "rmo") setSubType("");
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress} accessibilityState={{ selected: on }}>
      <Text style={[styles.chipText, on && { color: COLORS.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text, flexShrink: 1 },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  selectText: { fontSize: 14, color: COLORS.text, flexShrink: 1 },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  col: { flex: 1, minWidth: 140, gap: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  notes: { minHeight: 64, textAlignVertical: "top" },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignSelf: "flex-start" },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.35 },
  count: { minWidth: 36, textAlign: "center", fontSize: 16, fontWeight: "800", color: COLORS.text },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  hint: { fontSize: 11, color: COLORS.subText, lineHeight: 16 },
  error: { fontSize: 13, color: COLORS.red },
  post: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 6 },
  postText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
