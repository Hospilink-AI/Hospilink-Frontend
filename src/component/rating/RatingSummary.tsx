import { COLORS } from "@/constant/colors";
import { categoryLabel } from "@/constant/support";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type RatingBreakdown = {
  rawAverage?: number;
  reviewCount?: number;
  platformAverage?: number;
  dampedAverage?: number;
  penaltyTotal?: number;
  penaltyCapped?: boolean;
  qualifyingIncidents?: { ticketId?: string; category?: string; points?: number }[];
};

interface Props {
  effectiveRating?: number | null;
  averageRating?: number | null;
  totalRatings?: number | null;
  breakdown?: RatingBreakdown | null;
  // "you" on the hospital's own screen, "they" for admin views
  viewer?: "self" | "admin";
  // rating set by an admin (approved by a second admin); shown instead of the calculated one
  override?: { value?: number; reason?: string; expiresAt?: string | null } | null;
}

const fmt = (n?: number | null) => (typeof n === "number" ? n.toFixed(1) : "—");

export function Stars({ value, size = 18 }: { value?: number | null; size?: number }) {
  const v = typeof value === "number" ? value : 0;
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={v >= i ? "star" : v >= i - 0.5 ? "star-half" : "star-outline"}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

// Rating shown to others plus a "why is this my rating?" breakdown. Reused on every rating surface.
export default function RatingSummary({ effectiveRating, averageRating, totalRatings, breakdown, viewer = "self", override }: Props) {
  const [open, setOpen] = useState(false);
  const b = breakdown ?? {};
  const count = b.reviewCount ?? totalRatings ?? 0;
  const set =
    override && typeof override.value === "number" && (!override.expiresAt || new Date(override.expiresAt) > new Date())
      ? override
      : null;
  const shown = set ? set.value : effectiveRating ?? b.dampedAverage ?? null;
  const penalty = b.penaltyTotal ?? 0;
  const you = viewer === "self";

  // No reviews yet: show as unrated, not as the platform average the server starts from
  if (count === 0 && !set) {
    return (
      <View style={styles.wrap}>
        <View style={styles.top}>
          <View style={styles.unratedIcon}>
            <Ionicons name="star-outline" size={22} color={COLORS.subText} />
          </View>
          <View style={{ gap: 2, flexShrink: 1 }}>
            <Text style={styles.unrated}>Unrated</Text>
            <Text style={styles.muted}>
              {you ? "Your rating appears after your first review." : "No reviews yet."}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.big}>{fmt(shown)}</Text>
        <View style={{ gap: 4 }}>
          <Stars value={shown} />
          <Text style={styles.muted}>
            {set ? "Set by HospiLink" : count === 0 ? "No reviews yet" : `Based on ${count} review${count === 1 ? "" : "s"}`}
          </Text>
        </View>
      </View>

      {!!set && (
        <View style={styles.setBox}>
          <Text style={styles.setText}>
            {you ? "HospiLink has set your rating" : "Rating set by an admin"}
            {set.expiresAt ? ` until ${new Date(set.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}.
            {set.reason ? ` Reason: ${set.reason}` : ""}
          </Text>
          {!you && typeof effectiveRating === "number" && effectiveRating !== set.value && (
            <Text style={styles.muted}>Calculated rating: {fmt(effectiveRating)}</Text>
          )}
        </View>
      )}

      {!!breakdown && (
        <TouchableOpacity style={styles.toggle} onPress={() => setOpen(!open)} activeOpacity={0.8}>
          <Text style={styles.toggleText}>{you ? "Why is this my rating?" : "How this rating is worked out"}</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {open && !!breakdown && (
        <View style={styles.breakdown}>
          <Row label={count === 0 ? "Reviews received" : `Average of ${count} review${count === 1 ? "" : "s"}`} value={count === 0 ? "None yet" : fmt(b.rawAverage ?? averageRating)} />
          <Row label="Platform average" value={fmt(b.platformAverage)} />
          <Text style={styles.note}>
            {count === 0
              ? `${you ? "You start" : "New profiles start"} at the platform average until reviews come in.`
              : "Profiles with only a few reviews are balanced towards the platform average, so one review can't swing the rating too far."}
          </Text>
          <Row label="After balancing" value={fmt(b.dampedAverage)} />
          {penalty > 0 && (
            <>
              <Row label={`Upheld complaints${b.penaltyCapped ? " (capped)" : ""}`} value={`−${penalty.toFixed(2)}`} danger />
              {(b.qualifyingIncidents ?? []).map((inc, i) => (
                <Text key={i} style={styles.incident}>
                  • {inc.ticketId ?? "Ticket"} · {categoryLabel(inc.category)} · −{(inc.points ?? 0).toFixed(2)}
                </Text>
              ))}
              <Text style={styles.note}>
                Points from upheld complaints only count for a limited time, then drop off automatically.
              </Text>
            </>
          )}
          <View style={styles.divider} />
          <Row label="Rating shown" value={fmt(shown)} strong />
        </View>
      )}
    </View>
  );
}

function Row({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong, danger && { color: COLORS.red }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  setBox: { backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10, gap: 2 },
  setText: { fontSize: 12, color: "#1E3A8A", lineHeight: 17 },
  top: { flexDirection: "row", alignItems: "center", gap: 14 },
  big: { fontSize: 36, fontWeight: "800", color: COLORS.text },
  unrated: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  unratedIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  muted: { fontSize: 13, color: COLORS.subText },
  toggle: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  toggleText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  breakdown: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  rowLabel: { fontSize: 13, color: COLORS.text, flexShrink: 1 },
  rowValue: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  strong: { fontWeight: "800" },
  note: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  incident: { fontSize: 12, color: COLORS.subText },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
});
