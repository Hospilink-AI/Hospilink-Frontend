import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Phone filter pattern: a compact button above the list that opens a bottom sheet.

export function FilterButton({
  label,
  value,
  count = 0,
  onPress,
}: {
  label: string;
  value?: string;
  count?: number;
  onPress: () => void;
}) {
  const active = count > 0 || (!!value && value !== "All");
  return (
    <TouchableOpacity style={[styles.btn, active && styles.btnActive]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="options-outline" size={16} color={active ? COLORS.primary : COLORS.text} />
      <Text style={[styles.btnText, active && { color: COLORS.primary }]} numberOfLines={1}>
        {label}
        {value ? `: ${value}` : ""}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-down" size={14} color={active ? COLORS.primary : COLORS.subText} />
    </TouchableOpacity>
  );
}

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={COLORS.subText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SelectSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={o.value || "all"}
            style={styles.option}
            onPress={() => {
              onSelect(o.value);
              onClose();
            }}
          >
            <Text style={[styles.optionText, on && { color: COLORS.primary, fontWeight: "700" }]}>{o.label}</Text>
            {on && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  btnActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  btnText: { fontSize: 13, fontWeight: "600", color: COLORS.text, flexShrink: 1 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingBottom: 22,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginTop: 8, marginBottom: 6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  footer: { flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  optionText: { fontSize: 15, color: COLORS.text },
});
