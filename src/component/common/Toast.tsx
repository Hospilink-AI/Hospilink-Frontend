import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  return (
    <View style={styles.toast}>
      <Ionicons name="checkmark-circle" size={18} color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  text: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});