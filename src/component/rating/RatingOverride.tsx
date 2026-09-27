import DateTimeField from "@/component/common/DateTimeField";
import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { TICKET_TEXT_MAX } from "@/constant/support";
import { useCapability } from "@/hooks/useCapability";
import { ratingOverrideAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const STEPS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
// off until POST /api/admin/rating-overrides exists on the server
const OVERRIDE_ENABLED = false;

interface Props {
  kind: "hospital" | "staff";
  profileId: string;
  name?: string;
  current?: number | null;
}

// Admin: propose a manual rating for a hospital or staff member. A second admin approves it.
export default function RatingOverride({ kind, profileId, name, current }: Props) {
  const { can } = useCapability();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Rating changes need Operations level or above
  if (!OVERRIDE_ENABLED || !can(kind === "hospital" ? "hospital.manage" : "staff.manage")) return null;

  const reset = () => {
    setValue(null);
    setReason("");
    setUntil(null);
    setError(null);
  };

  const submit = async () => {
    if (value == null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await ratingOverrideAPI.propose({
        profileType: kind,
        profileId,
        value,
        reason: reason.trim(),
        ...(until && { expiresAt: until.toISOString() }),
      });
      setDone(res?.ticket?.ticketId ?? "");
      setOpen(false);
      reset();
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Rating adjustments aren't available yet. The server side is still being built."
          : apiError(err, "Could not send the adjustment.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <TouchableOpacity style={styles.btn} onPress={() => { reset(); setDone(null); setOpen(true); }}>
        <Ionicons name="create-outline" size={14} color={COLORS.primary} />
        <Text style={styles.btnText}>Adjust rating</Text>
      </TouchableOpacity>
      {done !== null && (
        <Text style={styles.ok}>
          Sent for approval{done ? ` (${done})` : ""}. A second admin has to approve it before it takes effect.
        </Text>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.box} onPress={() => {}}>
            <Text style={styles.title}>Adjust rating</Text>
            <Text style={styles.muted}>
              {name ? `${name}. ` : ""}Current rating: {typeof current === "number" ? current.toFixed(1) : "Unrated"}.
              The new rating shows instead of the calculated one until you remove it or it ends. The person is told, with your reason.
            </Text>

            <Text style={styles.label}>New rating</Text>
            <View style={styles.chips}>
              {STEPS.map((v) => (
                <TouchableOpacity key={v} style={[styles.chip, value === v && styles.chipOn]} onPress={() => setValue(v)}>
                  <Text style={[styles.chipText, value === v && styles.chipTextOn]}>{v.toFixed(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={(t) => setReason(t.slice(0, TICKET_TEXT_MAX))}
              placeholder="Why is this rating being adjusted?"
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <Text style={styles.label}>Ends on (optional)</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <DateTimeField mode="date" value={until} onChange={setUntil} minimumDate={new Date()} placeholder="No end date" />
              </View>
              {!!until && (
                <TouchableOpacity onPress={() => setUntil(null)}>
                  <Text style={styles.link}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.notice}>
              <Ionicons name="people-outline" size={15} color="#92400E" />
              <Text style={styles.noticeText}>A second admin has to approve this before it takes effect.</Text>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primary, (value == null || !reason.trim() || saving) && { opacity: 0.5 }]}
                disabled={value == null || !reason.trim() || saving}
                onPress={submit}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send for Approval</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  btnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  ok: { fontSize: 12, color: "#047857" },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  box: { width: "100%", maxWidth: 480, backgroundColor: COLORS.white, borderRadius: 14, padding: 18, gap: 8 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 46, alignItems: "center" },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextOn: { color: COLORS.primary, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, minHeight: 80, fontSize: 13, color: COLORS.text, textAlignVertical: "top" },
  link: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  notice: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFBEB", borderRadius: 8, padding: 8, marginTop: 4 },
  noticeText: { fontSize: 12, color: "#92400E", flex: 1 },
  error: { fontSize: 13, color: COLORS.red },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  cancel: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  primary: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, minWidth: 150, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
