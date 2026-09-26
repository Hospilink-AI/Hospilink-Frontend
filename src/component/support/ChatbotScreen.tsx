import EvidencePicker from "@/component/support/EvidencePicker";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import { BOT_STARTERS, CHAT_LANGUAGES, PickedFile, TICKET_TEXT_MAX, splitButton } from "@/constant/support";
import { chatbotAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(base as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>HospiLink Support</Text>
          <Text style={styles.subtitle}>{sending ? "Typing…" : "Tell us what happened and we'll raise a ticket"}</Text>
        </View>
        {conversation && conversation.status === "active" && conversation._id !== "" && (
          <TouchableOpacity onPress={startOver} style={styles.newChat}>
            <Text style={styles.newChatText}>New chat</Text>
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
                Hi! What do you need help with? Pick a topic below or type your message.
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
                {mine && !shown && <Text style={styles.userText}>Sent attachment</Text>}
                {!!m.at && <Text style={[styles.time, mine && { color: "#DBEAFE" }]}>{formatTime(m.at)}</Text>}
              </View>
            </View>
          );
        })}

        {sending && (
          <View style={[styles.bubble, styles.botBubble, styles.typing]}>
            <ActivityIndicator size="small" color={COLORS.subText} />
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
            <Text style={styles.endText}>This one needs a few more details than the chat can take.</Text>
            <View style={styles.endRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`${base}/new` as any)}>
                <Text style={styles.primaryText}>Raise a Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={startOver}>
                <Text style={styles.outlineText}>Start a New Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {conversation?.status === "completed" && (
          <View style={styles.endCard}>
            <Text style={styles.endText}>This conversation is closed.</Text>
            <View style={styles.endRow}>
              {!!conversation.ticket && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`${base}/tickets/${conversation.ticket}` as any)}>
                  <Text style={styles.primaryText}>View Ticket</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.outlineBtn} onPress={startOver}>
                <Text style={styles.outlineText}>Start a New Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {isActive && (
        <View style={styles.composer}>
          {awaitingEvidence && <EvidencePicker files={files} onChange={setFiles} compact />}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, TICKET_TEXT_MAX))}
              placeholder="Type your message"
              placeholderTextColor="#9CA3AF"
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
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.subText },
  newChat: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  newChatText: { fontSize: 12, color: COLORS.text, fontWeight: "600" },
  thread: { padding: 16, gap: 10, maxWidth: 760, width: "100%", alignSelf: "center" },
  welcome: { gap: 10 },
  bubble: { maxWidth: "82%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  botBubble: { alignSelf: "flex-start", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderTopLeftRadius: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: COLORS.primary, borderTopRightRadius: 4 },
  botText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  userText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  time: { fontSize: 10, color: COLORS.subText, marginTop: 4, alignSelf: "flex-end" },
  typing: { paddingVertical: 12 },
  dateSep: { alignSelf: "center", fontSize: 11, color: COLORS.subText, marginVertical: 4 },
  langLabel: { fontSize: 12, color: COLORS.subText, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  langChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.white },
  langChipActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  langChipText: { fontSize: 13, color: COLORS.text },
  langChipTextActive: { color: COLORS.primary, fontWeight: "700" },
  endCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  endText: { fontSize: 13, color: COLORS.text },
  endRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white },
  outlineText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  error: { fontSize: 13, color: COLORS.red, textAlign: "center" },
  composer: {
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: 760, width: "100%", alignSelf: "center" },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
});
