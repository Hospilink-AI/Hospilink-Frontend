import DateTimeField from "@/component/common/DateTimeField";
import { BottomSheet, FilterButton, SelectSheet } from "@/component/common/FilterSheet";
import { COLORS } from "@/constant/colors";
import { Filters, GRANULARITIES, MAX_RANGE_DAYS, PRESETS, presetOf, shortDate, URGENCY_OPTIONS } from "@/constant/analytics";
import { daysBetween, todayKey } from "@/constant/dutyCalendar";
import { JOB_ROLES, roleLabel } from "@/constant/jobs";
import { URGENCY_LABELS } from "@/constant/autoRelist";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const ROLE_OPTIONS = [{ label: "All roles", value: "" }, ...JOB_ROLES];

const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (k?: string) => (k ? new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))) : null);

// Date range, granularity, role, priority and city - shared by every section.
export default function FilterBar({
  filters,
  onChange,
  compact,
  dutyFiltersOff,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  compact: boolean;
  // role / priority / city don't apply to this section
  dutyFiltersOff?: boolean;
}) {
  const [sheet, setSheet] = useState(false);
  // the period shows on the button itself
  const active = [filters.staffRole, filters.urgency, filters.city, filters.granularity].filter(Boolean).length;
  const preset = presetOf(filters.from, filters.to);
  const rangeText = preset
    ? PRESETS.find((p) => p.key === preset)!.label
    : `${shortDate(filters.from)} – ${shortDate(filters.to)}`;

  if (compact) {
    return (
      <>
        <FilterButton label="Filters" value={rangeText} count={active} onPress={() => setSheet(true)} />
        <BottomSheet
          visible={sheet}
          title="Filters"
          onClose={() => setSheet(false)}
          footer={
            <TouchableOpacity style={s.done} onPress={() => setSheet(false)}>
              <Text style={s.doneText}>Done</Text>
            </TouchableOpacity>
          }
        >
          <Controls filters={filters} onChange={onChange} stacked dutyFiltersOff={dutyFiltersOff} />
        </BottomSheet>
      </>
    );
  }
  return (
    <View style={s.bar}>
      <Controls filters={filters} onChange={onChange} dutyFiltersOff={dutyFiltersOff} />
    </View>
  );
}

