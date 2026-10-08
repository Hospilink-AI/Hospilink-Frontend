import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate } from "@/constant/jobs";
import { FEEDBACK_AREAS, TICKET_TEXT_MAX } from "@/constant/support";
import { feedbackAPI } from "@/service/api";
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
  const styles = useStylesThemed();
  const th = useTheme();
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
        <TIcon ion="arrow-back" size={16} color={th.c.subText} />
        <Text style={styles.backText}>Back to Support</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Share Feedback</Text>
      <Text style={styles.muted}>
        Tell us what's working and what isn't. For a problem that needs fixing, raise a ticket instead.
      </Text>

      <View style={styles.card}>
        {sent && (
          <View style={styles.success}>
            <TIcon ion="checkmark-circle" size={16} color={th.hex("#047857")} />
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
          placeholderTextColor={th.hex("#9CA3AF")}
          multiline
        />
        <Text style={styles.counter}>{text.length}/{TICKET_TEXT_MAX}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.primaryBtn, (!text.trim() || sending) && styles.disabled]}
          disabled={!text.trim() || sending}
          onPress={submit}
        >
          {sending ? <ActivityIndicator color={th.hex("#fff")} /> : <Text style={styles.primaryText}>Send Feedback</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your earlier feedback</Text>
      {loading ? (
        <ActivityIndicator color={th.c.primary} style={{ alignSelf: "flex-start" }} />
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

const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center", gap: 10 },
  back: { display: t.v2 ? ("none" as const) : ("flex" as const), flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { ...t.f(), fontSize: 13, color: t.c.subText },
  title: { fontSize: 22, ...t.f("800"), color: t.c.text },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19 },
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 16 : 12, borderWidth: 1, borderColor: t.c.border, padding: 18, gap: 8, marginTop: 6 },
  success: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: t.hex("#ECFDF5"), borderRadius: t.v2 ? 12 : 8, padding: 8 },
  successText: { fontSize: 13, color: t.hex("#047857"), ...t.f("600") },
  label: { fontSize: 13, ...t.f("700"), color: t.c.text, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: t.c.border, borderRadius: t.v2 ? 20 : 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: t.c.surface },
  chipActive: { borderColor: t.c.primary, backgroundColor: t.hex("#EFF6FF") },
  chipText: { ...t.f(), fontSize: 13, color: t.c.text },
  chipTextActive: { color: t.c.primary, ...t.f("700") },
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
  counter: { ...t.f(), fontSize: 11, color: t.c.subText, alignSelf: "flex-end" },
  error: { ...t.f(), fontSize: 13, color: t.c.danger },
  primaryBtn: { backgroundColor: t.c.primary, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center", alignSelf: "flex-start", minWidth: 150 },
  primaryText: { color: t.hex("#fff"), fontSize: 13, ...t.f("700") },
  disabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 15, ...t.f("700"), color: t.c.text, marginTop: 12 },
  item: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 16 : 12, borderWidth: 1, borderColor: t.c.border, padding: 14, gap: 4 },
  itemTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  itemArea: { fontSize: 12, ...t.f("700"), color: t.c.primary },
  itemDate: { ...t.f(), fontSize: 12, color: t.c.subText },
  itemText: { ...t.f(), fontSize: 14, color: t.c.text, lineHeight: 20 },
  link: { fontSize: 13, color: t.c.primary, ...t.f("600"), marginTop: 4 },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
