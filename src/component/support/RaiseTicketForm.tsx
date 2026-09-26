import EvidencePicker from "@/component/support/EvidencePicker";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, roleLabel } from "@/constant/jobs";
import {
  PickedFile,
  TICKET_CATEGORIES,
  TICKET_DOMAINS,
  TICKET_TEXT_MAX,
  TicketCategory,
  TicketDomain,
  categoryInfo,
} from "@/constant/support";
import { dutyAPI, jobAPI, ticketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type Subject = { id: string; label: string; sub?: string };

const humanize = (value?: string | null) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) : "Shift";

// Duty roles share codes with job roles (rmo, staff_nurse...); fall back to the code itself.
const dutyRole = (value?: string | null) => {
  const label = roleLabel(value);
  return value && label !== value ? label : humanize(value);
};

// base: "/medicalStaff/support" or "/hospital/support"
export default function RaiseTicketForm({ base, role }: { base: string; role: "staff" | "hospital" }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; subjectId?: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const preset = categoryInfo(params.category);
  const [domain, setDomain] = useState<TicketDomain | null>(preset?.domain ?? null);
  const [category, setCategory] = useState<TicketCategory | null>(preset ?? null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectId, setSubjectId] = useState<string | null>(params.subjectId ?? null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; ticketId: string; evidenceFailed: boolean } | null>(null);

  const subjectKind = category?.subject === "DUTY" || category?.subject === "PAYMENT"
    ? "duty"
    : category && ["INTERVIEW", "APPLICATION", "VACANCY"].includes(category.subject) && role === "staff"
      ? "application"
      : null;
  // A complaint about someone needs to know what it is about, so the server can work out who.
  const subjectRequired = !!subjectKind && category?.cls === "ADJUDICATED";

  useEffect(() => {
    if (!subjectKind) {
      setSubjects([]);
      return;
    }
    let active = true;
    setSubjectsLoading(true);
    (async () => {
      try {
        if (subjectKind === "duty") {
          if (role === "staff") {
            const res = await dutyAPI.getCompletedDuties();
            const list = (res?.duties ?? []).slice(0, 20).map((d: any) => ({
              id: d._id,
              label: d.formattedRole || dutyRole(d.staffRole),
              sub: `${d.hospital?.hospitalLegalName ?? "Hospital"} · ${formatDate(d.date)}`,
            }));
            if (active) setSubjects(list);
          } else {
            const res = await dutyAPI.getPublishedDutiesH({ page: 1, limit: 20 });
            const list = (res?.data ?? []).map((d: any) => ({
              id: d.dutyId,
              label: dutyRole(d.staffRole),
              sub: `${d.staff?.name ?? "No staff assigned"} · ${formatDate(d.date)}`,
            }));
            if (active) setSubjects(list);
          }
        } else {
          const res = await jobAPI.getMyApplications({ page: 1, limit: 50 });
          const list = (res?.data ?? []).map((a: any) => ({
            // A listing complaint is about the vacancy itself, everything else about the application.
            id: category?.subject === "VACANCY" ? a.vacancy?._id ?? a.vacancy : a._id,
            label: a.vacancy?.title ?? "Job application",
            sub: `${a.hospitalId?.hospitalLegalName ?? "Hospital"} · Applied ${formatDate(a.appliedAt ?? a.createdAt)}`,
          }));
          if (active) setSubjects(list);
        }
      } catch {
        if (active) setSubjects([]);
      } finally {
        if (active) setSubjectsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [subjectKind, role, category?.subject]);

  const pickDomain = (d: TicketDomain) => {
    setDomain(d);
    setCategory(null);
    setSubjectId(null);
    setError(null);
  };

  const pickCategory = (cat: TicketCategory) => {
    setCategory(cat);
    setSubjectId(null);
    setError(null);
  };

  const submit = async () => {
    if (!category) return;
    setSubmitting(true);
    setError(null);
    try {
      const subjectType = subjectKind && subjectId ? category.subject : "NONE";
      const res = await ticketAPI.create({
        category: category.value,
        subjectType,
        ...(subjectType !== "NONE" && { subjectId }),
        text: text.trim(),
      });
      const ticket = res.ticket;
      let evidenceFailed = false;
      if (files.length) {
        try {
          await ticketAPI.addEvidence(ticket._id, files);
        } catch {
          evidenceFailed = true;
        }
      }
      setCreated({ id: ticket._id, ticketId: ticket.ticketId, evidenceFailed });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = apiError(err, "Could not raise the ticket.");
      if (status === 409) setError("You already have an open ticket about this. We'll keep you posted on that one.");
      else if (/raisedAgainst/i.test(msg)) setError("This kind of complaint can't be raised from the form yet. Please use the chat, or pick the shift or application it's about.");
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
        <View style={[styles.card, styles.doneCard]}>
          <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
          <Text style={styles.doneTitle}>Ticket {created.ticketId} raised</Text>
          <Text style={styles.muted}>
            Our team will pick it up and keep you updated here and by notification.
          </Text>
          {created.evidenceFailed && (
            <Text style={styles.warn}>
              Your files couldn't be attached. You can add them from the ticket later.
            </Text>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`${base}/tickets/${created.id}` as any)}>
            <Text style={styles.primaryText}>View Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(base as any)}>
            <Text style={styles.backText}>Back to Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const categories = TICKET_CATEGORIES.filter((cat) => cat.domain === domain);
  const canSubmit =
    !!category && !!text.trim() && (!subjectRequired || !!subjectId) && !submitting;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push(base as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to Support</Text>
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Raise a Ticket</Text>
      <Text style={styles.muted}>Tell us what went wrong. Our team will look into it and get back to you.</Text>

      <View style={styles.card}>
        <Text style={styles.step}>1. What is it about?</Text>
        <View style={styles.domains}>
          {TICKET_DOMAINS.map((d) => {
            const active = domain === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                style={[styles.domain, isMobile && styles.domainMobile, active && styles.domainActive]}
                onPress={() => pickDomain(d.value)}
                activeOpacity={0.85}
              >
                <Ionicons name={d.icon as any} size={18} color={active ? COLORS.primary : COLORS.subText} />
                <Text style={[styles.domainText, active && { color: COLORS.primary }]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!domain && (
          <>
            <Text style={styles.step}>2. Which of these fits best?</Text>
            <View style={{ gap: 6 }}>
              {categories.map((cat) => {
                const active = category?.value === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => pickCategory(cat)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={active ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={active ? COLORS.primary : COLORS.subText}
                    />
                    <Text style={styles.optionText}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {!!category && !!subjectKind && (
          <>
            <Text style={styles.step}>
              3. Which {subjectKind === "duty" ? "shift" : "application"} is it about?
              {!subjectRequired && <Text style={styles.optional}> (optional)</Text>}
            </Text>
            {subjectsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ alignSelf: "flex-start" }} />
            ) : subjects.length === 0 ? (
              <Text style={styles.muted}>
                No recent {subjectKind === "duty" ? "shifts" : "applications"} found.
              </Text>
            ) : (
              <View style={{ gap: 6 }}>
                {subjects.map((s) => {
                  const active = subjectId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.option, active && styles.optionActive]}
                      onPress={() => setSubjectId(active ? null : s.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={active ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={active ? COLORS.primary : COLORS.subText}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionText}>{s.label}</Text>
                        {!!s.sub && <Text style={styles.optionSub}>{s.sub}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {!!category && (
          <>
            <Text style={styles.step}>{subjectKind ? "4" : "3"}. What happened?</Text>
            {category.evidence.length > 0 && (
              <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>It helps to include:</Text>
                {category.evidence.map((e) => (
                  <Text key={e} style={styles.hintItem}>• {e}</Text>
                ))}
              </View>
            )}
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={(t) => setText(t.slice(0, TICKET_TEXT_MAX))}
              placeholder="Describe what happened, with dates and times if you have them"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Text style={styles.counter}>{text.length}/{TICKET_TEXT_MAX}</Text>

            <Text style={styles.step}>
              {subjectKind ? "5" : "4"}. Evidence <Text style={styles.optional}>(optional)</Text>
            </Text>
            <EvidencePicker files={files} onChange={setFiles} />
          </>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {!!category && (
        <TouchableOpacity
          style={[styles.primaryBtn, styles.submit, !canSubmit && styles.disabled]}
          disabled={!canSubmit}
          onPress={submit}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Raise Ticket</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { fontSize: 13, color: COLORS.subText },
  pageTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText, marginTop: 4, lineHeight: 19 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginTop: 16,
    gap: 10,
  },
  step: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 8 },
  optional: { fontSize: 12, fontWeight: "400", color: COLORS.subText },
  domains: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  domain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 180,
  },
  domainMobile: { minWidth: 0, width: "48%" },
  domainActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  domainText: { fontSize: 13, fontWeight: "600", color: COLORS.text, flexShrink: 1 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  optionText: { fontSize: 13, color: COLORS.text, flexShrink: 1 },
  optionSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  hintBox: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, gap: 2 },
  hintTitle: { fontSize: 12, fontWeight: "700", color: COLORS.subText },
  hintItem: { fontSize: 12, color: COLORS.subText },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  counter: { fontSize: 11, color: COLORS.subText, alignSelf: "flex-end" },
  error: { fontSize: 13, color: COLORS.red, marginTop: 12 },
  warn: { fontSize: 13, color: "#B45309", textAlign: "center" },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  submit: { marginTop: 16, alignSelf: "flex-start", minWidth: 160 },
  disabled: { opacity: 0.5 },
  doneCard: { alignItems: "center", gap: 10, paddingVertical: 32 },
  doneTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
});
