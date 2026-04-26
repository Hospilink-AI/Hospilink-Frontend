// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   useWindowDimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // --- Mock Data ---
// const TRACKING_DATA = [
//   { id: '1', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya' },
//   { id: '2', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya2' },
//   { id: '3', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya3' },
//   { id: '4', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh' },
//   { id: '5', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh2' },
//   { id: '6', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh3' },
//   { id: '7', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali' },
//   { id: '8', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali2' },
//   { id: '9', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali3' },
// ];

// // --- Card Component ---
// const TrackingCard = ({ data, cardWidth }: { data: typeof TRACKING_DATA[0], cardWidth: any }) => {
//   let badgeBg = '#ECFDF5';
//   let badgeText = '#10B981';
//   if (data.status === 'DELAYED') {
//     badgeBg = '#FEF2F2';
//     badgeText = '#EF4444';
//   } else if (data.status === 'IN TRANSIT') {
//     badgeBg = '#FFFBEB';
//     badgeText = '#F59E0B';
//   }

//   return (
//     <View style={[styles.card, { width: cardWidth }]}>
//       <View style={styles.cardHeader}>
//         <View>
//           <Text style={styles.roleText}>{data.role}</Text>
//           <Text style={styles.hospitalText}>{data.hospital}</Text>
//         </View>
//         <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
//           <Text style={[styles.statusText, { color: badgeText }]}>{data.status}</Text>
//         </View>
//       </View>

//       <View style={styles.profileRow}>
//         <Image source={{ uri: data.avatar }} style={styles.avatar} />
//         <View>
//           <Text style={styles.nameText}>{data.name}</Text>
//           <Text style={styles.idText}>ID: {data.staffId}</Text>
//         </View>
//       </View>

//       <View style={styles.statsRow}>
//         <View style={styles.statBox}>
//           <Text style={styles.statValue}>{data.time}</Text>
//           <Text style={styles.statLabel}>ESTIMATED</Text>
//         </View>
//         <View style={styles.statDivider} />
//         <View style={styles.statBox}>
//           <Text style={styles.statValue}>{data.distance}</Text>
//           <Text style={styles.statLabel}>DISTANCE</Text>
//         </View>
//       </View>

//       <View style={styles.actionsRow}>
//         <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
//           <Text style={styles.primaryBtnText}>Show on Map</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
//           <Text style={styles.secondaryBtnText}>Monitor Status</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // --- Main Screen ---
// export default function LiveTrackingScreen() {
//   const { width: screenWidth } = useWindowDimensions();
//   const [containerWidth, setContainerWidth] = useState(0); // Stores actual usable width
  
//   // Decide columns based on overall screen size
//   const isDesktop = screenWidth >= 1024;
//   const isTablet = screenWidth >= 768 && screenWidth < 1024;
  
//   let columns = 1;
//   if (isDesktop) columns = 3;
//   else if (isTablet) columns = 2;

//   const gap = 20;
  
//   // Wait until we have the container width, otherwise default to screenWidth minus padding
//   const activeWidth = containerWidth > 0 ? containerWidth : (screenWidth - 48);
  
//   // Precise calculation to fit cards in exactly 3 columns based on the REAL container size
//   const cardWidth = columns === 1 ? '100%' : (activeWidth - (gap * (columns - 1))) / columns;

//   return (
//     <View style={styles.screen}>
//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
//         {/* --- Header --- */}
//         <View style={styles.headerContainer}>
//           <View>
//             <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
//             <Text style={styles.pageSubtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
//           </View>
//           <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
//             <Ionicons name="download-outline" size={16} color="#fff" />
//             <Text style={styles.exportBtnText}>Export Report</Text>
//           </TouchableOpacity>
//         </View>

//         {/* --- Sub-header --- */}
//         <View style={styles.subHeaderContainer}>
//           <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
//           <View style={styles.activeBadge}>
//             <Text style={styles.activeBadgeText}>24 ACTIVE</Text>
//           </View>
//         </View>

//         {/* --- Grid Layout using onLayout to find exact width --- */}
//         <View 
//           style={[styles.grid, { gap }]} 
//           onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
//         >
//           {TRACKING_DATA.map((item, index) => (
//             <TrackingCard key={index} data={item} cardWidth={cardWidth} />
//           ))}
//         </View>

//         {/* --- Footer --- */}
//         <View style={styles.footer}>
//           <View style={styles.footerLeft}>
//             <View style={styles.syncDot} />
//             <Text style={styles.footerText}>
//               Tracking data updates every 30 seconds. Current sync latency: 1.2ms
//             </Text>
//           </View>
//           <View style={styles.footerRight}>
//             <TouchableOpacity style={styles.footerBtnLight} activeOpacity={0.7}>
//               <Text style={styles.footerBtnLightText}>Filter Viewer</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.footerBtnBlue} activeOpacity={0.7}>
//               <Text style={styles.footerBtnBlueText}>View All Personnel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//       </ScrollView>
//     </View>
//   );
// }

