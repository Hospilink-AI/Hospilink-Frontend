import { COLORS } from "@/constant/colors";
import { Option, REASON_TEXT_MAX } from "@/constant/jobs";
import { Ionicons } from "@expo/vector-icons";
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
  confirmLabel,
  tone = "primary",
  loading,
  error,
  onClose,
  onConfirm,
  children,
}: Props) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (visible) {
      setReason("");
      setNote("");
    }
  }, [visible]);

  const needsReason = !!reasons?.length;
  const disabled = loading || (needsReason && !reason);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={COLORS.subText} />
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
                    <Ionicons
                      name={active ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={active ? COLORS.primary : COLORS.subText}
                    />
                    <Text style={styles.optionText}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}

            {showNote && (
              <TextInput
                style={styles.note}
                value={note}
                onChangeText={(t) => setNote(t.slice(0, REASON_TEXT_MAX))}
                placeholder="Add a note (optional)"
                placeholderTextColor="#9CA3AF"
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
                tone === "danger" && { backgroundColor: COLORS.red },
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => onConfirm(reason, note.trim())}
              disabled={disabled}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
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

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  close: { position: "absolute", top: 14, right: 14, zIndex: 1 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text, marginBottom: 6, paddingRight: 24 },
  message: { fontSize: 13, color: COLORS.subText, lineHeight: 19, marginBottom: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  optionText: { fontSize: 13, color: COLORS.text, flex: 1 },
  note: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    fontSize: 13,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  error: { fontSize: 12, color: COLORS.red, marginTop: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
  confirmBtn: {
    minWidth: 110,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
