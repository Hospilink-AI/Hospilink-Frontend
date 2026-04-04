import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EarningsRow {
  date: string;
  hospital: string;
  role: string;
  amount: string;
}

interface Props {
  data: EarningsRow[];
  isMobile?: boolean;
}

export default function EarningsTable({ data, isMobile }: Props) {
  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headerCell, { flex: 1.2 }]}>DUTY DATE</Text>
        {!isMobile && (
          <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>HOSPITAL</Text>
        )}
        <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>ROLE</Text>
        <Text style={[styles.cell, styles.headerCell, styles.rightCell]}>NET AMOUNT</Text>
      </View>

      {/* Rows */}
      {data.map((row, i) => (
        <View key={i} style={[styles.row, i % 2 !== 0 && styles.altRow]}>
          <Text style={[styles.cell, { flex: 1.2 }]}>{row.date}</Text>
          {!isMobile && (
            <Text style={[styles.cell, styles.boldCell, { flex: 2 }]}>{row.hospital}</Text>
          )}
          <Text style={[styles.cell, { flex: 1.5 }]}>{row.role}</Text>
          <Text style={[styles.cell, styles.amountCell]}>{row.amount}</Text>
        </View>
      ))}

      {/* Footer */}
      <TouchableOpacity style={styles.footer}>
        <Text style={styles.footerText}>View All Transactions</Text>
        <Ionicons name="open-outline" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { backgroundColor: "#F8FAFC" },
  altRow:    { backgroundColor: "#FAFAFA" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cell:       { fontSize: 13, color: "#475569", flex: 1 },
  headerCell: { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.5 },
  boldCell:   { fontWeight: "600", color: COLORS.text },
  rightCell:  { flex: 1, textAlign: "right" },
  amountCell: { flex: 1, textAlign: "right", color: "#16A34A", fontWeight: "700", fontSize: 13 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    padding: 16,
  },
  footerText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
});