// // --- Styles remain exactly the same ---
// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: '#F4F7FB' },
//   scrollContent: { padding: 24, paddingBottom: 40 },
//   headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
//   pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
//   pageSubtitle: { fontSize: 14, color: '#9CA3AF' },
//   exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
//   exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
//   subHeaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
//   subHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
//   activeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
//   activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
//   grid: { flexDirection: 'row', flexWrap: 'wrap' },
//   card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
//   cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
//   roleText: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
//   hospitalText: { fontSize: 12, color: '#6B7280' },
//   statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
//   statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
//   profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
//   avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' },
//   nameText: { fontSize: 14, fontWeight: '600', color: '#111827' },
//   idText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
//   statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
//   statBox: { flex: 1, alignItems: 'center' },
//   statValue: { fontSize: 16, fontWeight: '700', color: '#374151' },
//   statLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginTop: 4 },
//   statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
//   actionsRow: { flexDirection: 'row', gap: 12 },
//   primaryBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
//   secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   secondaryBtnText: { color: '#4B5563', fontSize: 13, fontWeight: '600' },
//   footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
//   footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
//   footerText: { fontSize: 12, color: '#9CA3AF' },
//   footerRight: { flexDirection: 'row', gap: 12 },
//   footerBtnLight: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
//   footerBtnLightText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
//   footerBtnBlue: { backgroundColor: '#DBEAFE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
//   footerBtnBlueText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
// });



