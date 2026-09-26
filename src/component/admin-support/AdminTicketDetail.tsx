import DecisionPanel from "@/component/admin-support/DecisionPanel";
import { PriorityPill } from "@/component/admin-support/TicketQueue";
import ActionModal from "@/component/cards/jobs/ActionModal";
import EvidencePicker from "@/component/support/EvidencePicker";
import { TicketStatusPill } from "@/component/support/TicketList";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import {
  OUTCOME_LABELS,
  PickedFile,
  QUEUE_LABELS,
  RESOLUTION_CLASS_LABELS,
  TICKET_CATEGORIES,
  TICKET_DOMAINS,
  TICKET_PRIORITIES,
  TICKET_STATUS_LABELS,
  TICKET_TEXT_MAX,
  TicketStatus,
  actionLabel,
  categoryLabel,
} from "@/constant/support";
import { useAuth } from "@/context/AuthContext";
import { useCapability } from "@/hooks/useCapability";
import { adminAPI, adminTicketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type Modal = null | "reassign" | "recategorize" | "priority" | "requestInfo" | "return";

const when = (iso?: string | null) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : "—");
const idOf = (v: any) => (v && typeof v === "object" ? v._id ?? v.id : v) ?? null;
const shortId = (v: any) => (idOf(v) ? `…${String(idOf(v)).slice(-6)}` : "—");

