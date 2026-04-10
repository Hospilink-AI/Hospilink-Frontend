import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- Mock Data ---
const TRACKING_DATA = [
  { id: '1', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya' },
  { id: '2', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya2' },
  { id: '3', role: 'Emergency Nurse', hospital: 'Apollo Hospital', name: 'Priya Sharma', staffId: 'SP-4201', time: '12 mins', distance: '3.4 km', status: 'ON TIME', avatar: 'https://i.pravatar.cc/150?u=priya3' },
  { id: '4', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh' },
  { id: '5', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh2' },
  { id: '6', role: 'ICU Specialist', hospital: 'Fortis Healthcare', name: 'Dr. Rajesh Kumar', staffId: 'SP-4201', time: '24 mins', distance: '8.1 km', status: 'DELAYED', avatar: 'https://i.pravatar.cc/150?u=rajesh3' },
  { id: '7', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali' },
  { id: '8', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali2' },
  { id: '9', role: 'Radiology Tech', hospital: 'Manipal Hospital', name: 'Anjali Patel', staffId: 'SP-4201', time: '18 mins', distance: '5.2 km', status: 'IN TRANSIT', avatar: 'https://i.pravatar.cc/150?u=anjali3' },
];

// --- Card Component ---
const TrackingCard = ({ data, cardWidth }: { data: typeof TRACKING_DATA[0], cardWidth: any }) => {
  let badgeBg = '#ECFDF5';
  let badgeText = '#10B981';
  if (data.status === 'DELAYED') {
    badgeBg = '#FEF2F2';
    badgeText = '#EF4444';
  } else if (data.status === 'IN TRANSIT') {
    badgeBg = '#FFFBEB';
    badgeText = '#F59E0B';
  }

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.roleText}>{data.role}</Text>
          <Text style={styles.hospitalText}>{data.hospital}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusText, { color: badgeText }]}>{data.status}</Text>
        </View>
      </View>

      <View style={styles.profileRow}>
        <Image source={{ uri: data.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.nameText}>{data.name}</Text>
          <Text style={styles.idText}>ID: {data.staffId}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.time}</Text>
          <Text style={styles.statLabel}>ESTIMATED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.distance}</Text>
          <Text style={styles.statLabel}>DISTANCE</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Show on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Monitor Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Main Screen ---
export default function LiveTrackingScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0); // Stores actual usable width
  
  // Decide columns based on overall screen size
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  
  let columns = 1;
  if (isDesktop) columns = 3;
  else if (isTablet) columns = 2;

  const gap = 20;
  
  // Wait until we have the container width, otherwise default to screenWidth minus padding
  const activeWidth = containerWidth > 0 ? containerWidth : (screenWidth - 48);
  
  // Precise calculation to fit cards in exactly 3 columns based on the REAL container size
  const cardWidth = columns === 1 ? '100%' : (activeWidth - (gap * (columns - 1))) / columns;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Header --- */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
            <Text style={styles.pageSubtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* --- Sub-header --- */}
        <View style={styles.subHeaderContainer}>
          <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>24 ACTIVE</Text>
          </View>
        </View>

        {/* --- Grid Layout using onLayout to find exact width --- */}
        <View 
          style={[styles.grid, { gap }]} 
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {TRACKING_DATA.map((item, index) => (
            <TrackingCard key={index} data={item} cardWidth={cardWidth} />
          ))}
        </View>

        {/* --- Footer --- */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.syncDot} />
            <Text style={styles.footerText}>
              Tracking data updates every 30 seconds. Current sync latency: 1.2ms
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

// --- Styles remain exactly the same ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#9CA3AF' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  subHeaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  subHeaderTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  activeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  roleText: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  hospitalText: { fontSize: 12, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6' },
  nameText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  idText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#374151' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryBtnText: { color: '#4B5563', fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
  footerRight: { flexDirection: 'row', gap: 12 },
  footerBtnLight: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  footerBtnLightText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  footerBtnBlue: { backgroundColor: '#DBEAFE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  footerBtnBlueText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
});