import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import StatCard from '@/component/cards/admin/Dashboard/StatCard';
import RecentRequests from '@/component/cards/admin/Dashboard/RecentRequest';
import VerificationStatus from '@/component/cards/admin/Dashboard/VerificationStatus';
import PortalUsage from '@/component/cards/admin/Dashboard/PortalUsage';
import { adminAPI } from '@/service/api';

// 1. Define the TypeScript Interface for your stats
interface StatData {
  icon: string;
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  badgeType: 'percent' | 'number' | 'tag';
}


export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // 2. Tell TypeScript that this state holds an array of StatData objects
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const router = useRouter();

// AFTER — define outside, call inside useEffect
const fetchDashboardStats = React.useCallback(async () => {
  setLoading(true);
  setStatsError('');
  try {
    const response = await adminAPI.getStatsAdminDashboard();
    const json = await response;

    if (json.success) {
      const data = json.data;
      const mappedStats: StatData[] = [
        {
          icon: '🏥',
          label: 'Total Hospitals',
          value: data.totalHospitals.count.toString(),
          badge: data.totalHospitals.changeLabel,
          badgeColor: data.totalHospitals.trend === 'up' ? '#22C55E' : '#EF4444',
          badgeType: 'percent'
        },
        {
          icon: '👨‍⚕️',
          label: 'Medical Staff',
          value: data.medicalStaff.count.toString(),
          badge: data.medicalStaff.changeLabel,
          badgeColor: data.medicalStaff.trend === 'up' ? '#22C55E' : '#EF4444',
          badgeType: 'percent'
        },
        {
          icon: '📋',
          label: 'Pending Verifications',
          value: data.pendingVerifications.count.toString(),
          badge: data.pendingVerifications.status.charAt(0).toUpperCase() + data.pendingVerifications.status.slice(1),
          badgeColor: '#EF4444',
          badgeType: 'tag'
        },
        {
          icon: '📌',
          label: 'Active Duties',
          value: data.activeDuties.count.toString(),
          badge: data.activeDuties.status.charAt(0).toUpperCase() + data.activeDuties.status.slice(1),
          badgeColor: '#3B82F6',
          badgeType: 'tag'
        },
      ];
      setStats(mappedStats);
    } else {
      setStatsError(json.message ?? 'Failed to load dashboard stats.');
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to load dashboard stats. Please try again.';
    setStatsError(msg);
  } finally {
    setLoading(false);
  }
}, []);

// Now useEffect just calls it
useEffect(() => {
  fetchDashboardStats();
}, [fetchDashboardStats]);

  // Visual replica of the Alerts section from the image
  const renderAlertsSection = () => (
    <View style={styles.alertsContainer}>
      <View style={styles.alertsHeader}>
        <Text style={styles.alertsTitle}>Alerts</Text>
        <View style={styles.alertsBadge}>
          <Text style={styles.alertsBadgeText}>2 New</Text>
        </View>
      </View>

      <View style={[styles.alertCard, styles.alertRed]}>
        <Text style={styles.alertCardTitle}>
          <Text style={{ color: '#EF4444' }}>🔕</Text> Code Blue Drill - 15:00
        </Text>
        <Text style={styles.alertCardDesc}>Simulated emergency drill in Wing B. Staff participation required.</Text>
        <Text style={styles.alertCardTime}>10 mins ago</Text>
      </View>

      <View style={[styles.alertCard, styles.alertYellow]}>
        <Text style={styles.alertCardTitle}>
          <Text style={{ color: '#F59E0B' }}>⚠️</Text> System Maintenance
        </Text>
        <Text style={styles.alertCardDesc}>EMR system will undergo brief downtime at 02:00 AM</Text>
        <Text style={styles.alertCardTime}>1 hour ago</Text>
      </View>

      <View style={[styles.alertCard, styles.alertBlue]}>
        <Text style={styles.alertCardTitle}>
          <Text style={{ color: '#3B82F6' }}>ℹ️</Text> New Policy Update
        </Text>
        <Text style={styles.alertCardDesc}>Please review the updated visitor guidelines effectively immediately.</Text>
        <Text style={styles.alertCardTime}>Yesterday</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Main Content (Two Columns Layout) ── */}
      {isTablet ? (
        // Desktop: side by side layout
        <View style={styles.mainRowDesktop}>

          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            {/* Quick Actions Header */}
            <View style={[styles.quickActionsContainer, styles.quickActionsDesktop]}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsButtons}>
                <TouchableOpacity
                  style={styles.createDutyButton}
                  onPress={() => router.push('/admin/create-duty')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createDutyIcon}>➕</Text>
                  <Text style={styles.createDutyText}>Create Duty</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewMapButton}
                  onPress={() => router.push('/admin/live-tracking')}
                >
                  <Text style={styles.viewMapIcon}>🗺️</Text>
                  <Text style={styles.viewMapText}>View Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emergencyButton}
                  onPress={() => router.push("/admin/emergency")}
                >
                  <Text style={styles.emergencyIcon}>🚨</Text>
                  <Text style={styles.emergencyText}>Emergency</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stat Cards */}
            <View style={styles.statsRowDesktop}>
              {/* Stats — loading / error / data */}
              {loading ? (
                <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : statsError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>⚠️ {statsError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardStats}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : stats.length === 0 ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>No stats available right now.</Text>
                </View>
              ) : (
                stats.map((s, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <StatCard {...s} isTablet={isTablet} />
                  </View>
                ))
              )}
            </View>

            {/* Existing Left Column Components */}
            <RecentRequests isTablet={isTablet} />
            {renderAlertsSection()}
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>
            {/* Removed top spacing here so it aligns with the Quick Actions container on the left */}
            <VerificationStatus />
            <PortalUsage />
          </View>
        </View>
      ) : (
        // Mobile: stacked layout
        <View style={styles.mainColMobile}>
          {/* Quick Actions Header */}
          <View style={[styles.quickActionsContainer, styles.quickActionsMobile]}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsButtonsMobile}>
              <TouchableOpacity style={styles.createDutyButton} onPress={() => router.push('/admin/create-duty')}>
                <Text style={styles.createDutyIcon}>➕</Text>
                <Text style={styles.createDutyText}>Create Duty</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewMapButton}>
                <Text style={styles.viewMapIcon}>🗺️</Text>
                <Text style={styles.viewMapText}>Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emergencyButton}>
                <Text style={styles.emergencyIcon}>🚨</Text>
                <Text style={styles.emergencyText}>SOS</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stat Cards */}
          <View style={styles.statsGridMobile}>
            {loading ? (
              <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : statsError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>⚠️ {statsError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardStats}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : stats.length === 0 ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>No stats available right now.</Text>
              </View>
            ) : (
              stats.map((s, i) => (
                <View key={i} style={{ width: '48%' }}>
                  <StatCard {...s} isTablet={isTablet} />
                </View>
              ))
            )}
          </View>

          {/* Existing Components */}
          <RecentRequests isTablet={isTablet} />
          {renderAlertsSection()}
          <VerificationStatus />
          <PortalUsage />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F5F9'
  },
  content: {
    padding: 24
  },

  // Layouts (Two Columns)
  mainRowDesktop: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start'
  },
  leftColumn: {
    flex: 2.3,
    gap: 20,
  },
  rightColumn: {
    flex: 1,
    gap: 20,
    // Removed marginTop: 48 here so the top of the right column aligns with the left column
  },
  mainColMobile: {
    gap: 16
  },

  // Add to your StyleSheet.create({})
errorBox: {
  width: '100%',
  backgroundColor: '#FEF2F2',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#FECACA',
  padding: 16,
  alignItems: 'center',
  gap: 10,
},
errorBoxText: {
  fontSize: 13,
  color: '#DC2626',
  textAlign: 'center',
  lineHeight: 18,
},
retryBtn: {
  backgroundColor: '#DC2626',
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 8,
},
retryBtnText: {
  fontSize: 13,
  color: '#fff',
  fontWeight: '700',
},

  // Quick Actions Container (Added white background, border radius, and padding)
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionsDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  quickActionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionsButtonsMobile: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },

  // Refined Buttons
  createDutyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  createDutyIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  createDutyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  viewMapIcon: {
    fontSize: 14,
  },
  viewMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  emergencyIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Stat grids
  statsRowDesktop: {
    flexDirection: 'row',
    gap: 16
  },
  statsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },

  // Alerts Section Styles
  alertsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  alertsBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertCard: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertRed: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  alertYellow: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#F59E0B',
  },
  alertBlue: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  alertCardDesc: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 18,
  },
  alertCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
  }
});