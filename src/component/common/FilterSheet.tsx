import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";

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
  const styles = useStylesThemed();
  const th = useTheme();
  const active = count > 0 || (!!value && value !== "All");
  return (
    <TouchableOpacity style={[styles.btn, active && styles.btnActive]} onPress={onPress} activeOpacity={0.8}>
      <TIcon ion="options-outline" size={16} color={active ? th.c.primary : th.c.text} />
      <Text style={[styles.btnText, active && { color: th.c.primary }]} numberOfLines={1}>
        {label}
        {value ? `: ${value}` : ""}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <TIcon ion="chevron-down" size={14} color={active ? th.c.primary : th.c.subText} />
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
  const styles = useStylesThemed();
  const th = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <TIcon ion="close" size={22} color={th.c.subText} />
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
  const styles = useStylesThemed();
  const th = useTheme();
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
            <Text style={[styles.optionText, on && { color: th.c.primary, ...th.f("700") }]}>{o.label}</Text>
            {on && <TIcon ion="checkmark" size={20} color={th.c.primary} />}
          </TouchableOpacity>
        );
      })}
    </BottomSheet>
  );
}

const make_styles = (t: Theme) => ({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: t.c.border,
    backgroundColor: t.c.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  btnActive: { borderColor: t.c.primary, backgroundColor: t.hex("#EFF6FF") },
  btnText: { fontSize: 13, ...t.f("600"), color: t.c.text, flexShrink: 1 },
  badge: { backgroundColor: t.c.primary, borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: t.hex("#fff"), fontSize: 11, ...t.f("700") },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: t.c.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingBottom: 22,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: t.c.border, marginTop: 8, marginBottom: 6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  title: { fontSize: 17, ...t.f("800"), color: t.c.text },
  footer: { flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.c.border },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.hex("#F1F5F9"),
  },
  optionText: { ...t.f(), fontSize: 15, color: t.c.text },
});
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
