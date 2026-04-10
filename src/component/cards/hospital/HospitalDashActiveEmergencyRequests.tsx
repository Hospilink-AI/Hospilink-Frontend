import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const EMERGENCIES = [
  { id: 1, priority: 'CRITICAL', dept: 'ER - Trauma Center', req: '2x Trauma Nurse', eta: '05 min', status: 'Dispatching', priColor: '#FEE2E2', priText: '#EF4444', etaColor: '#EF4444', statDot: '#F59E0B' },
  { id: 2, priority: 'HIGH', dept: 'ICU - Wing A', req: '1x Anesthesiologist', eta: '15 min', status: 'Matching', priColor: '#FEF3C7', priText: '#F59E0B', etaColor: '#F59E0B', statDot: '#3B82F6' },
  { id: 3, priority: 'STANDARD', dept: 'Pediatrics', req: '3x Gen. Staff', eta: '45 min', status: 'Pending', priColor: '#DBEAFE', priText: '#3B82F6', etaColor: '#6B7280', statDot: '#9CA3AF' },
  { id: 4, priority: 'CRITICAL', dept: 'Cardiology OR 2', req: '1x Surgeon Asst.', eta: 'Immediate', status: 'Alert Sent', priColor: '#FEE2E2', priText: '#EF4444', etaColor: '#EF4444', statDot: '#EF4444' },
];

export function ActiveEmergencyRequests({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Emergency Requests</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>

      {/* flexGrow: 1 ensures the ScrollView content stretches to fill the card on wide screens */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.table}>
          
          {/* Table Header */}
          <View style={styles.row}>
            <Text style={[styles.colHeader, styles.colPriority]}>PRIORITY</Text>
            <Text style={[styles.colHeader, styles.colDept]}>DEPARTMENT</Text>
            <Text style={[styles.colHeader, styles.colReq]}>REQUIREMENT</Text>
            <Text style={[styles.colHeader, styles.colEta]}>ETA</Text>
            <Text style={[styles.colHeader, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.colHeader, styles.colAction]}>ACTION</Text>
          </View>

          {/* Table Body */}
          {EMERGENCIES.map((req, idx) => (
            <View key={req.id} style={[styles.row, styles.bodyRow, idx !== EMERGENCIES.length - 1 && styles.borderBottom]}>
              
              <View style={[styles.colPriority, { justifyContent: 'center' }]}>
                <View style={[styles.priorityBadge, { backgroundColor: req.priColor }]}>
                  <Text style={[styles.priorityText, { color: req.priText }]}>! {req.priority}</Text>
                </View>
              </View>
              
              {/* numberOfLines={1} prevents long text from breaking the row height */}
              <Text style={[styles.cell, styles.colDept, { fontWeight: '600' }]} numberOfLines={1}>
                {req.dept}
              </Text>
              
              <Text style={[styles.cell, styles.colReq, { color: '#6B7280' }]} numberOfLines={1}>
                {req.req}
              </Text>
              
              <Text style={[styles.cell, styles.colEta, { color: req.etaColor, fontWeight: '600' }]}>
                {req.eta}
              </Text>
              
              <View style={[styles.colStatus, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <View style={[styles.dot, { backgroundColor: req.statDot }]} />
                <Text style={styles.cell} numberOfLines={1}>{req.status}</Text>
              </View>
              
              <View style={[styles.colAction, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
                {/* Placeholder for Icons */}
                <View style={styles.iconCircle} />
                <View style={styles.iconCircle} />
              </View>

            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  
  // Table width is 100% to fill space, but minWidth prevents it from squishing on mobile devices
  table: { width: '100%', minWidth: 650 }, 
  row: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center' },
  bodyRow: { paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  
  colHeader: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  cell: { fontSize: 12, color: '#111827', paddingRight: 8 }, // paddingRight prevents text from touching the next column
  
  // FLEX COLUMNS: These replace the hardcoded pixel widths
  colPriority: { flex: 1.2 },
  colDept: { flex: 2 },
  colReq: { flex: 2 },
  colEta: { flex: 1 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 1 },
  
  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  
  dot: { width: 6, height: 6, borderRadius: 3 },
  iconCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6' },
});