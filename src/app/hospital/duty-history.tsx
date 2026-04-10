import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- Static Mock Data ---
const MOCK_DUTIES = [
  { id: '1', initials: 'DJ', name: 'Dr. Julian Thorne', email: 'julian.t@hospilink.com', role: 'Specialist', dept: 'Cardiologist', shift: '22:00 pm - 06:00 am', hours: '2 Hours', status: 'COMPLETED', rating: '4.8', color: '#DBEAFE', textColor: '#2563EB' },
  { id: '2', initials: 'NE', name: 'Dr. Sarah Jenkins', email: 's.jenkins@hospilink.com', role: 'Specialist', dept: 'Triage', shift: '08:00 am - 04:00 pm', hours: '8 Hours', status: 'COMPLETED', rating: '4.0', color: '#DBEAFE', textColor: '#2563EB' },
  { id: '3', initials: 'DA', name: 'Thomas Anderson, RN', email: 'thomas.a@hospilink.com', role: 'Head Nurse', dept: 'General Ward', shift: '11:00 am - 09:00 pm', hours: '10 Hours', status: 'COMPLETED', rating: '3.8', color: '#DBEAFE', textColor: '#2563EB' },
  { id: '4', initials: 'NS', name: 'Dr. Abhijeet Patil', email: 'a.patil@hospilink.com', role: 'Resident Doctor', dept: 'Cardiologist', shift: '00:00 am - 06:00 am', hours: '6 Hours', status: 'COMPLETED', rating: '4.2', color: '#DBEAFE', textColor: '#2563EB' },
  { id: '5', initials: 'NS', name: 'Dr. Javed Shaikh', email: 's.javed@hospilink.com', role: 'Resident Doctor', dept: 'Neurosurgeon', shift: '06:00 am - 11:00 am', hours: '5 Hours', status: 'COMPLETED', rating: '4.5', color: '#DBEAFE', textColor: '#2563EB' },
];

