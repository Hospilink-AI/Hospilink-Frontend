import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/service/api';

// ─── TypeScript Interfaces ──────────────────────────────────────────────
interface SummaryData {
  totalActiveDuties: number | string;
  assignedCount: number | string;
  enrouteCount: number | string;
  inProgressCount: number | string;
}

interface Duty {
  dutyId: string;
  role: string;
  formattedRole: string;
  hospital: {
    name: string;
    location: string;
  };
  staff: {
    id?: string;
    name: string;
  } | null;
  timing: {
    urgency: string;
    startTime: string;
    endTime: string;
  };
  status: {
    status: string;
  };
  distance: {
    distanceText: string;
    estimatedTimeText: string;
  } | null;
  totalPayment: number | string;
}
// ───────────────────────────────────────────────────────────────────────

// Helper for Initials Avatar
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
};

const Avatar = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

export default function LiveMonitoring() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError]         = useState('');  

  const fetchActiveDuties = async () => {
  setError('');                                     // ← clear previous
  try {
    const response = await adminAPI.getActiveDuties();
    if (response.success) {
      setDuties(response.data);
      setSummary(response.summary);
    } else {
      setError(response.message ?? 'Failed to load active duties.');
    }
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to load active duties. Please try again.';
    setError(msg);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchActiveDuties();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActiveDuties, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveDuties();
  };

  // Mapped visual styles for the exact badges in the design
  const getStatusVisuals = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'in-progress') return { label: 'ON TIME', bg: '#DCFCE7', color: '#16A34A' };
    if (s === 'enroute') return { label: 'IN TRANSIT', bg: '#FEF3C7', color: '#D97706' };
    return { label: 'DELAYED', bg: '#FEE2E2', color: '#DC2626' }; // Default/Assigned
  };

  const handleShowOnMap = (dutyId: string) => {
    router.push(`/admin/live-request-monitoring?dutyId=${dutyId}`);
  };

  const renderDutyCard = (duty: Duty) => {
    const { dutyId, formattedRole, hospital, staff, status, distance } = duty;
    
    const visuals = getStatusVisuals(status.status);
    
    // Handle case where staff might be null (unassigned duty)
    const staffName = staff?.name || 'Unassigned';
    const staffInitials = staff ? getInitials(staff.name) : '??';
    const mockId = staff?.id 
      ? staff.id.substring(staff.id.length - 4).toUpperCase() 
      : dutyId.substring(dutyId.length - 4).toUpperCase();

    return (
      <View key={dutyId} style={[styles.card, isWide ? styles.cardWide : styles.cardMobile]}>
        
        {/* Top Header: Role & Badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.roleText} numberOfLines={1}>{formattedRole}</Text>
          <View style={[styles.statusBadge, { backgroundColor: visuals.bg }]}>
            <Text style={[styles.statusBadgeText, { color: visuals.color }]}>{visuals.label}</Text>
          </View>
        </View>

        {/* Hospital Name */}
        <Text style={styles.hospitalText} numberOfLines={1}>{hospital.name}</Text>

        {/* Staff Row */}
        <View style={styles.staffRow}>
          <Avatar initials={staffInitials} />
          <View style={styles.staffInfo}>
            <Text style={styles.staffNameText} numberOfLines={1}>{staffName}</Text>
            <Text style={styles.staffIdText}>ID: SP-{mockId}</Text>
          </View>
        </View>

        {/* Stats Row (Estimated Time | Distance) */}
        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{distance?.estimatedTimeText || '-- mins'}</Text>
            <Text style={styles.statLabel}>ESTIMATED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{distance?.distanceText || '-- km'}</Text>
            <Text style={styles.statLabel}>DISTANCE</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.mapBtn, !staff && styles.disabledBtn]} 
            activeOpacity={0.8}
            onPress={() => staff && handleShowOnMap(dutyId)}
            disabled={!staff}
          >
            <Text style={styles.mapBtnText}>Monitor Status</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.monitorBtn} activeOpacity={0.8}>
            <Text style={styles.monitorBtnText}>Monitor Status</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading active duties...</Text>
      </View>
    );
  }

  if (error) {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity
        style={styles.retryBtn}
        onPress={() => { setLoading(true); fetchActiveDuties(); }}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

  return (
    <View style={styles.container}>
      
      {/* ─── Top Header Section ─── */}
      <View style={styles.mainHeader}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
          <Text style={styles.pageSubtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={16} color="#fff" />
          <Text style={styles.exportBtnText}>Export Report</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Sub Header (Tracking Count) ─── */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
        <View style={styles.activeCountBadge}>
          <Text style={styles.activeCountText}>{summary?.totalActiveDuties || duties.length} ACTIVE</Text>
        </View>
      </View>

      {/* ─── Grid Area ─── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {duties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active duties at the moment</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {duties.map(renderDutyCard)}
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom Footer Bar ─── */}
      <View style={styles.bottomFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.footerStatusText}>
            Tracking data updates every 30 seconds. Current sync latency: 1.2ms
          </Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Text style={styles.filterBtnText}>Filter Viewer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8}>
            <Text style={styles.viewAllBtnText}>View All Personnel</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

// ─── StyleSheet ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Light grayish-blue background from design
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  // Add to StyleSheet.create({})
errorTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1E293B',
  marginTop: 16,
  marginBottom: 6,
},
errorMessage: {
  fontSize: 13,
  color: '#94A3B8',
  textAlign: 'center',
  marginBottom: 20,
  paddingHorizontal: 32,
  lineHeight: 20,
},
retryBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#2563EB',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 10,
},
retryBtnText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '700',
},

  // Header
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB', // Primary Blue
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  disabledBtn:{
    // color:'#FFFFFF'
  },

  // Sub Header
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  subHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  activeCountBadge: {
    backgroundColor: '#EFF6FF', // Light blue
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeCountText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
  },

  // Scroll Area & Grid
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  } as any,
  cardWide: {
    width: Platform.OS === 'web' ? 'calc(33.333% - 11px)' : '32%',
  } as any,
  cardMobile: {
    width: '100%',
  },

  // Card Content
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hospitalText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },

  // Staff Info
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#475569', // Dark slate placeholder for images
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  staffInfo: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  staffIdText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Stats Row
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mapBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  monitorBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monitorBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Bottom Footer
  bottomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F1F5F9', // Matches background, separated by border
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Green dot
  },
  footerStatusText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  filterBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  viewAllBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewAllBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
});