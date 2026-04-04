import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await adminAPI.getStatsAdminDashboard();
        
        // Note: If adminAPI uses Axios, you should use `response.data` instead of `response.json()`
        // If it uses native fetch, leave it as `await response.json()`
        const json = await response; 

        if (json.success) {
          const data = json.data;

          // 3. Map the API response to the StatCard prop structure
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

          setStats(mappedStats); // The red line should now be gone!
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Quick Actions Header ── */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsButtons}>
          <TouchableOpacity style={styles.createDutyButton}>
            <Text style={styles.createDutyIcon}>➕</Text>
            <Text style={styles.createDutyText}>Create Duty</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewMapButton}>
            <Text style={styles.viewMapIcon}>🗺️</Text>
            <Text style={styles.viewMapText}>View Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <Text style={styles.emergencyText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stat Cards ── */}
      <View style={[
        styles.statsGrid,
        isTablet ? styles.statsRowDesktop : styles.statsGridMobile,
      ]}>
        {/* 4. Show a loader or map over the new `stats` state */}
        {loading ? (
           
          <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          stats.map((s, i) => (
            <StatCard key={i} {...s} isTablet={isTablet} />
          ))
        )}
      </View>

      {/* ── Main Content ── */}
      {isTablet ? (
        // Desktop: side by side
        <View style={styles.mainRowDesktop}>
          <View style={{ flex: 2.2 }}>
            <RecentRequests isTablet={isTablet} />
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            <VerificationStatus />
            <PortalUsage />
          </View>
        </View>
      ) : (
        // Mobile: stacked
        <View style={styles.mainColMobile}>
          <RecentRequests isTablet={isTablet} />
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
    backgroundColor: '#F3F4F6' 
  },
  content: { 
    padding: 16 
  },

  // Quick Actions
  quickActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  quickActionsButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  createDutyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
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
  statsGrid: { 
    marginBottom: 16 
  },
  statsGridMobile: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  statsRowDesktop: { 
    flexDirection: 'row', 
    gap: 12 
  },

  // Layouts
  mainRowDesktop: { 
    flexDirection: 'row', 
    gap: 14, 
    alignItems: 'flex-start' 
  },
  mainColMobile: { 
    gap: 12 
  },
});