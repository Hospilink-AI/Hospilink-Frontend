import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { adminAPI } from '@/service/api'; 

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}

function CircularProgress({ percentage, size = 50, strokeWidth = 4, color }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  percentage = Math.round(percentage || 0)

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.percentageContainer}>
        <Text style={[styles.percentageText, { color }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

interface StaffItem {
  percentage: number;
  label: string;
  subtitle: string;
  color: string;
}

interface VerificationItem {
  percentage: number;
  label: string;
  count: string;
  color: string;
}

// Helper to format roles
const formatRoleLabel = (role: string) => {
  const acronyms: Record<string, string> = {
    dmo: 'DMO',
    rmo: 'RMO',
    cmo: 'CMO',
  };

  if (acronyms[role.toLowerCase()]) {
    return acronyms[role.toLowerCase()];
  }

  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Static data for Verification until that API is ready
const VERIFICATION_DATA: VerificationItem[] = [
  { percentage: 58, label: 'Emergency', count: '742', color: '#3B82F6' },
  { percentage: 57, label: 'Pending', count: '82', color: '#22C55E' },
  { percentage: 2, label: 'Rejected', count: '18', color: '#F59E0B' },
];

export default function VerificationStatus() {
  const [staffData, setStaffData] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New state to toggle expanding the staff list
  const [showAllStaff, setShowAllStaff] = useState(false);

  const CHART_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        const json = await adminAPI.getStaffStatsDashboard();

        if (json.success && json.data) {
          const mappedStaff = json.data.byRole.map((role: any, index: number) => ({
            percentage: role.availabilityPercentage,
            label: formatRoleLabel(role.jobRole),
            subtitle: `${role.availableStaff}/${role.totalStaff} Available`,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }));

          setStaffData(mappedStaff);
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffStats();
  }, []);

  // Determine which staff items to show based on the toggle state
  // Shows 3 items by default, or all items if showAllStaff is true
  const displayedStaff = showAllStaff ? staffData : staffData.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* ── Staff Availability Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Staff Availability</Text>
          <TouchableOpacity>
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.staffList}>
          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : staffData.length > 0 ? (
            // Map over the limited/expanded array instead of the full array
            displayedStaff.map((item, index) => (
              <View key={index} style={styles.staffItem}>
                <CircularProgress
                  percentage={item.percentage}
                  color={item.color}
                  size={50}
                  strokeWidth={4}
                />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffLabel}>{item.label}</Text>
                  <Text style={styles.staffSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: '#6B7280', paddingVertical: 10 }}>
              No staff data available.
            </Text>
          )}
        </View>

        {/* View More / View Less Toggle Button (Only shows if there are more than 3 items) */}
        {!loading && staffData.length > 3 && (
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => setShowAllStaff(!showAllStaff)}
          >
            <Text style={styles.reportText}>
              {showAllStaff ? 'View Less' : `View All (${staffData.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Verification Status Section ── */}
      <View style={[styles.section, { marginTop: 16 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <TouchableOpacity>
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verificationList}>
          {VERIFICATION_DATA.map((item, index) => (
            <View key={index} style={styles.verificationItem}>
              <CircularProgress
                percentage={item.percentage}
                color={item.color}
                size={50}
                strokeWidth={4}
              />
              <View style={styles.verificationInfo}>
                <Text style={styles.verificationLabel}>{item.label}</Text>
                <Text style={styles.verificationCount}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportText}>View Detailed Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  moreIcon: { fontSize: 20, color: '#9CA3AF', fontWeight: '700' },
  staffList: { gap: 14, marginBottom: 16 },
  staffItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffInfo: { flex: 1 },
  staffLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  staffSubtitle: { fontSize: 12, color: '#6B7280' },
  verificationList: { gap: 14, marginBottom: 16 },
  verificationItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verificationInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verificationLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  verificationCount: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  reportButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  reportText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: { fontSize: 12, fontWeight: '700' },
});