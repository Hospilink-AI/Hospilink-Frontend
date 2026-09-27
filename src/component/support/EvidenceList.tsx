import { COLORS } from "@/constant/colors";
import { formatDate } from "@/constant/jobs";
import { ticketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  ticketId: string;
  evidence: any[];
  showSupplier?: boolean;
  emptyText?: string;
}

// Ticket files with an Open link. The server gives a short-lived link per file.
export default function EvidenceList({ ticketId, evidence, showSupplier, emptyText = "No files attached." }: Props) {
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async (e: any) => {
    setOpening(e._id);
    setError(null);
    try {
      const res = await ticketAPI.getEvidenceUrl(ticketId, e._id);
      const url = res?.url ?? res?.data?.url;
      if (!url) throw new Error("no url");
      if (Platform.OS === "web") window.open(url, "_blank", "noopener");
      else await Linking.openURL(url);
    } catch (err: any) {
      setError(
        err?.response?.status === 404
          ? "Files can't be opened in the app yet."
          : err?.response?.status === 403
            ? "You can't open this file."
            : "Could not open the file. Try again."
      );
    } finally {
      setOpening(null);
    }
  };

  if (!evidence?.length) return <Text style={styles.muted}>{emptyText}</Text>;

  return (
    <View style={{ gap: 6 }}>
      {evidence.map((e: any) => (
        <View key={e._id ?? e.s3Key} style={styles.row}>
          <Ionicons name={e.mimeType === "application/pdf" ? "document-text-outline" : "image-outline"} size={16} color={COLORS.subText} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{e.originalFileName ?? "File"}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {showSupplier && e.suppliedBy ? `from ${e.suppliedBy} · ` : ""}
              {formatDate(e.uploadedAt)}
            </Text>
          </View>
          {!!e._id && (
            <TouchableOpacity onPress={() => open(e)} disabled={!!opening} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              {opening === e._id ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.link}>Open</Text>}
            </TouchableOpacity>
          )}
        </View>
      ))}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 13, color: COLORS.text },
  meta: { fontSize: 11, color: COLORS.subText },
  muted: { fontSize: 13, color: COLORS.subText },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  error: { fontSize: 12, color: COLORS.red },
});
