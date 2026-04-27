
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, LayoutAnimation, Platform, UIManager } from "react-native";

// Enable LayoutAnimation for smooth transitions on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 50;

export interface QuickFilterValues {
  role: string;
  location: string;
  distance: number;
  minSal: string;
  maxSal: string;
  fullTime: boolean;
  contract: boolean;
}

interface FilterState extends QuickFilterValues {
  filterMode: 'distance' | 'location'; // Track which mode is active
}

const DEFAULT_FILTERS: FilterState = {
  role: "", location: "", distance: 25,
  minSal: "", maxSal: "", fullTime: true, contract: false,
  filterMode: 'distance'
};

interface Props {
  onApply: (filters: QuickFilterValues) => void;
}

export default function QuickFilters({ onApply }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const set = (key: keyof FilterState, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const toggleMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newMode = filters.filterMode === 'distance' ? 'location' : 'distance';
    // When switching, clear the other value so they don't conflict
    setFilters(prev => ({
      ...prev,
      filterMode: newMode,
      location: newMode === 'distance' ? "" : prev.location,
      distance: newMode === 'location' ? 0 : 25, 
    }));
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApply(filters);
  };

  const distancePct = ((filters.distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;
  const decreaseDistance = () => set("distance", Math.max(MIN_DISTANCE, filters.distance - 5));
  const increaseDistance = () => set("distance", Math.min(MAX_DISTANCE, filters.distance + 5));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{"Quick Filters"}</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.reset}>{"RESET"}</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter - Always Visible */}
      <View style={styles.searchGroup}>
        <Text style={styles.searchLabel}>{"Filter by Role"}</Text>
        <View style={[styles.searchInputBox, filters.role.length > 0 && styles.searchInputBoxActive]}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Lab Technician"
            placeholderTextColor={COLORS.subText}
            value={filters.role}
            onChangeText={(v) => set("role", v)}
          />
        </View>
      </View>

      {/* Toggle Header for Location vs Distance */}
      <View style={styles.modeToggleHeader}>
        <Text style={styles.label}>
          {filters.filterMode === 'distance' ? "MAX DISTANCE (KM)" : "FILTER BY LOCATION"}
        </Text>
        <TouchableOpacity onPress={toggleMode} style={styles.switchModeBtn}>
          <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} />
          <Text style={styles.switchModeText}>
            {filters.filterMode === 'distance' ? "Use Location" : "Use Distance"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering: Distance Slider OR Location Input */}
      {filters.filterMode === 'distance' ? (
        <View>
          <View style={styles.sliderRow}>
            <TouchableOpacity style={styles.sliderBtn} onPress={decreaseDistance}>
              <Ionicons name="remove" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: (distancePct + "%") as any }]} />
              <View style={[styles.sliderThumb, { left: (Math.max(distancePct - 3, 0) + "%") as any }]} />
            </View>
            <TouchableOpacity style={styles.sliderBtn} onPress={increaseDistance}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{MIN_DISTANCE + " km"}</Text>
            <Text style={[styles.sliderLabel, styles.sliderCurrent]}>{filters.distance + " km"}</Text>
            <Text style={styles.sliderLabel}>{MAX_DISTANCE + " km"}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.searchInputBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Pune, Maharashtra"
            placeholderTextColor={COLORS.subText}
            value={filters.location}
            onChangeText={(v) => set("location", v)}
          />
          <Ionicons name="location-outline" size={16} color={COLORS.subText} />
        </View>
      )}

      {/* Salary Section */}
      <Text style={[styles.label, { marginTop: 18 }]}>{"SALARY RANGE (YEARLY)"}</Text>
      <View style={styles.salaryRow}>
        <View style={styles.salaryInputWrap}>
          <Text style={styles.currencySign}>{"₹"}</Text>
          <TextInput
            style={styles.salaryInput}
            placeholder="Min"
            placeholderTextColor={COLORS.subText}
            value={filters.minSal}
            onChangeText={(v) => set("minSal", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.salarySep}>{"\u2014"}</Text>
        <View style={styles.salaryInputWrap}>
          <Text style={styles.currencySign}>{"₹"}</Text>
          <TextInput
            style={styles.salaryInput}
            placeholder="Max"
            placeholderTextColor={COLORS.subText}
            value={filters.maxSal}
            onChangeText={(v) => set("maxSal", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Contract Section */}
      <Text style={[styles.label, { marginTop: 18 }]}>{"CONTRACT TYPE"}</Text>
      <CheckItem label="Full-time" checked={filters.fullTime} onToggle={() => set("fullTime", !filters.fullTime)} />
      <CheckItem label="Contract / Locum" checked={filters.contract} onToggle={() => set("contract", !filters.contract)} />

      {/* Apply Action */}
      <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85} onPress={handleApply}>
        <Ionicons name="options-outline" size={15} color="#fff" />
        <Text style={styles.applyText}>{"Apply Filters"}</Text>
      </TouchableOpacity>
    </View>
  );
}

// CheckItem remains the same...
function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:  { fontSize: 16, fontWeight: "700", color: COLORS.text },
  reset:  { fontSize: 12, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.5 },
  searchGroup:  {},
  searchLabel:  { fontSize: 12, fontWeight: "600", color: COLORS.subText, marginBottom: 6 },
  modeToggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  switchModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switchModeText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  searchInputBox: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, backgroundColor: "#FAFAFA", height: 42,
  },
  searchInputBoxActive: { borderColor: COLORS.primary, backgroundColor: "#EEF8FA" },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 0 } as any,
  label:     { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.8 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  sliderTrack: { flex: 1, height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, position: "relative", justifyContent: "center" },
  sliderFill:  { position: "absolute", left: 0, height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  sliderThumb: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, elevation: 3 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabel:  { fontSize: 11, color: COLORS.subText },
  sliderCurrent:{ color: COLORS.primary, fontWeight: "700" },
  salaryRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  salarySep:    { color: COLORS.subText, fontSize: 14, fontWeight: "600" },
  salaryInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, backgroundColor: "#FAFAFA", height: 42 },
  currencySign: { fontSize: 13, color: COLORS.subText, marginRight: 4 },
  salaryInput:  { flex: 1, fontSize: 14, color: COLORS.text },
  checkRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  checkbox:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  checkboxActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel:   { fontSize: 14, color: COLORS.text },
  applyBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  applyText:    { color: "#fff", fontWeight: "700", fontSize: 14 },
});