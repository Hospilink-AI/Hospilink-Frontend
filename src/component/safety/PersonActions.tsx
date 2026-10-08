import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { COLORS } from "@/constant/colors";
import { blockAPI, reviewAPI } from "@/service/api";
import { emitBlockChange } from "@/service/blocks";
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
  const s = useSThemed();
  const th = useTheme();
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
        <TIcon ion="ellipsis-horizontal" size={label ? 16 : 20} color={color} />
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
                <TIcon ion="checkmark-circle" size={30} color={th.hex("#047857")} style={{ alignSelf: "center" }} />
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
                  placeholderTextColor={th.hex("#94A3B8")}
                  accessibilityLabel="Reason"
                />
                {error && <Text style={s.error}>{error}</Text>}
                <Buttons busy={busy} confirm="Send report" onCancel={() => setStep("menu")} onConfirm={sendReviewReport} />
              </>
            )}

            {step === "reviewReported" && (
              <>
                <TIcon ion="checkmark-circle" size={30} color={th.hex("#047857")} style={{ alignSelf: "center" }} />
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
  const s = useSThemed();
  const c = danger ? COLORS.red : COLORS.text;
  return (
    <TouchableOpacity style={s.item} onPress={onPress} accessibilityRole="button">
      <TIcon ion={icon} size={20} color={c} />
      <Text style={[s.itemText, { color: c }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Buttons({ busy, confirm, danger, onCancel, onConfirm }: { busy: boolean; confirm: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const s = useSThemed();
  const th = useTheme();
  return (
    <View style={s.row}>
      <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onCancel} disabled={busy}>
        <Text style={s.btnGhostText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, danger ? s.btnDanger : s.btnPrimary, busy && { opacity: 0.6 }]} onPress={onConfirm} disabled={busy}>
        {busy ? <ActivityIndicator color={th.hex("#fff")} /> : <Text style={s.btnPrimaryText}>{confirm}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const make_s = (t: Theme) => ({
  trigger: { padding: 4, borderRadius: t.v2 ? 12 : 8 },
  triggerLabelled: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 8, borderWidth: 1, borderColor: t.c.border },
  triggerText: { fontSize: 12, ...t.f("600") },
  backdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 380, backgroundColor: t.c.surface, borderRadius: t.v2 ? 20 : 16, padding: 20, gap: 10 },
  title: { fontSize: 17, ...t.f("700"), color: t.c.text },
  body: { ...t.f(), fontSize: 14, color: t.hex("#334155"), lineHeight: 20 },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 18 },
  error: { ...t.f(), fontSize: 13, color: t.hex("#B91C1C") },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.hex("#F1F5F9") },
  itemText: { fontSize: 15, ...t.f("600") },
  cancel: { alignItems: "center", paddingTop: 8 },
  cancelText: { fontSize: 14, color: t.c.subText, ...t.f("600") },
  input: { ...t.f(),
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.v2 ? 14 : 10,
    padding: 10,
    minHeight: 90,
    fontSize: 14,
    color: t.c.text,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: t.v2 ? 14 : 10, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: t.hex("#F1F5F9") },
  btnGhostText: { color: t.c.text, ...t.f("600"), fontSize: 14 },
  btnPrimary: { backgroundColor: t.c.primary },
  btnDanger: { backgroundColor: t.c.danger },
  btnPrimaryText: { color: t.hex("#fff"), ...t.f("700"), fontSize: 14 },
} as const);
const useSThemed = () => useThemedStyles(make_s as any) as any;
