import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  mode: "date" | "time";
  value: Date | null;
  onChange: (value: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  error?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const displayValue = (mode: "date" | "time", d: Date) =>
  mode === "date"
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

const htmlValue = (mode: "date" | "time", d: Date | null) => {
  if (!d) return "";
  return mode === "date"
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Keeps the other half of the Date intact - picking a time must not reset the day.
const merge = (mode: "date" | "time", base: Date | null, picked: Date) => {
  const next = new Date(base ?? picked);
  if (mode === "date") next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
};

export default function DateTimeField({ mode, value, onChange, placeholder, minimumDate, error }: Props) {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());
  const icon = mode === "date" ? "calendar-outline" : "time-outline";
  const hint = placeholder ?? (mode === "date" ? "Select date" : "Select time");

  if (Platform.OS === "web") {
    return (
      <View>
        <View style={[styles.input, error && styles.inputError]}>
          {/* @ts-ignore */}
          <input
            type={mode}
            value={htmlValue(mode, value)}
            min={mode === "date" && minimumDate ? htmlValue("date", minimumDate) : undefined}
            step={mode === "time" ? 900 : undefined}
            onChange={(e: any) => {
              const raw: string = e.target.value;
              if (!raw) return;
              const picked = new Date(value ?? new Date());
              if (mode === "date") {
                const [y, m, d] = raw.split("-").map(Number);
                picked.setFullYear(y, m - 1, d);
              } else {
                const [h, min] = raw.split(":").map(Number);
                picked.setHours(h, min, 0, 0);
              }
              onChange(picked);
            }}
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 13,
              color: value ? COLORS.text : "#9CA3AF", background: "transparent",
              fontFamily: "inherit", minWidth: 0, width: "100%",
            }}
          />
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        activeOpacity={0.8}
        onPress={() => {
          setTemp(value ?? new Date());
          setShow(true);
        }}
      >
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value ? displayValue(mode, value) : hint}
        </Text>
        <Ionicons name={icon} size={16} color={COLORS.subText} />
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={temp}
          mode={mode}
          display={mode === "date" ? "calendar" : "clock"}
          minimumDate={minimumDate}
          minuteInterval={mode === "time" ? 15 : undefined}
          onChange={(_e: any, picked?: Date) => {
            setShow(false);
            if (picked) onChange(merge(mode, value, picked));
          }}
        />
      )}

      <Modal visible={show && Platform.OS === "ios"} transparent animationType="slide" onRequestClose={() => setShow(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{hint}</Text>
              <TouchableOpacity
                onPress={() => {
                  onChange(merge(mode, value, temp));
                  setShow(false);
                }}
              >
                <Text style={styles.done}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={temp}
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              minuteInterval={mode === "time" ? 15 : undefined}
              onChange={(_e: any, picked?: Date) => picked && setTemp(picked)}
              style={{ backgroundColor: "#fff" }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 42,
  },
  inputError: { borderColor: COLORS.red },
  valueText: { fontSize: 13, color: COLORS.text },
  placeholder: { color: "#9CA3AF" },
  errorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  cancel: { fontSize: 15, color: COLORS.subText },
  done: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
});
