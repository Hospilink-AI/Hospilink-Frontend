import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import ActionModal from "@/component/cards/jobs/ActionModal";
import EvidenceList from "@/component/support/EvidenceList";
import EvidencePicker from "@/component/support/EvidencePicker";
import { TicketStatusPill } from "@/component/support/TicketList";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import {
  OPEN_TICKET_STATUSES,
  PickedFile,
  TICKET_STATUS_LABELS,
  TICKET_TEXT_MAX,
  TicketStatus,
  categoryLabel,
} from "@/constant/support";
import { ticketAPI } from "@/service/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const CLOSED_FOR_EVIDENCE = ["CLOSED", "WITHDRAWN", "DUPLICATE", "AUTO_CLOSED"];
const CHAT_POLL_MS = 15000;

const when = (iso?: string | null) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : "—");

// base: "/medicalStaff/support" or "/hospital/support"
export default function TicketDetail({ base }: { base: string }) {
  const styles = useStylesThemed();
  const th = useTheme();
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "withdraw" | "appeal">(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketAPI.getById(ticketId);
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
      // the respond call returns the unfiltered record, so reload the party view instead
      if (res?.ticket && key !== "appeal" && key !== "reply") setTicket((prev: any) => ({ ...prev, ...res.ticket }));
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

  if (loading && !ticket) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={th.c.primary} />
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, gap: 10 }]}>
        <TIcon ion="alert-circle-outline" size={32} color={th.c.danger} />
        <Text style={styles.muted}>{error ?? "Ticket not found."}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Text style={styles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // The respondent's view has no raisedBy (the server strips it).
  const isRaiser = !!ticket.raisedBy;
  const isOpen = OPEN_TICKET_STATUSES.includes(ticket.status);
  const decided = ["RESOLVED", "REJECTED"].includes(ticket.status);
  const statement = ticket.respondentStatement;
  const canReply = !isRaiser && isOpen && !statement?.submittedAt;
  const canAddEvidence = !CLOSED_FOR_EVIDENCE.includes(ticket.status) && (ticket.evidence?.length ?? 0) < 5;
  const firstText = isRaiser ? ticket.statusHistory?.[0]?.reason : null;

  const uploadEvidence = async () => {
    const res = await run("evidence", () => ticketAPI.addEvidence(ticket._id, files), "Could not attach the files.");
    if (res) setFiles([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push(`${base}/tickets${isRaiser ? "" : "?tab=against"}` as any)}>
        <TIcon ion="arrow-back" size={16} color={th.c.subText} />
        <Text style={styles.backText}>Back to my tickets</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.ticketId}>{ticket.ticketId}</Text>
          <TicketStatusPill status={ticket.status} />
        </View>
        <Text style={styles.title}>{categoryLabel(ticket.category)}</Text>
        <Text style={styles.muted}>Raised {when(ticket.createdAt)}</Text>
        {isOpen && !!ticket.slaDecideBy && (
          <Text style={styles.muted}>We aim to reach a decision by {when(ticket.slaDecideBy)}.</Text>
        )}
        {!!firstText && (
          <>
            <Text style={styles.label}>What you told us</Text>
            <Text style={styles.body}>{firstText}</Text>
          </>
        )}
      </View>

      {!isRaiser && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>A complaint has been raised about you</Text>
          <Text style={styles.muted}>
            Nothing has been decided. Please give your side so our team can look at both before deciding.
          </Text>
          {statement?.submittedAt ? (
            <>
              <Text style={styles.label}>Your reply · {when(statement.submittedAt)}</Text>
              <Text style={styles.body}>{statement.text}</Text>
            </>
          ) : canReply ? (
            <>
              {!!ticket.respondentDeadline && (
                <View style={styles.due}>
                  <TIcon ion="time-outline" size={14} color={th.hex("#B45309")} />
                  <Text style={styles.dueText}>Please reply by {when(ticket.respondentDeadline)}</Text>
                </View>
              )}
              {statement?.lapsed && (
                <Text style={styles.muted}>The reply window has passed, but you can still send your side.</Text>
              )}
              <TextInput
                style={styles.textArea}
                value={reply}
                onChangeText={(t) => setReply(t.slice(0, TICKET_TEXT_MAX))}
                placeholder="Your side of what happened"
                placeholderTextColor={th.hex("#9CA3AF")}
                multiline
              />
              <TouchableOpacity
                style={[styles.primaryBtn, styles.selfStart, (!reply.trim() || !!busy) && styles.disabled]}
                disabled={!reply.trim() || !!busy}
                onPress={async () => {
                  const res = await run("reply", () => ticketAPI.respond(ticket._id, reply.trim()), "Could not send your reply.");
                  if (res) {
                    setReply("");
                    load();
                  }
                }}
              >
                {busy === "reply" ? <ActivityIndicator color={th.hex("#fff")} /> : <Text style={styles.primaryText}>Send Reply</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.muted}>This complaint is closed.</Text>
          )}
        </View>
      )}

      {(decided || !!ticket.actionTakenStatement) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Decision</Text>
          <Text style={styles.body}>
            {ticket.actionTakenStatement ?? `This ticket is ${TICKET_STATUS_LABELS[ticket.status as TicketStatus]?.toLowerCase() ?? "closed"}.`}
          </Text>
          {decided && (
            <TouchableOpacity style={[styles.outlineBtn, styles.selfStart]} onPress={() => { setModalError(null); setModal("appeal"); }}>
              <Text style={styles.outlineText}>Appeal this decision</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {ticket.status === "AWAITING_RAISER" && isRaiser && (
        <View style={[styles.card, styles.notice]}>
          <TIcon ion="information-circle-outline" size={18} color={th.hex("#B45309")} />
          <Text style={[styles.body, { flex: 1, color: th.hex("#92400E") }]}>
            Our team needs more information from you. Reply in the messages below or attach files.
          </Text>
        </View>
      )}

      <TicketChat ticket={ticket} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Evidence</Text>
        <EvidenceList ticketId={ticket._id} evidence={ticket.evidence ?? []} />
        {canAddEvidence && (
          <>
            <EvidencePicker files={files} onChange={setFiles} />
            {files.length > 0 && (
              <TouchableOpacity style={[styles.primaryBtn, styles.selfStart, !!busy && styles.disabled]} disabled={!!busy} onPress={uploadEvidence}>
                {busy === "evidence" ? <ActivityIndicator color={th.hex("#fff")} /> : <Text style={styles.primaryText}>Upload Files</Text>}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {isRaiser && (ticket.statusHistory ?? []).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>History</Text>
          {ticket.statusHistory.map((h: any, i: number) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.dot} />
              <Text style={styles.body}>{TICKET_STATUS_LABELS[h.status as TicketStatus] ?? h.status}</Text>
              <Text style={styles.fileMeta}>{when(h.timestamp)}</Text>
            </View>
          ))}
        </View>
      )}

      {!!actionError && <Text style={styles.error}>{actionError}</Text>}

      {isRaiser && isOpen && (
        <TouchableOpacity style={styles.withdraw} onPress={() => { setModalError(null); setModal("withdraw"); }}>
          <Text style={styles.dangerText}>Withdraw this ticket</Text>
        </TouchableOpacity>
      )}

      <ActionModal
        visible={modal === "withdraw"}
        title="Withdraw this ticket?"
        message="Our team will stop working on it. You can raise a new ticket later if you need to."
        showNote
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Reason (optional)"
        confirmLabel="Withdraw"
        tone="danger"
        loading={busy === "withdraw"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => run("withdraw", () => ticketAPI.withdraw(ticket._id, note || undefined), "Could not withdraw the ticket.", true)}
      />

      <ActionModal
        visible={modal === "appeal"}
        title="Appeal this decision"
        message="A different person will review it. Each decision can be appealed once."
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Why do you think the decision is wrong?"
        confirmLabel="Send Appeal"
        loading={busy === "appeal"}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={async (_, note) => {
          const res = await run("appeal", () => ticketAPI.appeal(ticket._id, note), "Could not send the appeal.", true);
          if (res?.ticket?._id) router.push(`${base}/tickets/${res.ticket._id}` as any);
        }}
      />
    </ScrollView>
  );
}

// The user's own thread with the support agent. Opens once an agent has picked up the ticket.
function TicketChat({ ticket }: { ticket: any }) {
  const styles = useStylesThemed();
  const th = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const claimed = !!ticket.assignedTo || !!ticket.claimedAt;
  const open = !["CLOSED", "WITHDRAWN", "DUPLICATE", "AUTO_CLOSED", "RESOLVED", "REJECTED"].includes(ticket.status);

  const fetchThread = useCallback(async () => {
    try {
      const res = await ticketAPI.getChat(ticket._id);
      setMessages(res.thread?.messages ?? []);
    } catch {
      // keep what we have
    }
  }, [ticket._id]);

  useEffect(() => {
    fetchThread();
    if (claimed && open) timer.current = setInterval(fetchThread, CHAT_POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchThread, claimed, open]);

  const send = async () => {
    if (!text.trim() && !files.length) return;
    setSending(true);
    setError(null);
    try {
      const res = await ticketAPI.sendChat(ticket._id, text.trim(), files);
      setMessages(res.thread?.messages ?? messages);
      setText("");
      setFiles([]);
    } catch (err: any) {
      setError(apiError(err, "Your message didn't go through."));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Messages</Text>
      {messages.length === 0 && (
        <Text style={styles.muted}>
          {claimed
            ? "No messages yet. You can message the person handling your ticket here."
            : "Messages open once someone from our team picks up your ticket."}
        </Text>
      )}
      {messages.map((m, i) => {
        const mine = m.sender === "user";
        return (
          <View key={i} style={[styles.msg, mine ? styles.msgMine : styles.msgTheirs]}>
            {!mine && <Text style={styles.msgName}>{m.displayName ?? "HospiLink Support"}</Text>}
            {!!m.text && <Text style={mine ? styles.msgTextMine : styles.body}>{m.text}</Text>}
            {(m.evidenceRefs?.length ?? 0) > 0 && (
              <Text style={[styles.fileMeta, mine && { color: th.hex("#DBEAFE") }]}>
                {m.evidenceRefs.length} file{m.evidenceRefs.length > 1 ? "s" : ""} attached
              </Text>
            )}
            <Text style={[styles.fileMeta, mine && { color: th.hex("#DBEAFE") }]}>{when(m.at)}</Text>
          </View>
        );
      })}
      {claimed && open && (
        <View style={{ gap: 8, marginTop: 4 }}>
          <EvidencePicker files={files} onChange={setFiles} compact />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={text}
              onChangeText={(t) => setText(t.slice(0, TICKET_TEXT_MAX))}
              placeholder="Write a message"
              placeholderTextColor={th.hex("#9CA3AF")}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sending || (!text.trim() && !files.length)) && styles.disabled]}
              disabled={sending || (!text.trim() && !files.length)}
              onPress={send}
            >
              {sending ? <ActivityIndicator color={th.hex("#fff")} size="small" /> : <TIcon ion="send" size={16} color={th.hex("#fff")} />}
            </TouchableOpacity>
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center", gap: 12 },
  back: { display: t.v2 ? ("none" as const) : ("flex" as const), flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { ...t.f(), fontSize: 13, color: t.c.subText },
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 16 : 12, borderWidth: 1, borderColor: t.c.border, padding: 18, gap: 8 },
  notice: { flexDirection: "row", gap: 10, backgroundColor: t.hex("#FFFBEB"), borderColor: t.hex("#FDE68A") },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  ticketId: { fontSize: 12, ...t.f("700"), color: t.c.subText, letterSpacing: 0.3 },
  title: { fontSize: 18, ...t.f("800"), color: t.c.text },
  sectionTitle: { fontSize: 15, ...t.f("700"), color: t.c.text },
  label: { fontSize: 12, ...t.f("700"), color: t.c.subText, marginTop: 6 },
  body: { ...t.f(), fontSize: 14, color: t.c.text, lineHeight: 20 },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19 },
  due: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: t.hex("#FFFBEB"), borderRadius: t.v2 ? 12 : 8, padding: 8, alignSelf: "flex-start" },
  dueText: { fontSize: 12, color: t.hex("#B45309"), ...t.f("600") },
  textArea: { ...t.f(),
    minHeight: 110,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.v2 ? 14 : 10,
    padding: 12,
    fontSize: 14,
    color: t.c.text,
    textAlignVertical: "top",
  },
  primaryBtn: { backgroundColor: t.c.primary, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center" },
  primaryText: { color: t.hex("#fff"), fontSize: 13, ...t.f("700") },
  outlineBtn: { borderWidth: 1, borderColor: t.c.border, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 16, paddingVertical: 10 },
  outlineText: { color: t.c.text, fontSize: 13, ...t.f("600") },
  selfStart: { alignSelf: "flex-start" },
  disabled: { opacity: 0.5 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fileName: { ...t.f(), flex: 1, fontSize: 13, color: t.c.text },
  fileMeta: { ...t.f(), fontSize: 11, color: t.c.subText },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.primary },
  error: { ...t.f(), fontSize: 13, color: t.c.danger },
  withdraw: { alignSelf: "center", paddingVertical: 8 },
  dangerText: { color: t.c.danger, fontSize: 13, ...t.f("700") },
  msg: { maxWidth: "85%", borderRadius: t.v2 ? 16 : 12, padding: 10, gap: 2 },
  msgMine: { alignSelf: "flex-end", backgroundColor: t.c.primary },
  msgTheirs: { alignSelf: "flex-start", backgroundColor: t.hex("#F1F5F9") },
  msgName: { fontSize: 11, ...t.f("700"), color: t.c.subText },
  msgTextMine: { ...t.f(), fontSize: 14, color: t.hex("#fff"), lineHeight: 20 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  chatInput: { ...t.f(),
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.v2 ? 14 : 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: t.c.text,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.c.primary, alignItems: "center", justifyContent: "center" },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
