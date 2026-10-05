import { COLORS } from "@/constant/colors";
import { blockAPI, reviewAPI } from "@/service/api";
import { emitBlockChange } from "@/service/blocks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// "⋯" menu next to a hospital or doctor: block them, report them through support, and (on a
// review) report the review. `kind` is the other party: a doctor sees hospitals, a hospital sees doctors.

type Props = {
  kind: "hospital" | "staff";
  id: string; // Hospital or MedicalStaff profile id
  name?: string;
  dutyId?: string; // pre-selects the duty in the support form
  reviewId?: string; // adds "Report review"
  onBlocked?: (res: { upcomingDuties?: number }) => void;
  color?: string;
  label?: string; // text next to the icon, where a bare "⋯" would be unclear (map pop-up)
};

type Step = "menu" | "confirmBlock" | "blocked" | "reportReview" | "reviewReported";

export default function PersonActions({ kind, id, name, dutyId, reviewId, onBlocked, color = COLORS.subText, label }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [reason, setReason] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);

  const isHospital = kind === "hospital";
  const noun = isHospital ? "hospital" : "doctor";
  const who = name || `this ${noun}`;

  const show = () => {
    setStep("menu");
    setError(null);
    setReason("");
    setOpen(true);
  };
  const close = () => {
    if (!busy) setOpen(false);
  };

  const block = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = isHospital ? await blockAPI.blockHospital(id) : await blockAPI.blockStaff(id);
      setUpcoming(Number(res?.upcomingDuties) || 0);
      setStep("blocked");
      emitBlockChange();
      onBlocked?.(res ?? {});
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't block. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reportPerson = () => {
    setOpen(false);
    const base = isHospital ? "/medicalStaff/support/new" : "/hospital/support/new";
    const category = isHospital ? "duty.conduct_hospital" : "duty.conduct_staff";
    router.push({ pathname: base as any, params: { category, ...(dutyId ? { subjectId: dutyId } : {}) } });
  };

  const sendReviewReport = async () => {
    if (!reviewId) return;
    if (!reason.trim()) {
      setError("Please say what is wrong with this review.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await reviewAPI.report(reviewId, reason.trim());
      setTicketId(res?.ticket?.ticketId ?? null);
      setStep("reviewReported");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't send the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${who}`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[s.trigger, !!label && s.triggerLabelled]}
      >
        <Ionicons name="ellipsis-horizontal" size={label ? 16 : 20} color={color} />
        {!!label && <Text style={[s.triggerText, { color }]}>{label}</Text>}
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close}>
          <TouchableOpacity activeOpacity={1} style={s.card}>
            {step === "menu" && (
              <>
                <Text style={s.title} numberOfLines={2}>{who}</Text>
                {reviewId && (
                  <Item icon="flag-outline" label="Report review" onPress={() => setStep("reportReview")} />
                )}
                <Item icon="alert-circle-outline" label={`Report ${noun}`} onPress={reportPerson} />
                <Item icon="ban-outline" label={`Block ${noun}`} danger onPress={() => setStep("confirmBlock")} />
                <TouchableOpacity onPress={close} style={s.cancel}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "confirmBlock" && (
              <>
                <Text style={s.title}>Block {who}?</Text>
                <Text style={s.body}>
                  {isHospital
                    ? "They won't see you and you won't see their duties, and they can't invite you."
                    : "They won't see your duties and they can't be invited."}{" "}
                  Existing accepted duties are not cancelled.
                </Text>
                {error && <Text style={s.error}>{error}</Text>}
                <Buttons
                  busy={busy}
                  confirm={`Block ${noun}`}
                  danger
                  onCancel={() => setStep("menu")}
                  onConfirm={block}
                />
              </>
            )}

            {step === "blocked" && (
              <>
                <Ionicons name="checkmark-circle" size={30} color="#047857" style={{ alignSelf: "center" }} />
                <Text style={[s.title, { textAlign: "center" }]}>{who} is blocked</Text>
                {upcoming > 0 && (
                  <Text style={s.body}>
                    You still have {upcoming} accepted {upcoming === 1 ? "duty" : "duties"} with them. Cancel{" "}
                    {upcoming === 1 ? "it" : "them"} from the duty screen if needed.
                  </Text>
                )}
                <Text style={s.muted}>You can unblock them in Profile → Account settings.</Text>
                <TouchableOpacity onPress={() => setOpen(false)} style={[s.btn, s.btnPrimary]}>
                  <Text style={s.btnPrimaryText}>Done</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "reportReview" && (
              <>
                <Text style={s.title}>Report review</Text>
                <Text style={s.body}>Tell us what is wrong with this review. Our team will look into it.</Text>
                <TextInput
                  style={s.input}
                  value={reason}
                  onChangeText={(t) => {
                    setReason(t);
                    setError(null);
                  }}
                  multiline
                  maxLength={1000}
                  placeholder="What's wrong with this review?"
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel="Reason"
                />
                {error && <Text style={s.error}>{error}</Text>}
                <Buttons busy={busy} confirm="Send report" onCancel={() => setStep("menu")} onConfirm={sendReviewReport} />
              </>
            )}

            {step === "reviewReported" && (
              <>
                <Ionicons name="checkmark-circle" size={30} color="#047857" style={{ alignSelf: "center" }} />
                <Text style={[s.title, { textAlign: "center" }]}>Thanks, our team will look into it</Text>
                {ticketId && <Text style={[s.body, { textAlign: "center" }]}>Ticket {ticketId}. You can follow it in My Tickets.</Text>}
                <TouchableOpacity onPress={() => setOpen(false)} style={[s.btn, s.btnPrimary]}>
                  <Text style={s.btnPrimaryText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function Item({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
  const c = danger ? COLORS.red : COLORS.text;
  return (
    <TouchableOpacity style={s.item} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={c} />
      <Text style={[s.itemText, { color: c }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Buttons({ busy, confirm, danger, onCancel, onConfirm }: { busy: boolean; confirm: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <View style={s.row}>
      <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onCancel} disabled={busy}>
        <Text style={s.btnGhostText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, danger ? s.btnDanger : s.btnPrimary, busy && { opacity: 0.6 }]} onPress={onConfirm} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>{confirm}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: { padding: 4, borderRadius: 8 },
  triggerLabelled: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border },
  triggerText: { fontSize: 12, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 380, backgroundColor: COLORS.white, borderRadius: 16, padding: 20, gap: 10 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  body: { fontSize: 14, color: "#334155", lineHeight: 20 },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 18 },
  error: { fontSize: 13, color: "#B91C1C" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  itemText: { fontSize: 15, fontWeight: "600" },
  cancel: { alignItems: "center", paddingTop: 8 },
  cancelText: { fontSize: 14, color: COLORS.subText, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    minHeight: 90,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: "#F1F5F9" },
  btnGhostText: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDanger: { backgroundColor: COLORS.red },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
