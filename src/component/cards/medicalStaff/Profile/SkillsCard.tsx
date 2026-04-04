import { COLORS } from "@/constant/colors";
import { StyleSheet, Text, View } from "react-native";

interface Props { skills: string[]; }

export default function SkillsCard({ skills }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Skills</Text>
      <View style={styles.tags}>
        {skills.map((skill) => (
          <View key={skill} style={styles.tag}>
            <Text style={styles.tagText}>{skill}</Text>
          </View>
        ))}
      </View>
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
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 14 },
  tags:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
});