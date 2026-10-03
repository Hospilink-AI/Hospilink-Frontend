import { COLORS } from "@/constant/colors";
import { deltaSign, deltaText, deltaTone, formatValue, KpiInfo, shortDate, Tile, TONE_COLORS } from "@/constant/analytics";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// One KPI: value, change against the previous period, definition behind the (i).
export default function KpiTile({
  tile,
  info,
  compare,
}: {
  tile: Tile;
  info?: KpiInfo;
  compare?: { from: string; to: string };
}) {
  // tap pins the definition open; hover (web) shows it while the pointer is there
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const open = pinned || hover;
  const delta = deltaText(tile);
  const sign = deltaSign(tile);
  const tone = deltaTone(tile);
  const hero = !!tile.northStar;

  return (
    <View style={[s.tile, hero && s.hero]}>
      <View style={s.head}>
        <Text style={[s.label, hero && s.heroLabel]}>{tile.label}</Text>
        {hero && (
          <View style={s.star}>
            <Text style={s.starText}>North Star</Text>
          </View>
        )}
        {tile.isProjected && (
          <View style={s.projected}>
            <Text style={s.projectedText}>Projected</Text>
          </View>
        )}
        {!!info && (
          <Pressable
            onPress={() => setPinned((p) => !p)}
            onHoverIn={() => setHover(true)}
            onHoverOut={() => setHover(false)}
            hitSlop={8}
            accessibilityLabel={`What is ${tile.label}?`}
            style={{ marginLeft: "auto" }}
          >
            <Ionicons name="information-circle-outline" size={16} color={COLORS.subText} />
          </Pressable>
        )}
      </View>
      {open && !!info && <Text style={s.definition}>{info.definition}</Text>}

      <Text style={[s.value, hero && s.heroValue]} numberOfLines={1} adjustsFontSizeToFit>
        {formatValue(tile.value, tile.unit)}
      </Text>

      <View style={s.deltaRow}>
        {delta ? (
          <>
            <Ionicons
              name={sign > 0 ? "arrow-up" : sign < 0 ? "arrow-down" : "remove"}
              size={13}
              color={TONE_COLORS[tone]}
            />
            <Text style={[s.delta, { color: TONE_COLORS[tone] }]}>{delta}</Text>
          </>
        ) : (
          <Text style={s.muted}>No earlier figure</Text>
        )}
        {!!compare && (
          <Text style={s.muted} numberOfLines={1}>
            vs {shortDate(compare.from)} – {shortDate(compare.to)}
            {tile.previous !== null ? ` (${formatValue(tile.previous, tile.unit)})` : ""}
          </Text>
        )}
      </View>
      {tile.isProjected && !!tile.source && <Text style={s.source}>Source: {tile.source.replace(/_/g, " ")}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 6,
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 160,
  },
  hero: { flexBasis: "100%", borderColor: "#BFDBFE", backgroundColor: "#F8FBFF", padding: 18 },
  head: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  label: { fontSize: 13, color: COLORS.subText, fontWeight: "600", flexShrink: 1 },
  heroLabel: { fontSize: 15, color: COLORS.text },
  star: { backgroundColor: "#DBEAFE", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  starText: { fontSize: 10, fontWeight: "700", color: "#1D4ED8" },
  projected: { backgroundColor: "#FEF3C7", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  projectedText: { fontSize: 10, fontWeight: "700", color: "#92400E" },
  definition: { fontSize: 12, color: COLORS.text, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 8, lineHeight: 17 },
  value: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  heroValue: { fontSize: 48, lineHeight: 56 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  delta: { fontSize: 12, fontWeight: "700" },
  muted: { fontSize: 11, color: COLORS.subText },
  source: { fontSize: 10, color: COLORS.subText },
});
