import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CapabilityGate from "@/component/admin-support/CapabilityGate";
import { IdentityCheckCard, IdentityIssue, IssueRow } from "@/component/admin/IdentityCheck";
import { adminAPI } from "@/service/api";

// Accounts whose documents don't agree with each other or with the profile (newest first).
type Row = {
  userId: string;
  name: string | null;
  email: string | null;
  role: "staff" | "hospital";
  status: "flagged" | "dismissed" | "clear";
  severity: "high" | "low" | null;
  issues: IdentityIssue[];
  flaggedAt?: string | null;
  checkedAt?: string;
  remindersSent?: number;
};

const STATUS = [
  { key: "flagged", label: "Flagged" },
  { key: "dismissed", label: "Dismissed" },
  { key: "clear", label: "Clear" },
] as const;
const SEVERITY = [
  { key: "", label: "Any severity" },
  { key: "high", label: "High" },
  { key: "low", label: "Low" },
] as const;
const ROLE = [
  { key: "", label: "Everyone" },
  { key: "staff", label: "Doctors and nurses" },
  { key: "hospital", label: "Hospitals" },
] as const;

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function Chips<T extends string>({ items, value, onChange }: { items: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.chips}>
      {items.map((i) => (
        <TouchableOpacity key={i.key || "all"} onPress={() => onChange(i.key)} style={[s.chip, value === i.key && s.chipOn]} accessibilityState={{ selected: value === i.key }}>
          <Text style={[s.chipText, value === i.key && s.chipTextOn]}>{i.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function IdentityQueue() {
  const [status, setStatus] = useState<"flagged" | "dismissed" | "clear">("flagged");
  const [severity, setSeverity] = useState<"" | "high" | "low">("");
  const [role, setRole] = useState<"" | "staff" | "hospital">("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const r = await adminAPI.getIdentityChecks({ status, severity: severity || undefined, role: role || undefined, page, limit: 20 });
      setRows(Array.isArray(r?.data) ? r.data.map((x: any) => ({ ...x, issues: Array.isArray(x?.issues) ? x.issues : [] })) : []);
      setTotalPages(r?.pagination?.totalPages || 1);
      setTotal(r?.pagination?.total ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "The queue didn't load.");
      setRows([]);
    }
  }, [status, severity, role, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filter = (fn: () => void) => {
    fn();
    setPage(1);
    setOpen(null);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View>
        <Text style={s.title}>Identity checks</Text>
        <Text style={s.sub}>
          Where the name, date of birth or numbers on someone's documents don't agree with each other or with their profile. Unreadable values are never
          counted. High differences hold back Aadhaar and PAN auto-verification and send the user a reminder; low ones are for admins only.
        </Text>
      </View>

      <View style={s.filters}>
        <Chips items={STATUS} value={status} onChange={(v) => filter(() => setStatus(v))} />
        <Chips items={SEVERITY} value={severity} onChange={(v) => filter(() => setSeverity(v))} />
        <Chips items={ROLE} value={role} onChange={(v) => filter(() => setRole(v))} />
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {rows === null ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 24 }} />
      ) : rows.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{status === "flagged" ? "No accounts flagged" : "Nothing here"}</Text>
          <Text style={s.sub}>Accounts are checked after every document upload or profile name change, and the first time an admin opens them.</Text>
        </View>
      ) : (
        <>
          <Text style={s.count}>
            {total} {total === 1 ? "account" : "accounts"}
          </Text>
          {rows.map((r) => {
            const isOpen = open === r.userId;
            return (
              <View key={r.userId} style={s.row} testID={`identity-row-${r.userId}`}>
                <TouchableOpacity onPress={() => setOpen(isOpen ? null : r.userId)} style={s.rowHead} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                  <View style={[s.sev, { backgroundColor: r.severity === "high" ? "#DC2626" : r.severity === "low" ? "#F59E0B" : "#94A3B8" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{r.name || "Unnamed account"}</Text>
                    <Text style={s.meta}>
                      {r.role === "hospital" ? "Hospital" : "Doctor or nurse"} · {r.email || "no email"} · flagged {when(r.flaggedAt)}
                      {r.remindersSent ? ` · ${r.remindersSent} ${r.remindersSent === 1 ? "reminder" : "reminders"}` : ""}
                    </Text>
                  </View>
                  <Text style={s.issueCount}>
                    {r.issues.length} {r.issues.length === 1 ? "difference" : "differences"}
                  </Text>
                  <Text style={s.chev}>{isOpen ? "▴" : "▾"}</Text>
                </TouchableOpacity>
                {isOpen ? (
                  <View style={s.rowBody}>
                    <IdentityCheckCard userId={r.userId} />
                  </View>
                ) : (
                  <View style={s.rowBody}>{r.issues.slice(0, 2).map((i, k) => <IssueRow key={k} issue={i} />)}</View>
                )}
              </View>
            );
          })}
          {totalPages > 1 ? (
            <View style={s.pager}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={[s.chip, page <= 1 && { opacity: 0.4 }]}>
                <Text style={s.chipText}>Previous</Text>
              </TouchableOpacity>
              <Text style={s.meta}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage(page + 1)} style={[s.chip, page >= totalPages && { opacity: 0.4 }]}>
                <Text style={s.chipText}>Next</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

export default function AdminIdentityChecks() {
  return (
    <CapabilityGate capability="document.view">
      <IdentityQueue />
    </CapabilityGate>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 16, paddingBottom: 40, gap: 14, maxWidth: 1000, width: "100%", alignSelf: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sub: { fontSize: 12, color: "#64748B", lineHeight: 18, marginTop: 4 },
  filters: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  chipTextOn: { color: "#1D4ED8" },
  error: { fontSize: 12, color: "#B91C1C" },
  empty: { backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  count: { fontSize: 12, fontWeight: "700", color: "#475569" },
  row: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  sev: { width: 4, alignSelf: "stretch", borderRadius: 2 },
  name: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 11, color: "#64748B", marginTop: 2 },
  issueCount: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chev: { fontSize: 12, color: "#94A3B8", width: 14, textAlign: "center" },
  rowBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
});
