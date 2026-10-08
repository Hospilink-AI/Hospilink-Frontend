import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import EvidencePicker from "@/component/support/EvidencePicker";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import { BOT_STARTERS, CHAT_LANGUAGES, CHAT_UI, PickedFile, TICKET_TEXT_MAX, splitButton } from "@/constant/support";
import { chatbotAPI } from "@/service/api";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message = { sender: "user" | "bot"; text?: string | null; buttons?: string[]; selectedButton?: string | null; at?: string };
type Conversation = { _id: string; language: string; messages: Message[]; ticket?: string | null; status: "active" | "completed" | "abandoned" };

// base: "/medicalStaff/support" or "/hospital/support"
export default function ChatbotScreen({ base }: { base: string }) {
  const styles = useStylesThemed();
  const th = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [language, setLanguage] = useState("en");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await chatbotAPI.getActive();
      setConversation(res.conversation ?? null);
    } catch (err: any) {
      setError(apiError(err, "Could not load your conversation."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

  const send = async (fields: { text?: string; selectedButton?: string }) => {
    if (sending) return;
    const active = conversation?.status === "active" ? conversation : null;
    setSending(true);
    setError(null);
    // Show the user's turn straight away; the response replaces it with the saved conversation.
    const pending: Message = { sender: "user", text: fields.text ?? null, selectedButton: fields.selectedButton ?? null, at: new Date().toISOString() };
    setConversation((prev) =>
      active && prev ? { ...prev, messages: [...prev.messages, pending] } : { _id: "", language, messages: [pending], status: "active" }
    );
    scrollToEnd();
    try {
      const res = await chatbotAPI.send(
        { ...fields, ...(active ? { conversationId: active._id } : { language }) },
        files
      );
      setConversation(res.conversation);
      setText("");
      setFiles([]);
    } catch (err: any) {
      setError(apiError(err, "Your message didn't go through. Please try again."));
      setConversation(active);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const sendText = () => {
    const value = text.trim();
    if (!value && !files.length) return;
    send(value ? { text: value } : {});
  };

  const startOver = () => {
    setConversation(null);
    setText("");
    setFiles([]);
    setError(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={th.c.primary} />
      </View>
    );
  }

  const messages = conversation?.messages ?? [];
  const isActive = !conversation || conversation.status === "active";
  const last = messages[messages.length - 1];
  const buttons = isActive && !sending && last?.sender === "bot" ? last.buttons ?? [] : [];
  const awaitingEvidence = isActive && !!conversation?.ticket;
  const chatLanguage = conversation?.language ?? language;
  const starters = BOT_STARTERS[chatLanguage] ?? BOT_STARTERS.en;
  const ui = CHAT_UI[chatLanguage] ?? CHAT_UI.en;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(base as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <TIcon ion="arrow-back" size={20} color={th.c.text} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <TIcon ion="chatbubbles-outline" size={18} color={th.c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>HospiLink Support</Text>
          <Text style={styles.subtitle}>{sending ? ui.typing : ui.subtitle}</Text>
        </View>
        {conversation && conversation.status === "active" && conversation._id !== "" && (
          <TouchableOpacity onPress={startOver} style={styles.newChat}>
            <Text style={styles.newChatText}>{ui.newChat}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {!conversation && (
          <View style={styles.welcome}>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.botText}>
                {ui.welcome}
              </Text>
            </View>
            <Text style={styles.langLabel}>Chat in</Text>
            <View style={styles.chips}>
              {CHAT_LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.value}
                  style={[styles.langChip, language === l.value && styles.langChipActive]}
                  onPress={() => setLanguage(l.value)}
                >
                  <Text style={[styles.langChipText, language === l.value && styles.langChipTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => {
          const mine = m.sender === "user";
          const shown = m.selectedButton ? splitButton(m.selectedButton).label : m.text;
          const showDate = i === 0 || formatDate(messages[i - 1].at) !== formatDate(m.at);
          return (
            <View key={i}>
              {showDate && !!m.at && <Text style={styles.dateSep}>{formatDate(m.at)}</Text>}
              <View style={[styles.bubble, mine ? styles.userBubble : styles.botBubble]}>
                {!!shown && <Text style={mine ? styles.userText : styles.botText}>{shown}</Text>}
                {mine && !shown && <Text style={styles.userText}>{ui.sentAttachment}</Text>}
                {!!m.at && <Text style={[styles.time, mine && { color: th.hex("#DBEAFE") }]}>{formatTime(m.at)}</Text>}
              </View>
            </View>
          );
        })}

        {sending && (
          <View style={[styles.bubble, styles.botBubble, styles.typing]}>
            <ActivityIndicator size="small" color={th.c.subText} />
          </View>
        )}

        {!conversation && !sending && (
          <View style={styles.chips}>
            {starters.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => send({ selectedButton: s })}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {buttons.length > 0 && (
          <View style={styles.chips}>
            {buttons.map((b) => (
              <TouchableOpacity key={b} style={styles.chip} onPress={() => send({ selectedButton: b })}>
                <Text style={styles.chipText}>{splitButton(b).label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {conversation?.status === "abandoned" && (
          <View style={styles.endCard}>
            <Text style={styles.endText}>{ui.formNeeded}</Text>
            <View style={styles.endRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`${base}/new` as any)}>
                <Text style={styles.primaryText}>{ui.raiseTicket}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={startOver}>
                <Text style={styles.outlineText}>{ui.startNew}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {conversation?.status === "completed" && (
          <View style={styles.endCard}>
            <Text style={styles.endText}>{ui.closed}</Text>
            <View style={styles.endRow}>
              {!!conversation.ticket && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`${base}/tickets/${conversation.ticket}` as any)}>
                  <Text style={styles.primaryText}>{ui.viewTicket}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.outlineBtn} onPress={startOver}>
                <Text style={styles.outlineText}>{ui.startNew}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {isActive && (
        <View style={styles.composer}>
          {awaitingEvidence && (
            <EvidencePicker files={files} onChange={setFiles} compact labels={{ attach: ui.attach, addMore: ui.addMore }} />
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, TICKET_TEXT_MAX))}
              placeholder={ui.placeholder}
              placeholderTextColor={th.hex("#9CA3AF")}
              multiline
              editable={!sending}
              onKeyPress={(e: any) => {
                // Web: Enter sends, Shift+Enter adds a line
                if (Platform.OS === "web" && e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
                  e.preventDefault?.();
                  sendText();
                }
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sending || (!text.trim() && !files.length)) && styles.disabled]}
              disabled={sending || (!text.trim() && !files.length)}
              onPress={sendText}
            >
              <TIcon ion="send" size={18} color={th.hex("#fff")} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.c.surface,
    borderBottomWidth: 1,
    borderBottomColor: t.c.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.hex("#EFF6FF"),
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, ...t.f("700"), color: t.c.text },
  subtitle: { ...t.f(), fontSize: 12, color: t.c.subText },
  newChat: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: t.v2 ? 12 : 8, borderWidth: 1, borderColor: t.c.border },
  newChatText: { fontSize: 12, color: t.c.text, ...t.f("600") },
  thread: { padding: 16, gap: 10, maxWidth: 760, width: "100%", alignSelf: "center" },
  welcome: { gap: 10 },
  bubble: { maxWidth: "82%", borderRadius: t.v2 ? 18 : 14, paddingHorizontal: 14, paddingVertical: 10 },
  botBubble: { alignSelf: "flex-start", backgroundColor: t.c.surface, borderWidth: 1, borderColor: t.c.border, borderTopLeftRadius: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: t.c.primary, borderTopRightRadius: 4 },
  botText: { ...t.f(), fontSize: 14, color: t.c.text, lineHeight: 20 },
  userText: { ...t.f(), fontSize: 14, color: t.hex("#fff"), lineHeight: 20 },
  time: { ...t.f(), fontSize: 10, color: t.c.subText, marginTop: 4, alignSelf: "flex-end" },
  typing: { paddingVertical: 12 },
  dateSep: { ...t.f(), alignSelf: "center", fontSize: 11, color: t.c.subText, marginVertical: 4 },
  langLabel: { ...t.f(), fontSize: 12, color: t.c.subText, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: t.c.primary,
    backgroundColor: t.c.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: t.c.primary, ...t.f("600") },
  langChip: { borderWidth: 1, borderColor: t.c.border, borderRadius: t.v2 ? 20 : 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: t.c.surface },
  langChipActive: { borderColor: t.c.primary, backgroundColor: t.hex("#EFF6FF") },
  langChipText: { ...t.f(), fontSize: 13, color: t.c.text },
  langChipTextActive: { color: t.c.primary, ...t.f("700") },
  endCard: {
    backgroundColor: t.c.surface,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.v2 ? 16 : 12,
    padding: 14,
    gap: 10,
  },
  endText: { ...t.f(), fontSize: 13, color: t.c.text },
  endRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryBtn: { backgroundColor: t.c.primary, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryText: { color: t.hex("#fff"), fontSize: 13, ...t.f("700") },
  outlineBtn: { borderWidth: 1, borderColor: t.c.border, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.c.surface },
  outlineText: { color: t.c.text, fontSize: 13, ...t.f("600") },
  error: { ...t.f(), fontSize: 13, color: t.c.danger, textAlign: "center" },
  composer: {
    gap: 8,
    padding: 12,
    backgroundColor: t.c.surface,
    borderTopWidth: 1,
    borderTopColor: t.c.border,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: 760, width: "100%", alignSelf: "center" },
  input: { ...t.f(),
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.v2 ? 14 : 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: t.c.text,
    backgroundColor: t.c.background,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
