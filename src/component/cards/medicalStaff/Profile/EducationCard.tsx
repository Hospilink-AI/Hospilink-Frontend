import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EducationItem {
  _id?: string;
  universityName: string;
  speciality: string;
  startYear: number;
  endYear: number;
}

interface Props {
  items: EducationItem[];
  onAdd: () => void;
}

export default function EducationCard({ items, onAdd }: Props) {
  // Map API format to display format
  const displayItems = items.map((item) => ({
    id: item._id || Math.random().toString(),
    school: item.universityName,
    degree: item.speciality,
    years: `${item.startYear} - ${item.endYear}`,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Education</Text>
        <TouchableOpacity onPress={onAdd}>
          <Text style={styles.addLink}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {displayItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={32} color={COLORS.border} />
          <Text style={styles.emptyText}>No education added yet</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {displayItems.map((item, i) => (
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
              {i < displayItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 12,
  },
});