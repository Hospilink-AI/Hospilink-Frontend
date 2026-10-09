import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { EVIDENCE_MAX_FILES, EVIDENCE_TYPES, PickedFile, evidenceError } from "@/constant/support";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  compact?: boolean;
  labels?: { attach: string; addMore: string };
}

// Picks JPG/PNG/PDF evidence, up to 5 files, 10 MB each.
export default function EvidencePicker({ files, onChange, compact, labels }: Props) {
  const styles = useStylesThemed();
  const th = useTheme();
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: EVIDENCE_TYPES,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const next = [
      ...files,
      ...res.assets.map((a: any) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size, file: a.file })),
    ];
    const msg = evidenceError(next);
    setError(msg);
    if (!msg) onChange(next);
  };

  const remove = (index: number) => {
    setError(null);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <View style={{ gap: 8 }}>
      {files.length > 0 && (
        <View style={styles.list}>
          {files.map((f, i) => (
            <View key={`${f.name}-${i}`} style={styles.chip}>
              <TIcon ion={f.mimeType === "application/pdf" ? "document-text-outline" : "image-outline"} size={14} color={th.c.subText} />
              <Text style={styles.chipText} numberOfLines={1}>{f.name}</Text>
              <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <TIcon ion="close" size={14} color={th.c.subText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {files.length < EVIDENCE_MAX_FILES && (
        <TouchableOpacity style={[styles.addBtn, compact && styles.addBtnCompact]} onPress={pick} activeOpacity={0.8}>
          <TIcon ion="attach-outline" size={16} color={th.c.primary} />
          <Text style={styles.addText}>{files.length ? labels?.addMore ?? "Add more files" : labels?.attach ?? "Attach files"}</Text>
        </TouchableOpacity>
      )}
      {!compact && <Text style={styles.hint}>JPG, PNG or PDF. Up to 5 files, 10 MB each.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const make_styles = (t: Theme) => ({
  list: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    backgroundColor: t.hex("#F1F5F9"),
    borderRadius: t.v2 ? 12 : 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { ...t.f(), flexShrink: 1, fontSize: 12, color: t.c.text },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: t.c.primary,
    borderStyle: "dashed",
    borderRadius: t.v2 ? 12 : 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnCompact: { paddingVertical: 6 },
  addText: { fontSize: 13, color: t.c.primary, ...t.f("600") },
  hint: { ...t.f(), fontSize: 11, color: t.c.subText },
  error: { ...t.f(), fontSize: 12, color: t.c.danger },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