export default function DutyHistoryScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Page Header --- */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Duty History</Text>
          <Text style={styles.pageSubtitle}>Manage complete staffing logs and operational reports.</Text>
        </View>

        {/* --- Main Card --- */}
        <View style={styles.card}>
          
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Duty History</Text>
            <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={16} color="#475569" />
              <Text style={styles.exportBtnText}>Export Report</Text>
            </TouchableOpacity>
          </View>

          {/* Filters Area */}
          <View style={[styles.filtersRow, isMobile && styles.filtersRowMobile]}>
            {/* Date Filter */}
            <View style={[styles.filterGroup, isMobile && { width: '100%' }]}>
              <Text style={styles.filterLabel}>DATE</Text>
              <View style={styles.inputMock}>
                <Text style={styles.inputText}>23-10-2025</Text>
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
              </View>
            </View>

            {/* Facility Filter */}
            <View style={[styles.filterGroup, isMobile && { width: '100%' }]}>
              <Text style={styles.filterLabel}>HOSPITAL NAMES</Text>
              <View style={styles.inputMock}>
                <Text style={styles.inputText}>All Facilities</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </View>
            </View>

            {/* Apply Button */}
            <View style={[styles.filterGroup, isMobile ? { width: '100%', marginTop: 8 } : { justifyContent: 'flex-end' }]}>
              <TouchableOpacity style={styles.applyBtn} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Data Table --- */}
          {/* Wrapped in horizontal ScrollView for mobile responsiveness */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableContainer}>
              
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, styles.colStaff]}>STAFF NAME</Text>
                <Text style={[styles.thText, styles.colRole]}>ROLE & DEPT</Text>
                <Text style={[styles.thText, styles.colDuration]}>SHIFT DURATION</Text>
                <Text style={[styles.thText, styles.colHours]}>HOURS COMPLETED</Text>
                <Text style={[styles.thText, styles.colStatus]}>FINAL STATUS</Text>
                <Text style={[styles.thText, styles.colRating, { textAlign: 'right' }]}>RATING</Text>
              </View>

              {/* Table Body */}
              {MOCK_DUTIES.map((duty, index) => {
                const isLast = index === MOCK_DUTIES.length - 1;
                return (
                  <View key={duty.id} style={[styles.tableRow, !isLast && styles.borderBottom]}>
                    
                    {/* Staff Name Column */}
                    <View style={[styles.tdCell, styles.colStaff, styles.rowCenter]}>
                      <View style={[styles.avatar, { backgroundColor: duty.color }]}>
                        <Text style={[styles.avatarText, { color: duty.textColor }]}>{duty.initials}</Text>
                      </View>
                      <View>
                        <Text style={styles.tdTitle}>{duty.name}</Text>
                        <Text style={styles.tdSub}>{duty.email}</Text>
                      </View>
                    </View>

                    {/* Role & Dept Column */}
                    <View style={[styles.tdCell, styles.colRole]}>
                      <Text style={styles.tdTitle}>{duty.role}</Text>
                      <Text style={styles.tdSub}>{duty.dept}</Text>
                    </View>

                    {/* Shift Duration Column */}
                    <View style={[styles.tdCell, styles.colDuration]}>
                      <Text style={styles.tdText}>{duty.shift}</Text>
                    </View>

                    {/* Hours Completed Column */}
                    <View style={[styles.tdCell, styles.colHours]}>
                      <Text style={styles.tdTitle}>{duty.hours}</Text>
                    </View>

                    {/* Final Status Column */}
                    <View style={[styles.tdCell, styles.colStatus]}>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusBadgeText}>{duty.status}</Text>
                      </View>
                    </View>

                    {/* Rating Column */}
                    <View style={[styles.tdCell, styles.colRating, styles.rowEnd]}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.tdTitle}>{duty.rating}</Text>
                    </View>

                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* --- Pagination Footer --- */}
          <View style={[styles.paginationFooter, isMobile && { flexDirection: 'column', gap: 16 }]}>
            <Text style={styles.paginationText}>Showing 1-5 of 100 duties recorded this week</Text>
            
            <View style={styles.pageButtonsWrap}>
              <TouchableOpacity style={styles.pageBtn}><Ionicons name="chevron-back" size={14} color="#64748B" /></TouchableOpacity>
              <TouchableOpacity style={[styles.pageBtn, styles.pageBtnActive]}><Text style={styles.pageBtnTextActive}>1</Text></TouchableOpacity>
              <TouchableOpacity style={styles.pageBtn}><Text style={styles.pageBtnText}>2</Text></TouchableOpacity>
              <TouchableOpacity style={styles.pageBtn}><Text style={styles.pageBtnText}>3</Text></TouchableOpacity>
              <TouchableOpacity style={styles.pageBtn}><Ionicons name="chevron-forward" size={14} color="#64748B" /></TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { padding: 24, paddingBottom: 40, maxWidth: 1400, marginHorizontal: 'auto', width: '100%' },

  // Page Header
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },

  // Main Card
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  // Filters
  filtersRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 24 },
  filtersRowMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  filterGroup: { flex: 1 },
  filterLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5 },
  inputMock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FAFAF9' },
  inputText: { fontSize: 14, color: '#1E293B' },
  applyBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 24, paddingVertical: 11, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },

  // Table Container (minWidth prevents squishing on mobile horizontal scroll)
  tableContainer: { minWidth: 900, width: '100%' },
  
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 8 },
  thText: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  
  tdCell: { justifyContent: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },

  // Columns Widths (Flex ratios)
  colStaff: { flex: 2.5 },
  colRole: { flex: 1.5 },
  colDuration: { flex: 2 },
  colHours: { flex: 1.5 },
  colStatus: { flex: 1.5 },
  colRating: { flex: 0.8 },

  // Typography for Cells
  tdTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  tdSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  tdText: { fontSize: 13, color: '#475569' },

  // Avatar
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },

  // Status Badge
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },

  // Pagination
  paginationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 16, paddingTop: 20 },
  paginationText: { fontSize: 12, color: '#94A3B8' },
  pageButtonsWrap: { flexDirection: 'row', gap: 6 },
  pageBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  pageBtnActive: { backgroundColor: '#2563EB' },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  pageBtnTextActive: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});