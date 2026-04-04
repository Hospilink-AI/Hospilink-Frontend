import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { DutyCard, DutyStatus, UrgencyLevel } from "../../../types/duty";

// ─── Status badge config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DutyStatus, { bg: string; text: string; icon: string }> = {
  ACCEPTED: { bg: "#16A34A", text: "#fff", icon: "checkmark-circle" },
  PENDING: { bg: "#F59E0B", text: "#fff", icon: "time" },
  COMPLETED: { bg: "#6366F1", text: "#fff", icon: "checkmark-done-circle" },
  ENROUTE: { bg: "#2563EB", text: "#fff", icon: "navigate" },
};

// ─── Urgency badge config ────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<UrgencyLevel, { color: string }> = {
  LOW: { color: "#64748B" },
  MEDIUM: { color: "#F59E0B" },
  HIGH: { color: "#DC2626" },
};

// ─── Duty Card Component ─────────────────────────────────────────────────────
function DutyCardItem({ duty }: { duty: DutyCard }) {
  const router = useRouter();
  const status = STATUS_CONFIG[duty.status];
  const urgency = URGENCY_CONFIG[duty.urgency];

  const handleMapPress = () => {
    router.push({
      pathname: "/medicalStaff/duties/[id]/map" as any,
      params: {
        id: duty.id,
        hospitalName: duty.hospitalName,
      },
    });
  };

  const handleEnroute = () => {
    // TODO: Call mark-as-enroute API
    console.log("Mark as enroute:", duty.id);
  };

  return (
    <View style={styles.card}>
      {/* ── Row 1: Role + Status + Urgency ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.roleText}>{duty.staffRole}</Text>
        <View style={styles.badgeRow}>
          {/* ACCEPTED badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons
              name={status.icon as any}
              size={12}
              color={status.text}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: status.text }]}>
              {duty.status}
            </Text>
          </View>
          {/* Urgency label */}
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {duty.urgency}
          </Text>
        </View>
      </View>

      {/* ── Row 2: Doctor name ── */}
      <Text style={styles.doctorName}>{duty.doctorName}</Text>

      {/* ── Row 3: Distance + Time ── */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="navigate-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{duty.distance}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>
            {duty.startTime} - {duty.endTime}
          </Text>
        </View>
      </View>

      {/* ── Row 4: Rate + Date ── */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <MaterialIcons name="credit-card" size={14} color="#64748B" />
          <Text style={[styles.infoText, styles.rateText]}>{duty.rate}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{duty.date}</Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action Buttons ── */}
      <View style={styles.buttonRow}>
        {/* Map button */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={handleMapPress}
          activeOpacity={0.7}
        >
          <Feather name="map" size={16} color="#374151" />
          <Text style={styles.mapButtonText}>Map</Text>
        </TouchableOpacity>

        {/* Mark as Enroute button */}
        <TouchableOpacity
          style={styles.enrouteButton}
          onPress={handleEnroute}
          activeOpacity={0.85}
        >
          <Ionicons
            name="play"
            size={14}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.enrouteButtonText}>Mark as Enroute</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Available Duties Screen ─────────────────────────────────────────────────
export default function AvailableDutiesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Available Duties</Text>
      </View>

      {/* Duty list
      <FlatList
        data={MOCK_DUTIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DutyCardItem duty={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No duties available</Text>
          </View>
        }
      /> */}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  // Header
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#F1F5F9",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Card header row
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Doctor name
  doctorName: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
    fontWeight: "400",
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 32,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  rateText: {
    fontWeight: "700",
    color: "#0F172A",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  enrouteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enrouteButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
  },
});
