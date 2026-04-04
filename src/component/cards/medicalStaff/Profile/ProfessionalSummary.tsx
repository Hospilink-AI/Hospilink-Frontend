import { COLORS } from "@/constant/colors";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  summary: string;
  onEdit: () => void;
}

export default function ProfessionalSummary({ summary, onEdit }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Professional Summary</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.editLink}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.body}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title:    { fontSize: 16, fontWeight: "700", color: COLORS.text },
  editLink: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  body:     { fontSize: 14, color: "#475569", lineHeight: 22 },
});