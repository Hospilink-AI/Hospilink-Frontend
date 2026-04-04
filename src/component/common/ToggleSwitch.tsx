import { COLORS } from "@/constant/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export default function ToggleSwitch({ enabled, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={[styles.track, { backgroundColor: enabled ? COLORS.green : "#E5E7EB" }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.thumb, { alignSelf: enabled ? "flex-end" : "flex-start" }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 30,
    borderRadius: 20,
    padding: 3,
    justifyContent: "center",
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
