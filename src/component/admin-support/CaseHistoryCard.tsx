import { TicketStatusPill } from "@/component/support/TicketList";
import { COLORS } from "@/constant/colors";
import { formatDate } from "@/constant/jobs";
import { OUTCOME_LABELS, categoryLabel } from "@/constant/support";
import { adminTicketAPI } from "@/service/api";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Earlier tickets between the same two people. Hidden until the server has the endpoint.
export default function CaseHistoryCard({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    let active = true;
    adminTicketAPI
      .getHistory(ticketId)
      .then((res: any) => active && setItems(res?.tickets ?? res?.data ?? []))
      .catch(() => active && setItems(null));
    return () => {
      active = false;
    };
  }, [ticketId]);

  if (items === null) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Earlier cases between them</Text>
      {items.length === 0 ? (
        <Text style={styles.muted}>None.</Text>
      ) : (
        items.map((t) => (
          <TouchableOpacity key={t._id} style={styles.row} onPress={() => router.push(`/admin/tickets/${t._id}` as any)}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{categoryLabel(t.category)}</Text>
              <Text style={styles.muted} numberOfLines={1}>
                {t.ticketId} · {formatDate(t.createdAt)}
                {t.resolutionOutcome ? ` · ${OUTCOME_LABELS[t.resolutionOutcome] ?? t.resolutionOutcome}` : ""}
              </Text>
            </View>
            <TicketStatusPill status={t.status} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  name: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText },
});
