import { Theme, useTheme } from "@/ds/theme";
import { useThemedStyles } from "@/ds/themed";
import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

// Renders a legal document (privacy policy, terms) from plain data so the wording lives in one place.
// Paragraph strings can contain an email address, which becomes a mailto link.

export type LegalBlock = string | { bullets: string[] } | { sub: string; blocks: LegalBlock[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };
export type LegalDocument = { title: string; updated: string; intro: string[]; sections: LegalSection[] };

const EMAIL = /([a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,})/i;

function Para({ text }: { text: string }) {
  const s = use_s();
  const parts = text.split(EMAIL);
  return (
    <Text style={s.p}>
      {parts.map((part, i) =>
        EMAIL.test(part) ? (
          <Text key={i} style={s.link} onPress={() => Linking.openURL(`mailto:${part}`)}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const s = use_s();
  if (typeof block === "string") return <Para text={block} />;
  if ("bullets" in block) {
    return (
      <View style={s.list}>
        {block.bullets.map((b, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.dot}>•</Text>
            <View style={{ flex: 1 }}>
              <Para text={b} />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={s.sub}>
      <Text style={s.subTitle}>{block.sub}</Text>
      {block.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </View>
  );
}

export default function LegalDoc({ doc }: { doc: LegalDocument }) {
  const s = use_s();
  return (
    <View style={s.wrap}>
      <Text style={s.title}>{doc.title}</Text>
      <Text style={s.updated}>Last updated: {doc.updated}</Text>
      {doc.intro.map((t, i) => (
        <Para key={i} text={t} />
      ))}
      {doc.sections.map((sec) => (
        <View key={sec.title} style={s.section}>
          <Text style={s.h2}>{sec.title}</Text>
          {sec.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </View>
      ))}
    </View>
  );
}

const use_s = () => useThemedStyles(make_s as any) as any;
const make_s = (t: Theme) => ({
  wrap: { width: "100%", maxWidth: 820, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 24, gap: 10 },
  title: { fontSize: 28, ...t.f("800"), color: t.c.text },
  updated: { ...t.f(), fontSize: 13, color: t.c.subText, marginBottom: 6 },
  section: { marginTop: 18, gap: 8 },
  h2: { fontSize: 19, ...t.f("700"), color: t.c.text },
  sub: { marginTop: 6, gap: 6 },
  subTitle: { fontSize: 15, ...t.f("700"), color: t.c.text },
  p: { ...t.f(), fontSize: 15, lineHeight: 23, color: t.hex("#334155") },
  link: { color: t.c.primary, ...t.f("600") },
  list: { gap: 6 },
  bulletRow: { flexDirection: "row", gap: 8 },
  dot: { ...t.f(), fontSize: 15, lineHeight: 23, color: t.c.subText },
} as const);
