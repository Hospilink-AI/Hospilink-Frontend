import { COLORS } from "@/constant/colors";
import { formatTime } from "@/constant/jobs";
import { categoryLabel } from "@/constant/support";
import { adminTicketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Chatbot conversation that led to the ticket. Hidden until the server has the endpoint.
export default function ConversationCard({ ticketId, startOpen = false }: { ticketId: string; startOpen?: boolean }) {
  const [conv, setConv] = useState<any>(null);
  const [open, setOpen] = useState(startOpen);

  useEffect(() => {
    let active = true;
    adminTicketAPI
      .getConversation(ticketId)
      .then((res: any) => active && setConv(res?.conversation ?? res?.data ?? null))
      .catch(() => active && setConv(null));
    return () => {
      active = false;
    };
  }, [ticketId]);

  const messages: any[] = conv?.messages ?? [];
  if (!conv || messages.length === 0) return null;

  const confidence = typeof conv.botConfidence === "number" ? Math.round(conv.botConfidence * 100) : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.head} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chatbot conversation</Text>
          <Text style={styles.muted}>
            {messages.length} message{messages.length > 1 ? "s" : ""}
            {conv.language && conv.language !== "en" ? ` · ${String(conv.language).toUpperCase()}` : ""}
            {conv.botCategory ? ` · bot's guess: ${categoryLabel(conv.botCategory)}` : ""}
            {confidence !== null ? ` (${confidence}% sure)` : ""}
          </Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={COLORS.subText} />
      </TouchableOpacity>
      {open && (
        <View style={{ gap: 8 }}>
          {messages.map((m, i) => {
            const bot = m.sender === "bot";
            return (
              <View key={i} style={[styles.bubble, bot ? styles.bot : styles.user]}>
                <Text style={styles.who}>{bot ? "Bot" : "User"}</Text>
                <Text style={styles.text}>{m.text || "—"}</Text>
                {!!m.at && <Text style={styles.time}>{formatTime(m.at)}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText },
  bubble: { borderRadius: 10, padding: 10, maxWidth: "85%", gap: 2 },
  bot: { backgroundColor: "#F1F5F9", alignSelf: "flex-start" },
  user: { backgroundColor: "#EFF6FF", alignSelf: "flex-end" },
  who: { fontSize: 11, fontWeight: "700", color: COLORS.subText },
  text: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  time: { fontSize: 10, color: COLORS.subText, alignSelf: "flex-end" },
});