function Controls({
  filters,
  onChange,
  stacked,
  dutyFiltersOff,
}: {
  filters: Filters;
  onChange: (n: Partial<Filters>) => void;
  stacked?: boolean;
  dutyFiltersOff?: boolean;
}) {
  const [picking, setPicking] = useState<"role" | "urgency" | null>(null);
  const [custom, setCustom] = useState(false);
  const [city, setCity] = useState(filters.city ?? "");
  const [rangeError, setRangeError] = useState<string | null>(null);
  const preset = presetOf(filters.from, filters.to);

  useEffect(() => setCity(filters.city ?? ""), [filters.city]);

  const setRange = (from?: string, to?: string) => {
    setRangeError(null);
    const today = todayKey();
    if (!from || !to) return;
    if (from > to) return setRangeError("The start must be on or before the end.");
    if (to > today) return setRangeError("The end can't be after today.");
    if (daysBetween(from, to) + 1 > MAX_RANGE_DAYS) return setRangeError(`Pick up to ${MAX_RANGE_DAYS} days.`);
    onChange({ from, to });
  };

  return (
    <View style={[s.controls, stacked && s.stacked]}>
      <View style={s.group}>
        <Text style={s.groupLabel}>Period</Text>
        <View style={s.chips}>
          {PRESETS.map((p) => (
            <Chip
              key={p.key}
              label={p.label}
              on={preset === p.key && !custom}
              onPress={() => {
                setCustom(false);
                setRangeError(null);
                // the server's default is the last 30 days; keep the URL clean
                p.key === "30d" ? onChange({ from: undefined, to: undefined }) : onChange(p.range());
              }}
            />
          ))}
          <Chip label="Custom" on={custom || !preset} onPress={() => setCustom(true)} />
        </View>
        {(custom || !preset) && (
          <View style={s.range}>
            <View style={s.dateBox}>
              <DateTimeField mode="date" value={fromKey(filters.from)} onChange={(d) => setRange(toKey(d), filters.to ?? todayKey())} placeholder="From" />
            </View>
            <Text style={s.muted}>to</Text>
            <View style={s.dateBox}>
              <DateTimeField mode="date" value={fromKey(filters.to)} onChange={(d) => setRange(filters.from ?? toKey(d), toKey(d))} placeholder="To" />
            </View>
          </View>
        )}
        {!!rangeError && <Text style={s.error}>{rangeError}</Text>}
      </View>

      <View style={s.group}>
        <Text style={s.groupLabel}>Group by</Text>
        <View style={s.chips}>
          {GRANULARITIES.map((g) => (
            <Chip key={g.label} label={g.label} on={(filters.granularity ?? "") === g.value} onPress={() => onChange({ granularity: g.value || undefined })} />
          ))}
        </View>
      </View>

      <View style={[s.group, s.selects, dutyFiltersOff && s.off]} pointerEvents={dutyFiltersOff ? "none" : "auto"}>
        <SelectButton label={filters.staffRole ? roleLabel(filters.staffRole) : "All roles"} on={!!filters.staffRole} onPress={() => setPicking("role")} />
        <SelectButton label={filters.urgency ? URGENCY_LABELS[filters.urgency] : "All priorities"} on={!!filters.urgency} onPress={() => setPicking("urgency")} />
        <View style={[s.cityBox, !!filters.city && s.selectOn]}>
          <Ionicons name="location-outline" size={14} color={COLORS.subText} />
          <TextInput
            style={s.cityInput}
            value={city}
            onChangeText={setCity}
            onSubmitEditing={() => onChange({ city: city.trim() || undefined })}
            onBlur={() => city.trim() !== (filters.city ?? "") && onChange({ city: city.trim() || undefined })}
            placeholder="All cities"
            placeholderTextColor="#94A3B8"
            maxLength={100}
            returnKeyType="search"
          />
          {!!filters.city && (
            <TouchableOpacity onPress={() => onChange({ city: undefined })} accessibilityLabel="Clear city">
              <Ionicons name="close-circle" size={16} color={COLORS.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {dutyFiltersOff && <Text style={[s.muted, s.offNote]}>Role, priority and city don't apply to this section.</Text>}

      <SelectSheet
        visible={picking === "role"}
        title="Role"
        options={ROLE_OPTIONS}
        value={filters.staffRole ?? ""}
        onSelect={(v) => onChange({ staffRole: v || undefined })}
        onClose={() => setPicking(null)}
      />
      <SelectSheet
        visible={picking === "urgency"}
        title="Priority"
        options={URGENCY_OPTIONS}
        value={filters.urgency ?? ""}
        onSelect={(v) => onChange({ urgency: v || undefined })}
        onClose={() => setPicking(null)}
      />
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, on && s.chipOn]} onPress={onPress} accessibilityState={{ selected: on }}>
      <Text style={[s.chipText, on && { color: COLORS.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SelectButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.select, on && s.selectOn]} onPress={onPress}>
      <Text style={[s.selectText, on && { color: COLORS.primary }]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={on ? COLORS.primary : COLORS.subText} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 14, alignItems: "flex-start" },
  stacked: { flexDirection: "column", paddingVertical: 8 },
  group: { gap: 6 },
  groupLabel: { fontSize: 11, fontWeight: "700", color: COLORS.subText, textTransform: "uppercase", letterSpacing: 0.4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: COLORS.white },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  range: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dateBox: { minWidth: 150 },
  muted: { fontSize: 12, color: COLORS.subText },
  off: { opacity: 0.4 },
  offNote: { alignSelf: "flex-end", paddingBottom: 8 },
  error: { fontSize: 12, color: COLORS.red },
  selects: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignSelf: "flex-end" },
  select: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, maxWidth: 220 },
  selectOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  selectText: { fontSize: 13, color: COLORS.text, flexShrink: 1 },
  cityBox: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, minWidth: 150 },
  cityInput: { flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 8, minWidth: 90 },
  done: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