import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { dutyAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActiveDuty {
  dutyId: string;
  role: string;
  formattedRole: string;
  hospital: {
    id: string;
    name: string;
    location: string;
    coordinates: {
      coordinates: { latitude: number; longitude: number };
    };
  };
  staff: {
    id: string;
    name: string;
    userName: string;
    coordinates: {
      coordinates: { latitude: number; longitude: number };
    };
  };
  timing: {
    date: string;
    startTime: string;
    endTime: string;
    urgency: string;
    assignedAt: string;
    enrouteAt?: string;
    startedAt?: string;
  };
  status: { status: string };
  distance: {
    distance: number;
    distanceText: string;
    estimatedTime: number;
    estimatedTimeText: string;
    source: string;
  };
  description: string;
  offeredRate: number;
  totalPayment: number;
}

interface ActiveDutiesResponse {
  success: boolean;
  data: ActiveDuty[];
  summary: {
    totalActiveDuties: number;
    assignedCount: number;
    enrouteCount: number;
    inProgressCount: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatusDisplay = (status: string): { label: string; bg: string; color: string } => {
  switch (status) {
    case 'assigned':
      return { label: 'ON TIME', bg: '#ECFDF5', color: '#10B981' };
    case 'available':
      return { label: 'ON TIME', bg: '#ECFDF5', color: '#10B981' };
    case 'enroute':
      return { label: 'IN TRANSIT', bg: '#FFFBEB', color: '#F59E0B' };
    case 'in-progress':
      return { label: 'IN PROGRESS', bg: '#EFF6FF', color: '#2563EB' };
    case 'delayed':
      return { label: 'DELAYED', bg: '#FEF2F2', color: '#EF4444' };
    case 'completed':
      return { label: 'COMPLETED', bg: '#F3F4F6', color: '#6B7280' };
    default:
      return { label: status.toUpperCase(), bg: '#F3F4F6', color: '#6B7280' };
  }
};

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#2563EB', '#0891B2',
];
const getAvatarColor = (name: string): string =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Initials Avatar ──────────────────────────────────────────────────────────
const InitialsAvatar = ({ name, size = 40 }: { name: string; size?: number }) => (
  <View
    style={[
      styles.initialsAvatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getAvatarColor(name),
      },
    ]}
  >
    <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
      {getInitials(name)}
    </Text>
  </View>
);

// ─── Tracking Card ────────────────────────────────────────────────────────────
const TrackingCard = ({
  duty,
  cardWidth,
  onShowMap,
}: {
  duty: ActiveDuty;
  cardWidth: number | string;
  onShowMap: (dutyId: string) => void;
}) => {
  const statusInfo = getStatusDisplay(duty.status.status);

  return (
    <View style={[styles.card, { width: cardWidth as any }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.roleText} numberOfLines={1}>
            {duty.formattedRole || duty.role.toUpperCase()}
          </Text>
          <Text style={styles.hospitalText} numberOfLines={1}>
            {duty.hospital.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Profile Row */}
      <View style={styles.profileRow}>
        <InitialsAvatar name={duty.staff.name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nameText} numberOfLines={1}>
            {duty.staff.name}
          </Text>
          <Text style={styles.idText}>
            ID: {duty.staff.id.slice(-6).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue} numberOfLines={1}>
            {duty.distance?.estimatedTimeText ?? '—'}
          </Text>
          <Text style={styles.statLabel}>ESTIMATED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue} numberOfLines={1}>
            {duty.distance?.distanceText ?? '—'}
          </Text>
          <Text style={styles.statLabel}>DISTANCE</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() => onShowMap(duty.dutyId)}
        >
          <Text style={styles.primaryBtnText}>Show on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Monitor Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveTrackingScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();

  const [duties, setDuties] = useState<ActiveDuty[]>([]);
  const [summary, setSummary] = useState<ActiveDutiesResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ── Column layout ──
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const gap = 20;
  const activeWidth = containerWidth > 0 ? containerWidth : screenWidth - 48;
  const cardWidth =
    columns === 1 ? '100%' : (activeWidth - gap * (columns - 1)) / columns;

  // ── Fetch ──
  const fetchActiveDuties = useCallback(async () => {
    try {
      setError(null);
      const data: ActiveDutiesResponse = await dutyAPI.getHospitalActiveDuties();
      if (data.success) {
        setDuties(data.data);
        setSummary(data.summary);
      } else {
        setError('Failed to load active duties.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchActiveDuties();
      setLoading(false);
    })();
  }, [fetchActiveDuties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveDuties();
    setRefreshing(false);
  }, [fetchActiveDuties]);

  // ── Navigation ──
  const handleShowOnMap = (dutyId: string) => {
    router.push({
      pathname: '/hospital/live-request-monitoring',
      params: { dutyId },
    });
  };

  // ── Render States ──
  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading active duties…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredState}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchActiveDuties()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
            <Text style={styles.pageSubtitle}>
              Real-time oversight of ongoing clinical shifts and logistics.
            </Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-header */}
        <View style={styles.subHeaderContainer}>
          <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>
              {summary?.totalActiveDuties ?? duties.length} ACTIVE
            </Text>
          </View>
          {summary && (
            <View style={styles.summaryRow}>
              {summary.assignedCount > 0 && (
                <View style={[styles.summaryChip, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.summaryChipText, { color: '#10B981' }]}>
                    {summary.assignedCount} Assigned
                  </Text>
                </View>
              )}
              {summary.enrouteCount > 0 && (
                <View style={[styles.summaryChip, { backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.summaryChipText, { color: '#F59E0B' }]}>
                    {summary.enrouteCount} En Route
                  </Text>
                </View>
              )}
              {summary.inProgressCount > 0 && (
                <View style={[styles.summaryChip, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.summaryChipText, { color: '#2563EB' }]}>
                    {summary.inProgressCount} In Progress
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Empty State */}
        {duties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Active Duties</Text>
            <Text style={styles.emptySubtitle}>
              There are no active duties at the moment. Pull down to refresh.
            </Text>
          </View>
        ) : (
          /* Grid */
          <View
            style={[styles.grid, { gap }]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            {duties.map((duty) => (
              <TrackingCard
                key={duty.dutyId}
                duty={duty}
                cardWidth={cardWidth}
                onShowMap={handleShowOnMap}
              />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.syncDot} />
            <Text style={styles.footerText}>
              Tracking data updates every 30 seconds. Pull to refresh.
            </Text>
          </View>
          <View style={styles.footerRight}>
            <TouchableOpacity style={styles.footerBtnLight} activeOpacity={0.7}>
              <Text style={styles.footerBtnLightText}>Filter Viewer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnBlue} activeOpacity={0.7}>
              <Text style={styles.footerBtnBlueText}>View All Personnel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { padding: 24, paddingBottom: 40 },

  // States
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Header
  headerContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 16, marginBottom: 24,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#9CA3AF' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8,
  },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Sub-header
  subHeaderContainer: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  subHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  activeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  summaryChipText: { fontSize: 10, fontWeight: '700' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  roleText: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  hospitalText: { fontSize: 12, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Profile
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  initialsAvatar: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: '#fff', fontWeight: '700' },
  nameText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  idText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#374151' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1, backgroundColor: '#2563EB', paddingVertical: 12,
    borderRadius: 8, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  secondaryBtn: {
    flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12,
    borderRadius: 8, alignItems: 'center',
  },
  secondaryBtnText: { color: '#4B5563', fontSize: 13, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 280 },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 16, marginTop: 32,
    paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
  footerRight: { flexDirection: 'row', gap: 12 },
  footerBtnLight: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 6,
  },
  footerBtnLightText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  footerBtnBlue: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 6,
  },
  footerBtnBlueText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
});