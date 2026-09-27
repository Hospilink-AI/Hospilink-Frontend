import { COLORS } from "@/constant/colors";
import { apiError, formatDate } from "@/constant/jobs";
import { KB_CATEGORIES } from "@/constant/support";
import { knowledgeBaseAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const QUESTION_MAX = 500;
const ANSWER_MAX = 2000;

type Draft = { id: string | null; question: string; answer: string; category: string; keywords: string };
const EMPTY: Draft = { id: null, question: "", answer: "", category: "general", keywords: "" };

const categoryName = (value?: string) => KB_CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "—";

// Answers the chatbot can give without raising a ticket.
export default function KnowledgeBaseScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await knowledgeBaseAPI.list({ page: p, limit: 20, isActive: !showInactive, ...(category && { category }) });
        setArticles(res.data ?? []);
        setPagination(res.pagination ?? null);
        setPage(p);
      } catch (err: any) {
        setError(apiError(err, "Could not load articles."));
      } finally {
        setLoading(false);
      }
    },
    [category, showInactive]
  );

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      category: draft.category,
      keywords: draft.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    };
    try {
      if (draft.id) await knowledgeBaseAPI.update(draft.id, payload);
      else await knowledgeBaseAPI.create(payload);
      setDraft(null);
      load(draft.id ? page : 1);
    } catch (err: any) {
      setFormError(apiError(err, "Could not save the article."));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (a: any) => {
    setToggling(a._id);
    setError(null);
    try {
      await knowledgeBaseAPI.setActive(a._id, !a.isActive);
      setArticles((prev) => prev.filter((x) => x._id !== a._id));
    } catch (err: any) {
      setError(apiError(err, "Could not update the article."));
    } finally {
      setToggling(null);
    }
  };

  const canSave = !!draft && !!draft.question.trim() && !!draft.answer.trim() && !saving;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Knowledge Base</Text>
          <Text style={styles.subtitle}>
            Answers the chatbot gives for questions that don't need a ticket. Anything about money, ratings or someone's conduct always becomes a ticket.
          </Text>
        </View>
        {!draft && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setFormError(null); setDraft({ ...EMPTY }); }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.primaryText}>New Article</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!draft && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{draft.id ? "Edit article" : "New article"}</Text>
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            value={draft.question}
            onChangeText={(v) => setDraft({ ...draft, question: v.slice(0, QUESTION_MAX) })}
            placeholder="e.g. How does the end-of-shift OTP work?"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>Answer</Text>
          <TextInput
            style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]}
            value={draft.answer}
            onChangeText={(v) => setDraft({ ...draft, answer: v.slice(0, ANSWER_MAX) })}
            placeholder="Plain, short answer"
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <Text style={styles.counter}>{draft.answer.length}/{ANSWER_MAX}</Text>
          <Text style={styles.label}>Topic</Text>
          <View style={styles.chips}>
            {KB_CATEGORIES.map((c) => (
              <TouchableOpacity key={c.value} style={[styles.chip, draft.category === c.value && styles.chipOn]} onPress={() => setDraft({ ...draft, category: c.value })}>
                <Text style={[styles.chipText, draft.category === c.value && styles.chipTextOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Keywords (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={draft.keywords}
            onChangeText={(v) => setDraft({ ...draft, keywords: v })}
            placeholder="otp, end shift, checkout"
            placeholderTextColor="#9CA3AF"
          />
          {!!formError && <Text style={styles.error}>{formError}</Text>}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.primaryBtn, !canSave && { opacity: 0.5 }]} disabled={!canSave} onPress={save}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setDraft(null)}>
              <Text style={styles.outlineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.filters}>
        <View style={styles.chips}>
          {KB_CATEGORIES.map((c) => (
            <TouchableOpacity key={c.value} style={[styles.chip, category === c.value && styles.chipOn]} onPress={() => setCategory(category === c.value ? null : c.value)}>
              <Text style={[styles.chipText, category === c.value && styles.chipTextOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.row} onPress={() => setShowInactive(!showInactive)}>
          <Ionicons name={showInactive ? "checkbox" : "square-outline"} size={16} color={COLORS.primary} />
          <Text style={styles.chipText}>Show hidden articles instead</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}
      {!loading && !error && articles.length === 0 && <Text style={styles.muted}>No articles here yet.</Text>}

      {!loading &&
        articles.map((a) => (
          <View key={a._id} style={[styles.card, !a.isActive && { opacity: 0.7 }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.topic}>{categoryName(a.category)}</Text>
              <Text style={styles.muted}>Updated {formatDate(a.updatedAt)}</Text>
            </View>
            <Text style={styles.question}>{a.question}</Text>
            <Text style={styles.body}>{a.answer}</Text>
            {(a.keywords ?? []).length > 0 && <Text style={styles.muted}>Keywords: {a.keywords.join(", ")}</Text>}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => {
                  setFormError(null);
                  setDraft({ id: a._id, question: a.question, answer: a.answer, category: a.category ?? "general", keywords: (a.keywords ?? []).join(", ") });
                }}
              >
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} disabled={toggling === a._id} onPress={() => toggle(a)}>
                {toggling === a._id ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={[styles.link, a.isActive && { color: COLORS.red }]}>{a.isActive ? "Hide" : "Restore"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ))}

      {!loading && pagination && pagination.totalPages > 1 && (
        <View style={styles.pager}>
          <TouchableOpacity disabled={!pagination.hasPrevPage} style={[styles.pageBtn, !pagination.hasPrevPage && { opacity: 0.4 }]} onPress={() => load(page - 1)}>
            <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{pagination.currentPage} / {pagination.totalPages}</Text>
          <TouchableOpacity disabled={!pagination.hasNextPage} style={[styles.pageBtn, !pagination.hasNextPage && { opacity: 0.4 }]} onPress={() => load(page + 1)}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 10 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, lineHeight: 19, marginTop: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: COLORS.text },
  counter: { fontSize: 11, color: COLORS.subText, alignSelf: "flex-end" },
  filters: { gap: 8, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.white },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextOn: { color: COLORS.primary, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  topic: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  question: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  body: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  muted: { fontSize: 12, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  outlineText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  linkBtn: { paddingVertical: 4, paddingRight: 8 },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
