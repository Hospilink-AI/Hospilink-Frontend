import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle,Svg } from 'react-native-svg';
import { profileAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffRoleItem {
  totalStaff: number;
  availableStaff: number;
  jobRole: string;
  availabilityPercentage: number;
}

interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_COLORS: string[] = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
  '#F97316',
];

const formatRoleName = (role: string): string => {
  if (!role) return '';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// ─── Circular Progress Ring ────────────────────────────────────────────────────
const ringStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

function CircularProgress({ percentage, color, size = 56 }: CircularProgressProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  
  // FIX: Round the percentage to prevent text overflow from long decimals
  percentage = Math.round(percentage || 0);

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

// ─── Staff Availability Card ───────────────────────────────────────────────────
function StaffAvailabilityCard() {
  const [staffData, setStaffData] = useState<StaffRoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: State to control viewing 3 vs all items
  const [showAll, setShowAll] = useState<boolean>(false);

  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        setLoading(true);
        const response = await profileAPI.getStaffAvailability();
        if (response?.success && Array.isArray(response?.data?.byRole)) {
          setStaffData(response.data.byRole);
        }
      } catch (err) {
        console.error('Failed to fetch staff availability:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffStats();
  }, []);

  // NEW: Slice the array based on showAll state
  const displayedStaff = showAll ? staffData : staffData.slice(0, 3);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>Staff Availability</Text>
        <Text style={styles.moreIcon}>···</Text>
      </View>

      {/* Body */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#3B82F6" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.availabilityList}>
          {displayedStaff.map((item, idx) => {
            const color = ROLE_COLORS[idx % ROLE_COLORS.length];
            return (
              <View key={idx} style={styles.staffRow}>
                <CircularProgress
                  percentage={item.availabilityPercentage}
                  color={color}
                  size={56}
                />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffRole}>{formatRoleName(item.jobRole)}</Text>
                  <Text style={styles.staffDesc}>
                    {item.availableStaff}/{item.totalStaff} Available
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer */}
      {!loading && !error && staffData.length > 3 && (
        <TouchableOpacity 
          style={styles.btnOutline} 
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.btnOutlineText}>
            {showAll ? 'Show Less' : 'View All'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Calendar Card ─────────────────────────────────────────────────────────────
function CalendarCard() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const gridDays: (number | null)[] = [
    ...Array.from<null>({ length: firstDayOfMonth }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.card}>
      <View style={styles.calendarHeader}>
        <Text style={styles.title}>
          {currentMonthName} {currentYear}
        </Text>
        <View style={styles.calendarNav}>
          <Text style={styles.navArrow}>{'<'}</Text>
          <Text style={styles.navArrow}>{'>'}</Text>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {days.map((d, i) => (
          <Text key={`head-${i}`} style={styles.calDayHeader}>
            {d}
          </Text>
        ))}
        {gridDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={{ width: '13%', marginBottom: 12 }} />;
          }
          if (day === currentDate) {
            return (
              <View key={`day-${index}`} style={styles.calDayActive}>
                <Text style={styles.calDayActiveText}>{day}</Text>
              </View>
            );
          }
          const isFuture = day > currentDate;
          return (
            <Text key={`day-${index}`} style={isFuture ? styles.calDayBold : styles.calDay}>
              {day}
            </Text>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Shifts</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Emergencies</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Alerts Card ───────────────────────────────────────────────────────────────
interface AlertItem {
  title: string;
  desc: string;
  time: string;
  type: 'critical' | 'info' | 'warning';
}

const ALERTS: AlertItem[] = [
  {
    title: 'Shift Gap Alert',
    desc: 'ICU Night Shift (Wing B) is short 2 nurses for tomorrow.',
    time: '10 mins ago',
    type: 'critical',
  },
  {
    title: 'System Maintenance',
    desc: 'EMR system will undergo brief downtime at 02:00 AM.',
    time: '1 hour ago',
    type: 'info',
  },
  {
    title: 'New Policy Update',
    desc: 'Please review the updated visitor guidelines effective immediately.',
    time: 'Yesterday',
    type: 'warning',
  },
];

function AlertsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.alertHeaderRow}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.badgeNew}>
          <Text style={styles.badgeNewText}>2 New</Text>
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 16 }}>
        {ALERTS.map((a, i) => (
          <View
            key={i}
            style={[
              styles.alertBox,
              a.type === 'critical' && styles.alertBoxRed,
              a.type === 'info' && styles.alertBoxBlue,
              a.type === 'warning' && styles.alertBoxYellow,
            ]}
          >
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, a.type === 'critical' && { color: '#B91C1C' }]}>
                {a.title}
              </Text>
              <Text style={styles.alertDesc}>{a.desc}</Text>
              <Text style={styles.alertTime}>{a.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function RightSidebarWidgets({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={styles.sidebarContainer}>
      <StaffAvailabilityCard />
      <CalendarCard />
      <AlertsCard />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sidebarContainer: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moreIcon: { fontSize: 18, color: '#9CA3AF', letterSpacing: 1 },
  errorText: { marginTop: 16, color: '#EF4444', fontSize: 13, textAlign: 'center' },

  // Staff Availability
  availabilityList: { marginTop: 16, gap: 16 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  staffInfo: { flex: 1 },
  staffRole: { fontSize: 14, fontWeight: '600', color: '#111827' },
  staffDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  btnOutline: { marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnOutlineText: { fontSize: 13, fontWeight: '600', color: '#111827' },

  // Calendar
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

  // Alerts
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