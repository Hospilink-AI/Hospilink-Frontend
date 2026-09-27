import { COLORS } from "@/constant/colors";
import { apiError, formatDate } from "@/constant/jobs";
import { FEEDBACK_AREAS, TICKET_TEXT_MAX } from "@/constant/support";
import { feedbackAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

// base: "/medicalStaff/support" or "/hospital/support"
export default function FeedbackScreen({ base }: { base: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [area, setArea] = useState("other");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getMine();
      setHistory(res.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await feedbackAPI.submit({ text: text.trim(), area });
      setHistory((prev) => [res.feedback, ...prev]);
      setText("");
      setArea("other");
      setSent(true);
    } catch (err: any) {
      setError(apiError(err, "Could not send your feedback."));
    } finally {
      setSending(false);
    }
  };

  const areaLabel = (value: string) => FEEDBACK_AREAS.find((a) => a.value === value)?.label ?? value;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push(base as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to Support</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Share Feedback</Text>
      <Text style={styles.muted}>
        Tell us what's working and what isn't. For a problem that needs fixing, raise a ticket instead.
      </Text>

      <View style={styles.card}>
        {sent && (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={16} color="#047857" />
            <Text style={styles.successText}>Thanks, your feedback has been sent.</Text>
          </View>
        )}
        <Text style={styles.label}>What is it about?</Text>
        <View style={styles.chips}>
          {FEEDBACK_AREAS.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[styles.chip, area === a.value && styles.chipActive]}
              onPress={() => setArea(a.value)}
            >
              <Text style={[styles.chipText, area === a.value && styles.chipTextActive]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Your feedback</Text>
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={(t) => {
            setText(t.slice(0, TICKET_TEXT_MAX));
            setSent(false);
          }}
          placeholder="What would you like us to know?"
          placeholderTextColor="#9CA3AF"
          multiline
        />
        <Text style={styles.counter}>{text.length}/{TICKET_TEXT_MAX}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.primaryBtn, (!text.trim() || sending) && styles.disabled]}
          disabled={!text.trim() || sending}
          onPress={submit}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send Feedback</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your earlier feedback</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ alignSelf: "flex-start" }} />
      ) : history.length === 0 ? (
        <Text style={styles.muted}>Nothing yet.</Text>
      ) : (
        history.map((f) => (
          <View key={f._id} style={styles.item}>
            <View style={styles.itemTop}>
              <Text style={styles.itemArea}>{areaLabel(f.area)}</Text>
              <Text style={styles.itemDate}>{formatDate(f.createdAt)}</Text>
            </View>
            <Text style={styles.itemText}>{f.text}</Text>
            {!!f.convertedToTicket && (
              <TouchableOpacity onPress={() => router.push(`${base}/tickets/${f.convertedToTicket}` as any)}>
                <Text style={styles.link}>We opened a ticket for this. View ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center", gap: 10 },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 8, marginTop: 6 },
  success: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", borderRadius: 8, padding: 8 },
  successText: { fontSize: 13, color: "#047857", fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.white },
  chipActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextActive: { color: COLORS.primary, fontWeight: "700" },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  counter: { fontSize: 11, color: COLORS.subText, alignSelf: "flex-end" },
  error: { fontSize: 13, color: COLORS.red },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center", alignSelf: "flex-start", minWidth: 150 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 12 },
  item: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 4 },
  itemTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  itemArea: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  itemDate: { fontSize: 12, color: COLORS.subText },
  itemText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  link: { fontSize: 13, color: COLORS.primary, fontWeight: "600", marginTop: 4 },
});
