import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// --- Sub-component: Staff Availability ---
const STAFF_STATS = [
  { role: 'Medical Officers', pct: 75, color: '#3B82F6' },
  { role: 'Nurses', pct: 92, color: '#10B981' },
  { role: 'Radiologists', pct: 45, color: '#F59E0B' },
];

function StaffAvailabilityCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Staff Availability</Text>
      <View style={styles.availabilityList}>
        {STAFF_STATS.map((s, idx) => (
          <View key={idx} style={styles.staffRow}>
            <View style={[styles.ringContainer, { borderColor: s.color }]}>
              <Text style={styles.ringText}>{s.pct}%</Text>
            </View>
            <View>
              <Text style={styles.staffRole}>{s.role}</Text>
              <Text style={styles.staffDesc}>Available out of total in 30KM</Text>
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.btnOutline}>
        <Text style={styles.btnOutlineText}>View Detailed Report</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Sub-component: Calendar ---
function CalendarCard() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get dynamic dates
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();
  
  // Calculate grid data
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  // Build array of days for the grid (including nulls for empty starting slots)
  // Build array of days for the grid (including nulls for empty starting slots)
const gridDays = Array.from<number | null>({ length: firstDayOfMonth } )
  .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <View style={styles.card}>
      <View style={styles.calendarHeader}>
        <Text style={styles.title}>{currentMonthName} {currentYear}</Text>
        <View style={styles.calendarNav}>
          <Text style={styles.navArrow}>{'<'}</Text>
          <Text style={styles.navArrow}>{'>'}</Text>
        </View>
      </View>
      
      <View style={styles.calendarGrid}>
        {/* Render Days of Week Header */}
        {days.map((d, i) => <Text key={`head-${i}`} style={styles.calDayHeader}>{d}</Text>)}
        
        {/* Render dynamic calendar grid */}
        {gridDays.map((day, index) => {
          // Empty slots before the 1st of the month
          if (day === null) {
            return <View key={`empty-${index}`} style={{ width: '13%', marginBottom: 12 }} />;
          }

          // Active/Current Day Highlight
          if (day === currentDate) {
            return (
              <View key={`day-${index}`} style={styles.calDayActive}>
                <Text style={styles.calDayActiveText}>{day}</Text>
              </View>
            );
          }

          // Distinguish past vs future dates slightly
          const isFuture = day > currentDate;
          return (
            <Text 
              key={`day-${index}`} 
              style={isFuture ? styles.calDayBold : styles.calDay}
            >
              {day}
            </Text>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, {backgroundColor: '#3B82F6'}]}/>
          <Text style={styles.legendText}>Shifts</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, {backgroundColor: '#EF4444'}]}/>
          <Text style={styles.legendText}>Emergencies</Text>
        </View>
      </View>
    </View>
  );
}

// --- Sub-component: Alerts ---
const ALERTS = [
  { title: 'Shift Gap Alert', desc: 'ICU Night Shift (Wing B) is short 2 nurses for tomorrow.', time: '10 mins ago', type: 'critical' },
  { title: 'System Maintenance', desc: 'EMR system will undergo brief downtime at 02:00 AM.', time: '1 hour ago', type: 'info' },
  { title: 'New Policy Update', desc: 'Please review the updated visitor guidelines effectively immediately.', time: 'Yesterday', type: 'warning' },
];

function AlertsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.alertHeaderRow}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.badgeNew}><Text style={styles.badgeNewText}>2 New</Text></View>
      </View>
      
      <View style={{ gap: 12, marginTop: 16 }}>
        {ALERTS.map((a, i) => (
          <View key={i} style={[
            styles.alertBox, 
            a.type === 'critical' && styles.alertBoxRed,
            a.type === 'info' && styles.alertBoxBlue,
            a.type === 'warning' && styles.alertBoxYellow,
          ]}>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, a.type === 'critical' && { color: '#B91C1C' }]}>{a.title}</Text>
              <Text style={styles.alertDesc}>{a.desc}</Text>
              <Text style={styles.alertTime}>{a.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// --- Main Export ---
export function RightSidebarWidgets({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={styles.sidebarContainer}>
      <StaffAvailabilityCard />
      <CalendarCard />
      <AlertsCard />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  
  // Staff Availability Styles
  availabilityList: { marginTop: 16, gap: 16 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ringContainer: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, justifyContent: 'center', alignItems: 'center', borderLeftColor: '#E5E7EB' }, // Faking the progress ring
  ringText: { fontSize: 11, fontWeight: '700', color: '#111827' },
  staffRole: { fontSize: 14, fontWeight: '600', color: '#111827' },
  staffDesc: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  btnOutline: { marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnOutlineText: { fontSize: 13, fontWeight: '600', color: '#111827' },

  // Calendar Styles
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarNav: { flexDirection: 'row', gap: 16 },
  navArrow: { color: '#6B7280', fontWeight: 'bold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calDayHeader: { width: '13%', textAlign: 'center', fontSize: 11, color: '#6B7280', marginBottom: 12 },
  calDay: { width: '13%', textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  calDayBold: { width: '13%', textAlign: 'center', fontSize: 12, color: '#111827', fontWeight: '600', marginBottom: 12 },
  calDayActive: { width: '13%', alignItems: 'center', marginBottom: 12 },
  calDayActiveText: { backgroundColor: '#3B82F6', color: '#fff', width: 24, height: 24, textAlign: 'center', lineHeight: 24, borderRadius: 12, overflow: 'hidden', fontSize: 12, fontWeight: 'bold' },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#6B7280' },

  // Alerts Styles
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeNew: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeNewText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  alertBox: { padding: 12, borderRadius: 8, borderLeftWidth: 4 },
  alertBoxRed: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' },
  alertBoxBlue: { backgroundColor: '#F0F9FF', borderLeftColor: '#3B82F6' },
  alertBoxYellow: { backgroundColor: '#FFFBEB', borderLeftColor: '#F59E0B' },
  alertContent: { paddingLeft: 4 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  alertDesc: { fontSize: 11, color: '#4B5563', lineHeight: 16 },
  alertTime: { fontSize: 10, color: '#6B7280', marginTop: 8 },
});