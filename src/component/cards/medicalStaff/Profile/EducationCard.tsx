import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  years: string;
}

interface Props {
  items: EducationItem[];
  onAdd: () => void;
}

export default function EducationCard({ items, onAdd }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Education</Text>
        <TouchableOpacity onPress={onAdd}>
          <Text style={styles.addLink}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={item.id}>
            <View style={styles.item}>
              <View style={styles.iconWrap}>
                <Ionicons name="school-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.school}>{item.school}</Text>
                <Text style={styles.degree}>{item.degree} • {item.years}</Text>
              </View>
            </View>
            {i < items.length - 1 && <View style={styles.divider} />}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title:   { fontSize: 16, fontWeight: "700", color: COLORS.text },
  addLink: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  list:    { gap: 0 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  school: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  degree: { fontSize: 13, color: COLORS.subText, marginTop: 3 },
  divider: { height: 1, backgroundColor: COLORS.border },
});