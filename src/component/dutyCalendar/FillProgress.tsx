import { Theme, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { COLORS } from "@/constant/colors";
import { DUTY_CALENDAR_ENABLED, FillStep, fillStepText, stepTime } from "@/constant/dutyCalendar";
import { apiError } from "@/constant/jobs";
import { dutyCalendarAPI } from "@/service/api";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

const FINAL = ["accepted", "expired", "cancelled"];

// Where a posted duty is in filling, from states the platform records. Hospital only.
export default function FillProgress({
  dutyId,
  bare,
  style,
}: {
  dutyId?: string | null;
  // inside another card: no card chrome or title
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = use_styles();
  const th = useTheme();
  const [steps, setSteps] = useState<FillStep[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const load = useCallback(async () => {
    if (!dutyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dutyCalendarAPI.getFillProgress(dutyId);
      setSteps(res?.steps ?? []);
      setCurrent(res?.current ?? null);
    } catch (err: any) {
      // not on this server yet
      if (err?.response?.status === 404 && !bare) setHidden(true);
      else setError(apiError(err, "Couldn't load the fill progress."));
    } finally {
      setLoading(false);
    }
  }, [dutyId, bare]);

  useEffect(() => {
    if (DUTY_CALENDAR_ENABLED) load();
  }, [load]);

  if (!DUTY_CALENDAR_ENABLED || !dutyId || hidden) return null;

  const finished = !!current && FINAL.includes(current);

  return (
    <View style={[!bare && styles.card, style]}>
      {!bare && (
        <View style={styles.titleRow}>
          <Text style={styles.title}>Filling progress</Text>
          <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Refresh">
            <TIcon ion="refresh" size={16} color={th.c.subText} />
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={th.c.primary} style={{ marginVertical: 10 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View>
          {(steps ?? []).map((step, i) => {
            const last = i === (steps ?? []).length - 1;
            const isCurrent = last && !finished;
            const bad = ["expired", "cancelled", "unfilled_critical", "escalated_to_admins"].includes(step.key);
            const color = step.key === "accepted" ? th.hex(COLORS.green) : bad ? th.hex(COLORS.red) : isCurrent ? th.c.primary : th.hex("#94A3B8");
            return (
              <View key={`${step.key}-${i}`} style={styles.step}>
                <View style={styles.rail}>
                  <View style={[styles.node, { borderColor: color }, (!isCurrent || finished) && { backgroundColor: color }]}>
                    {step.key === "accepted" && <TIcon ion="checkmark" size={10} color={th.hex("#fff")} />}
                  </View>
                  {!last && <View style={styles.line} />}
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepTop}>
                    {step.key === "accepted" && step.staff?.profilePicture ? (
                      <Image source={{ uri: step.staff.profilePicture }} style={styles.avatar} />
                    ) : null}
                    <Text style={[styles.stepText, isCurrent && { color: th.c.primary, ...th.f("700") }]}>
                      {fillStepText(step)}
                    </Text>
                  </View>
                  {!!step.at && <Text style={styles.when}>{stepTime(step.at)}</Text>}
                </View>
              </View>
            );
          })}
          {!finished && (
            <View style={styles.waiting}>
              <ActivityIndicator size="small" color={th.c.primary} />
              <Text style={styles.waitingText}>Waiting for someone to accept</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const use_styles = () => useThemedStyles(make_styles as any) as any;
const make_styles = (t: Theme) => ({
  card: { backgroundColor: t.c.surface, borderRadius: 12, borderWidth: 1, borderColor: t.c.border, padding: 16, marginBottom: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 14, ...t.f("800"), color: t.c.text },
  error: { ...t.f(), fontSize: 12, color: t.hex(COLORS.red) },
  step: { flexDirection: "row", gap: 10 },
  rail: { width: 14, alignItems: "center" },
  node: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: t.c.surface, marginTop: 2 },
  line: { flex: 1, width: 2, backgroundColor: t.c.border, minHeight: 14 },
  stepBody: { flex: 1, paddingBottom: 12 },
  stepTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.c.border },
  stepText: { ...t.f(), fontSize: 13, color: t.c.text, flexShrink: 1 },
  when: { ...t.f(), fontSize: 11, color: t.c.subText, marginTop: 2 },
  waiting: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 24 },
  waitingText: { ...t.f(), fontSize: 12, color: t.c.subText },
} as const);