export default function AdminTicketDetail() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { user } = useAuth();
  const { can } = useCapability();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [admins, setAdmins] = useState<any[] | null>(null);
  const [reassignTo, setReassignTo] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminTicketAPI.getById(ticketId);
      setTicket(res.ticket);
    } catch (err: any) {
      setError(apiError(err, "Could not load this ticket."));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (key: string, fn: () => Promise<any>, fallback: string, inModal = false) => {
    setBusy(key);
    inModal ? setModalError(null) : setActionError(null);
    try {
      const res = await fn();
      if (res?.ticket) setTicket(res.ticket);
      setModal(null);
      return res;
    } catch (err: any) {
      const msg = apiError(err, fallback);
      inModal ? setModalError(msg) : setActionError(msg);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const openModal = async (kind: Modal) => {
    setModalError(null);
    setModal(kind);
    if (kind === "reassign" && !admins?.length) {
      setAdmins(null);
      try {
        const res = await adminAPI.getAdminList();
        const list = res?.data ?? res?.admins ?? res ?? [];
        setAdmins(Array.isArray(list) ? list.filter((a: any) => a.isActive !== false) : []);
      } catch {
        setAdmins([]);
      }
    }
  };

  if (loading && !ticket) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <View style={[styles.container, styles.center, { gap: 10, padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={32} color={COLORS.red} />
        <Text style={styles.muted}>{error ?? "Ticket not found."}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Text style={styles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const me = user?.id ?? null;
  const assignedToMe = !!me && idOf(ticket.assignedTo) === me;
  const decidedByMe = !!me && idOf(ticket.decidedBy) === me;
  const active = !["RESOLVED", "REJECTED", "WITHDRAWN", "DUPLICATE", "AUTO_CLOSED", "CLOSED", "APPEALED"].includes(ticket.status);
  const claimable = !ticket.assignedTo && ["NEW", "TRIAGE"].includes(ticket.status) && can("ticket.claim");
  const canManage = active && !!ticket.assignedTo && can("ticket.claim");
  const canDecide = assignedToMe && ticket.status === "IN_REVIEW" && can("ticket.decide");
  const canApprove = ticket.status === "PENDING_APPROVAL" && can("ticket.approve") && !decidedByMe;
  const priority = ticket.priorityOverride?.value || ticket.priority;
  const ctx = ticket.linkedContext ?? {};
  const statement = ticket.respondentStatement;

  const main = (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <PriorityPill value={priority} />
            <Text style={styles.ticketId}>{ticket.ticketId}</Text>
          </View>
          <TicketStatusPill status={ticket.status} />
        </View>
        <Text style={styles.title}>{categoryLabel(ticket.category)}</Text>
        <Text style={styles.muted}>
          {RESOLUTION_CLASS_LABELS[ticket.resolutionClass] ?? ticket.resolutionClass} · {QUEUE_LABELS[ticket.queue] ?? ticket.queue} queue ·{" "}
          {ticket.source === "CHATBOT" ? "Chatbot" : ticket.source === "IN_APP_FORM" ? "Form" : ticket.source}
          {ticket.language && ticket.language !== "en" ? ` · ${ticket.language.toUpperCase()}` : ""}
        </Text>
        {ticket.appealOf && <Text style={styles.warn}>This is an appeal. Someone other than the original decider must decide it.</Text>}
        {ticket.botCategory && ticket.botCategory !== ticket.category && (
          <Text style={styles.muted}>Bot suggested: {categoryLabel(ticket.botCategory)}</Text>
        )}
        <Text style={styles.label}>What the user said</Text>
        <Text style={styles.body}>{ticket.statusHistory?.[0]?.reason ?? "—"}</Text>
      </View>

      {(ctx.duty || ctx.application || ctx.payment) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Linked record</Text>
          {ctx.duty && (
            <Text style={styles.body}>
              Duty {shortId(ctx.duty._id)} · {ctx.duty.staffRole ?? "—"} · {formatDate(ctx.duty.date)} {ctx.duty.startTime ?? ""}–{ctx.duty.endTime ?? ""} · status {ctx.duty.status}
            </Text>
          )}
          {ctx.application && (
            <Text style={styles.body}>
              Application {shortId(ctx.application._id)} · status {ctx.application.status}
              {ctx.application.interview?.confirmedSlot?.start ? ` · interview ${when(ctx.application.interview.confirmedSlot.start)}` : ""}
              {ctx.application.interview?.noShow?.by ? ` · no-show marked (${ctx.application.interview.noShow.by})` : ""}
            </Text>
          )}
          {ctx.payment && (
            <Text style={styles.body}>
              Payment · {ctx.payment.paymentMethod ?? "—"} · {ctx.payment.isPaid ? "paid" : "not paid"} · ₹{ctx.payment.totalPayment ?? ctx.payment.offeredRate ?? "—"}
            </Text>
          )}
        </View>
      )}

      {ticket.raisedAgainst && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Other side's reply</Text>
          <Text style={styles.muted}>
            Notified {when(ticket.respondentNotifiedAt)} · reply due {when(ticket.respondentDeadline)}
          </Text>
          {statement?.submittedAt ? (
            <>
              <Text style={styles.label}>Replied {when(statement.submittedAt)}{statement.lapsed ? " (after the window)" : ""}</Text>
              <Text style={styles.body}>{statement.text}</Text>
            </>
          ) : (
            <Text style={styles.body}>{statement?.lapsed ? "No reply within the window." : "No reply yet."}</Text>
          )}
        </View>
      )}

      {(ticket.resolutionOutcome || ticket.actionTakenStatement) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {ticket.status === "PENDING_APPROVAL" ? "Proposed decision" : "Decision"}
          </Text>
          {!!ticket.resolutionOutcome && <Text style={styles.body}>Outcome: {OUTCOME_LABELS[ticket.resolutionOutcome] ?? ticket.resolutionOutcome}</Text>}
          {(ticket.resolutionActions ?? []).map((a: any, i: number) => (
            <Text key={i} style={styles.muted}>• {actionLabel(a.action)}</Text>
          ))}
          {!!ticket.actionTakenStatement && (
            <>
              <Text style={styles.label}>Statement sent to both sides</Text>
              <Text style={styles.body}>{ticket.actionTakenStatement}</Text>
            </>
          )}
          {canApprove && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, !!busy && styles.disabled]}
                disabled={!!busy}
                onPress={() => run("approve", () => adminTicketAPI.approve(ticket._id), "Could not approve.")}
              >
                {busy === "approve" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Approve & Apply</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal("return")}>
                <Text style={styles.outlineText}>Send Back</Text>
              </TouchableOpacity>
            </View>
          )}
          {ticket.status === "PENDING_APPROVAL" && decidedByMe && (
            <Text style={styles.muted}>Waiting for another admin to approve your decision.</Text>
          )}
        </View>
      )}

      {canDecide && <DecisionPanel ticket={ticket} onDecided={setTicket} />}

      {!!ticket.assignedTo && <AdminChat ticket={ticket} canSend={can("ticket.claim") && active} />}
    </View>
  );

  const side = (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Work</Text>
        <Text style={styles.body}>
          {ticket.assignedTo ? (assignedToMe ? "Assigned to you" : `Assigned to admin ${shortId(ticket.assignedTo)}`) : "Unassigned"}
        </Text>
        {claimable && (
          <TouchableOpacity
            style={[styles.primaryBtn, !!busy && styles.disabled]}
            disabled={!!busy}
            onPress={() => run("claim", () => adminTicketAPI.claim(ticket._id), "Could not claim this ticket.")}
          >
            {busy === "claim" ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Claim Ticket</Text>}
          </TouchableOpacity>
        )}
        {canManage && (
          <View style={{ gap: 6 }}>
            {assignedToMe && ticket.status === "IN_REVIEW" && (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openModal("requestInfo")}>
                <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.linkText}>Ask the user for more information</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.linkBtn} onPress={() => openModal("reassign")}>
              <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.primary} />
              <Text style={styles.linkText}>Reassign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => { setNewDomain(ticket.domain); setNewCategory(null); openModal("recategorize"); }}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
              <Text style={styles.linkText}>Change category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => { setNewPriority(null); openModal("priority"); }}>
              <Ionicons name="flag-outline" size={16} color={COLORS.primary} />
              <Text style={styles.linkText}>Change priority</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!actionError && <Text style={styles.error}>{actionError}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Deadlines</Text>
        <Text style={styles.muted}>First reply by {when(ticket.slaFirstReplyBy)}{ticket.firstReplyAt ? " ✓" : ""}</Text>
        <Text style={styles.muted}>Decide by {when(ticket.slaDecideBy)}</Text>
        <Text style={styles.muted}>Final deadline {when(ticket.slaCeilingBy)}</Text>
        {!!ticket.slaPauseStartedAt && <Text style={styles.warn}>Clock paused while waiting for a reply.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>People</Text>
        <Text style={styles.muted}>Raised by {ticket.raisedBy?.role} {shortId(ticket.raisedBy?.user)}</Text>
        {ticket.raisedAgainst && <Text style={styles.muted}>About {ticket.raisedAgainst.role} {shortId(ticket.raisedAgainst.user)}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Evidence</Text>
        {(ticket.evidence ?? []).length === 0 ? (
          <Text style={styles.muted}>No files.</Text>
        ) : (
          ticket.evidence.map((e: any) => (
            <Text key={e._id ?? e.s3Key} style={styles.muted} numberOfLines={1}>
              • {e.originalFileName ?? "File"} · from {e.suppliedBy} · {formatDate(e.uploadedAt)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>History</Text>
        {(ticket.statusHistory ?? []).map((h: any, i: number) => (
          <View key={i} style={{ gap: 1 }}>
            <Text style={styles.body}>{TICKET_STATUS_LABELS[h.status as TicketStatus] ?? h.status}</Text>
            {!!h.reason && i > 0 && <Text style={styles.muted}>{h.reason}</Text>}
            <Text style={styles.small}>{when(h.timestamp)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const categoriesInDomain = TICKET_CATEGORIES.filter((c) => c.domain === newDomain && c.value !== ticket.category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/admin/tickets" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to tickets</Text>
      </TouchableOpacity>

      <View style={[styles.layout, !isWide && { flexDirection: "column" }]}>
        <View style={{ flex: 2 }}>{main}</View>
        <View style={{ flex: 1 }}>{side}</View>
      </View>

      <ActionModal
        visible={modal === "requestInfo"}
        title="Ask for more information"
        message="The user is notified. The clock pauses until they reply or add files."
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="What do you need from them?"
        confirmLabel="Send"
        loading={busy === "requestInfo"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => run("requestInfo", () => adminTicketAPI.requestInfo(ticket._id, note), "Could not send the request.", true)}
      />

      <ActionModal
        visible={modal === "reassign"}
        title="Reassign ticket"
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Reason for the handover"
        confirmLabel="Reassign"
        loading={busy === "reassign"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => {
          if (!reassignTo) {
            setModalError("Pick who to hand it to.");
            return;
          }
          run("reassign", () => adminTicketAPI.reassign(ticket._id, reassignTo, note), "Could not reassign.", true);
        }}
      >
        {admins === null ? (
          <ActivityIndicator color={COLORS.primary} style={{ alignSelf: "flex-start" }} />
        ) : admins.length === 0 ? (
          <Text style={styles.muted}>Couldn't load the admin list. Your role may not have access to it.</Text>
        ) : (
          admins
            .filter((a) => (a._id ?? a.id) !== me)
            .map((a) => {
              const id = a._id ?? a.id;
              const on = reassignTo === id;
              return (
                <TouchableOpacity key={id} style={[styles.option, on && styles.optionOn]} onPress={() => setReassignTo(id)}>
                  <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={18} color={on ? COLORS.primary : COLORS.subText} />
                  <Text style={styles.body}>{a.name ?? a.email}</Text>
                </TouchableOpacity>
              );
            })
        )}
      </ActionModal>

      <ActionModal
        visible={modal === "recategorize"}
        title="Change category"
        message="This may move the ticket to a different queue."
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Why the change?"
        confirmLabel="Change"
        loading={busy === "recategorize"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => {
          if (!newCategory) {
            setModalError("Pick the new category.");
            return;
          }
          run("recategorize", () => adminTicketAPI.recategorize(ticket._id, newCategory, note), "Could not change the category.", true);
        }}
      >
        <View style={styles.chips}>
          {TICKET_DOMAINS.map((d) => (
            <TouchableOpacity key={d.value} style={[styles.chip, newDomain === d.value && styles.chipOn]} onPress={() => { setNewDomain(d.value); setNewCategory(null); }}>
              <Text style={[styles.chipText, newDomain === d.value && styles.chipTextOn]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {categoriesInDomain.map((c) => {
          const on = newCategory === c.value;
          return (
            <TouchableOpacity key={c.value} style={[styles.option, on && styles.optionOn]} onPress={() => setNewCategory(c.value)}>
              <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={18} color={on ? COLORS.primary : COLORS.subText} />
              <Text style={styles.body}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ActionModal>

      <ActionModal
        visible={modal === "priority"}
        title="Change priority"
        message="A reason is needed when lowering it."
        showNote
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Reason"
        confirmLabel="Change"
        loading={busy === "priority"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => {
          if (!newPriority) {
            setModalError("Pick a priority.");
            return;
          }
          run("priority", () => adminTicketAPI.overridePriority(ticket._id, newPriority, note || undefined), "Could not change the priority.", true);
        }}
      >
        <View style={styles.chips}>
          {TICKET_PRIORITIES.filter((p) => p.value !== priority).map((p) => (
            <TouchableOpacity key={p.value} style={[styles.chip, newPriority === p.value && styles.chipOn]} onPress={() => setNewPriority(p.value)}>
              <Text style={[styles.chipText, newPriority === p.value && styles.chipTextOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ActionModal>

      <ActionModal
        visible={modal === "return"}
        title="Send back for review"
        message="The deciding admin gets it back with your reason."
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="What needs another look?"
        confirmLabel="Send Back"
        tone="danger"
        loading={busy === "return"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => run("return", () => adminTicketAPI.returnForReview(ticket._id, note), "Could not send it back.", true)}
      />
    </ScrollView>
  );
}

// One thread per party. Raiser and respondent never share a thread.
function AdminChat({ ticket, canSend }: { ticket: any; canSend: boolean }) {
  const parties: ("raiser" | "respondent")[] = ticket.raisedAgainst ? ["raiser", "respondent"] : ["raiser"];
  const [party, setParty] = useState<"raiser" | "respondent">("raiser");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    try {
      const res = await adminTicketAPI.getChat(ticket._id, ticket.raisedAgainst ? party : undefined);
      setMessages(res.thread?.messages ?? []);
    } catch {
      setMessages([]);
    }
  }, [ticket._id, ticket.raisedAgainst, party]);

  useEffect(() => {
    fetchThread();
    const t = setInterval(fetchThread, 15000);
    return () => clearInterval(t);
  }, [fetchThread]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await adminTicketAPI.sendChat(ticket._id, text.trim(), ticket.raisedAgainst ? party : undefined, files);
      setMessages(res.thread?.messages ?? messages);
      setText("");
      setFiles([]);
    } catch (err: any) {
      setError(apiError(err, "Message not sent."));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Messages</Text>
        {parties.length > 1 && (
          <View style={styles.chips}>
            {parties.map((p) => (
              <TouchableOpacity key={p} style={[styles.chip, party === p && styles.chipOn]} onPress={() => setParty(p)}>
                <Text style={[styles.chipText, party === p && styles.chipTextOn]}>{p === "raiser" ? "Person who raised it" : "Other side"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.small}>Users see you as your first name and team. Nothing said here changes the ticket.</Text>
      {messages.length === 0 && <Text style={styles.muted}>No messages yet.</Text>}
      {messages.map((m, i) => {
        const mine = m.sender === "admin";
        return (
          <View key={i} style={[styles.msg, mine ? styles.msgMine : styles.msgTheirs]}>
            {!!m.text && <Text style={mine ? styles.msgTextMine : styles.body}>{m.text}</Text>}
            {(m.evidenceRefs?.length ?? 0) > 0 && <Text style={[styles.small, mine && { color: "#DBEAFE" }]}>{m.evidenceRefs.length} file(s) attached</Text>}
            <Text style={[styles.small, mine && { color: "#DBEAFE" }]}>{when(m.at)}</Text>
          </View>
        );
      })}
      {canSend && (
        <View style={{ gap: 8 }}>
          <EvidencePicker files={files} onChange={setFiles} compact />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={text}
              onChangeText={(v) => setText(v.slice(0, TICKET_TEXT_MAX))}
              placeholder="Write a message"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sending || (!text.trim() && !files.length)) && styles.disabled]}
              disabled={sending || (!text.trim() && !files.length)}
              onPress={send}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.subText },
  layout: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  btnRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 },
  ticketId: { fontSize: 12, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.3 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 6 },
  body: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 18 },
  small: { fontSize: 11, color: COLORS.subText },
  warn: { fontSize: 12, color: "#B45309" },
  error: { fontSize: 12, color: COLORS.red },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", alignSelf: "flex-start", minWidth: 130 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  outlineText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  linkText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextOn: { color: COLORS.primary, fontWeight: "700" },
  option: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10 },
  optionOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.text, maxHeight: 110 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  msg: { maxWidth: "85%", borderRadius: 10, padding: 10, gap: 2 },
  msgMine: { alignSelf: "flex-end", backgroundColor: COLORS.primary },
  msgTheirs: { alignSelf: "flex-start", backgroundColor: "#F1F5F9" },
  msgTextMine: { fontSize: 13, color: "#fff", lineHeight: 19 },
});
