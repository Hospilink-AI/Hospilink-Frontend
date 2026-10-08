import { Theme, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { COLORS } from "@/constant/colors";
import { Option, REASON_TEXT_MAX } from "@/constant/jobs";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  // When set, a reason must be picked before confirming.
  reasons?: Option[];
  showNote?: boolean;
  noteRequired?: boolean;
  noteMax?: number;
  notePlaceholder?: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => void;
  children?: React.ReactNode;
}

export default function ActionModal({
  visible,
  title,
  message,
  reasons,
  showNote = !!reasons,
  noteRequired = false,
  noteMax = REASON_TEXT_MAX,
  notePlaceholder = "Add a note (optional)",
  confirmLabel,
  tone = "primary",
  loading,
  error,
  onClose,
  onConfirm,
  children,
}: Props) {
  const styles = use_styles();
  const th = useTheme();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (visible) {
      setReason("");
      setNote("");
    }
  }, [visible]);

  const needsReason = !!reasons?.length;
  const disabled = loading || (needsReason && !reason) || (noteRequired && !note.trim());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <TIcon ion="close" size={20} color={th.c.subText} />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
            {children}

            {needsReason &&
              reasons!.map((r) => {
                const active = reason === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => setReason(r.value)}
                    activeOpacity={0.8}
                  >
                    <TIcon
                      ion={active ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={active ? th.c.primary : th.c.subText}
                    />
                    <Text style={styles.optionText}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}

            {showNote && (
              <TextInput
                style={styles.note}
                value={note}
                onChangeText={(t) => setNote(t.slice(0, noteMax))}
                placeholder={notePlaceholder}
                placeholderTextColor={th.hex("#9CA3AF")}
                multiline
              />
            )}
          </ScrollView>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                tone === "danger" && { backgroundColor: th.hex(COLORS.red) },
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => onConfirm(reason, note.trim())}
              disabled={disabled}
            >
              {loading ? (
                <ActivityIndicator size="small" color={th.hex("#fff")} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const use_styles = () => useThemedStyles(make_styles as any) as any;
const make_styles = (t: Theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  box: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: t.c.surface,
    borderRadius: 14,
    padding: 20,
  },
  close: { position: "absolute", top: 14, right: 14, zIndex: 1 },
  title: { fontSize: 17, ...t.f("700"), color: t.c.text, marginBottom: 6, paddingRight: 24 },
  message: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19, marginBottom: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: { borderColor: t.c.primary, backgroundColor: t.hex("#EFF6FF") },
  optionText: { ...t.f(), fontSize: 13, color: t.c.text, flex: 1 },
  note: { ...t.f(),
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    fontSize: 13,
    color: t.c.text,
    textAlignVertical: "top",
  },
  error: { ...t.f(), fontSize: 12, color: t.hex(COLORS.red), marginTop: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: t.c.border,
  },
  cancelText: { fontSize: 14, ...t.f("600"), color: t.c.subText },
  confirmBtn: {
    minWidth: 110,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: t.c.primary,
  },
  confirmText: { fontSize: 14, ...t.f("700"), color: t.hex("#fff") },
} as const);
