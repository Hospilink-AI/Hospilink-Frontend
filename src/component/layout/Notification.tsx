import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constant/colors";

interface NotificationPopupProps {
  isVisible: boolean;
  role: string;
  onClose: () => void;
}

export default function NotificationPopup({ isVisible, role, onClose }: NotificationPopupProps) {
  if (!isVisible) return null;

  // Mock data - eventually fetch this from your API based on the 'role' prop
  const notifications = [
    { id: 1, type: "HIGH", title: "New Duty Offer", desc: "New duty available near you - Nurse at Ruby Hospital...", time: "2m ago", icon: "notifications-outline", color: "#ef4444", bg: "#fee2e2" },
    { id: 2, type: "WARNING", title: "Document Expiring", desc: "Your Nursing License expires in 30 days. Upload renewed...", time: "14m ago", icon: "warning-outline", color: "#f59e0b", bg: "#fef3c7" },
    { id: 3, type: "LOW", title: "Duty Completed", desc: "Duty #1024 at General Ward has been completed.", time: "1h ago", icon: "checkmark-circle-outline", color: "#64748b", bg: "#f1f5f9" },
  ];

  return (
    <View style={styles.overlayContainer}>
      {/* Invisible backdrop to close popup when clicking outside */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      
      <View style={styles.popupBox}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity>
            <Text style={styles.markReadText}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* List */}
        <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
          {notifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              {/* Icon */}
              <View style={styles.iconCol}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>

              {/* Content */}
              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <View style={[styles.badge, { backgroundColor: item.bg }]}>
                    <Text style={[styles.badgeText, { color: item.color }]}>{item.type}</Text>
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <TouchableOpacity style={styles.footerRow}>
          <Text style={styles.footerText}>View all notifications</Text>
          <Ionicons name="arrow-forward" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 64, // Just below your 64px header
    right: 20,
    width: 340,
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    // Background color is transparent, it just catches clicks to close the popup
  },
  popupBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxHeight: 450,
    ...Platform.select({
      web: { boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
    }),
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  markReadText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
  listArea: { paddingHorizontal: 16 },
  notificationItem: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  iconCol: { marginRight: 12, paddingTop: 2 },
  contentCol: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  timeText: { fontSize: 11, color: "#94a3b8" },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  itemDesc: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#f1f5f9", gap: 6 },
  footerText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
});