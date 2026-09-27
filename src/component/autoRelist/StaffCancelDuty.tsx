import ActionModal from "@/component/cards/jobs/ActionModal";
import { AUTO_RELIST_DEFAULTS, AUTO_RELIST_ENABLED, STAFF_CANCEL_REASONS, minutesToStart } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { autoRelistAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

const CANCELLABLE = ["assigned", "enroute"];

// Staff: cancel an accepted duty. Inside the cutoff it's a no-show, not a cancellation.
export default function StaffCancelDuty({
  duty,
  onCancelled,
  style,
}: {
  duty: any;
  onCancelled: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!AUTO_RELIST_ENABLED || !duty || !CANCELLABLE.includes(duty.status)) return null;

  const cutoff = AUTO_RELIST_DEFAULTS.staffCutoffMinutes;
  const mins = minutesToStart(duty);
  const tooLate = mins !== null && mins < cutoff;

  const confirm = async (reason: string, note: string) => {
    if (reason === "other_staff" && !note.trim()) {
      setError("Tell the hospital why in a few words.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await autoRelistAPI.cancelAsStaff(duty._id ?? duty.id, reason, note.trim() || undefined);
      setOpen(false);
      onCancelled();
    } catch (err: any) {
      setError(apiError(err, "Could not cancel. Try again, or contact the hospital."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <Ionicons name="calendar-clear-outline" size={18} color={tooLate ? "#B45309" : COLORS.subText} />
        <Text style={styles.title}>Can't make this shift?</Text>
      </View>
      {tooLate ? (
        <>
          <Text style={styles.body}>
            It's less than {cutoff} minutes to the start, so the duty can't be cancelled here any more. Call the hospital
            now. Not turning up counts as a no-show.
          </Text>
          <TouchableOpacity onPress={() => router.push("/medicalStaff/support" as any)}>
            <Text style={styles.link}>Contact support</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            You can cancel up to {cutoff} minutes before the start. Please do it as early as you can so the hospital can
            find someone else.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => { setError(null); setOpen(true); }} activeOpacity={0.8}>
            <Text style={styles.btnText}>Cancel This Duty</Text>
          </TouchableOpacity>
        </>
      )}

      <ActionModal
        visible={open}
        title="Cancel this duty?"
        message="The hospital is told straight away and the duty goes back on the board. You won't be able to take this duty again, and cancellations count towards your account standing."
        reasons={STAFF_CANCEL_REASONS}
        notePlaceholder="Add a note for the hospital (needed for 'Something else')"
        confirmLabel="Cancel Duty"
        tone="danger"
        loading={busy}
        error={error}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 16, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "700", color: "#111827" },
  body: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  btn: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginTop: 2 },
  btnText: { fontSize: 13, fontWeight: "700", color: COLORS.red },
});
