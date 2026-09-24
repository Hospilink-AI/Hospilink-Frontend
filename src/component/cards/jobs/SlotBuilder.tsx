import DateTimeField from "@/component/common/DateTimeField";
import { COLORS } from "@/constant/colors";
import { INTERVIEW_DEFAULTS, Slot, SLOT_DURATIONS, formatSlot } from "@/constant/jobs";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface Props {
  slots: Slot[];
  duration: number;
  onChange: (slots: Slot[], duration: number) => void;
}

const { slotsPerOfferMin, slotsPerOfferMax, schedulingWindowMinHours, schedulingWindowMaxDays } =
  INTERVIEW_DEFAULTS;

export default function SlotBuilder({ slots, duration, onChange }: Props) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addSlot = () => {
    if (!date || !time) {
      setError("Pick a date and a start time.");
      return;
    }
    const start = new Date(date);
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);

    if (start.getMinutes() % 15 !== 0) {
      setError("Start times must be on the quarter hour (:00, :15, :30 or :45).");
      return;
    }
    const hoursAway = (start.getTime() - Date.now()) / 3600000;
    if (hoursAway < schedulingWindowMinHours || hoursAway > schedulingWindowMaxDays * 24) {
      setError(`Slots must start between ${schedulingWindowMinHours} hours and ${schedulingWindowMaxDays} days from now.`);
      return;
    }
    if (slots.length >= slotsPerOfferMax) {
      setError(`You can offer at most ${slotsPerOfferMax} slots.`);
      return;
    }

    const end = new Date(start.getTime() + duration * 60000);
    const overlaps = slots.some(
      (s) => start < new Date(s.end) && end > new Date(s.start)
    );
    if (overlaps) {
      setError("This slot overlaps one you already added.");
      return;
    }

    const next = [...slots, { start: start.toISOString(), end: end.toISOString() }].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    setError(null);
    setTime(null);
    onChange(next, duration);
  };

  // Every slot in an offer must share one duration, so changing it clears the list.
  const changeDuration = (value: number) => {
    if (value === duration) return;
    onChange([], value);
  };

  const minDate = new Date(Date.now() + schedulingWindowMinHours * 3600000);

  return (
    <View>
      <View style={[styles.row, isMobile && styles.rowMobile]}>
        <View style={styles.field}>
          <Text style={styles.label}>Interview Date</Text>
          <DateTimeField mode="date" value={date} onChange={setDate} minimumDate={minDate} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Slot Duration</Text>
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownText}
            data={SLOT_DURATIONS}
            labelField="label"
            valueField="value"
            value={String(duration)}
            onChange={(item) => changeDuration(Number(item.value))}
          />
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>
        Time Slots <Text style={styles.labelHint}>(min {slotsPerOfferMin}, max {slotsPerOfferMax} slots)</Text>
      </Text>
      <View style={[styles.row, isMobile && styles.rowMobile]}>
        <View style={styles.field}>
          <DateTimeField mode="time" value={time} onChange={setTime} placeholder="Start time" />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addSlot} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>Add Slot</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {slots.length > 0 && (
        <View style={styles.chips}>
          {slots.map((s) => (
            <View key={s.start} style={styles.chip}>
              <Text style={styles.chipText}>{formatSlot(s)}</Text>
              <TouchableOpacity
                onPress={() => onChange(slots.filter((x) => x.start !== s.start), duration)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={14} color={COLORS.subText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, alignItems: "flex-end" },
  rowMobile: { flexDirection: "column", alignItems: "stretch", gap: 10 },
  field: { flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  labelHint: { fontSize: 12, fontWeight: "400", color: COLORS.subText },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  dropdownText: { fontSize: 13, color: COLORS.text },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  addText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  error: { fontSize: 12, color: COLORS.red, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
});
