
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Alert {
  type: 'error' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

const ALERTS: Alert[] = [
  {
    type: 'error',
    icon: '🚨',
    title: 'Code Blue Drill - 15:00',
    description: 'Simulated emergency drill in Wing B. Staff participation required.',
    timestamp: '10 mins ago',
  },
  {
    type: 'warning',
    icon: '⚠️',
    title: 'System Maintenance',
    description: 'EMR system will undergo brief downtime at 02:00 AM',
    timestamp: '1 hour ago',
  },
  {
    type: 'info',
    icon: '📋',
    title: 'New Policy Update',
    description: 'Please review the updated visitor guidelines effective immediately.',
    timestamp: 'Yesterday',
  },
];

interface CalendarDay {
  day: number;
  hasShift?: boolean;
  hasEmergency?: boolean;
  isToday?: boolean;
}

export default function PortalUsage() {
  const [currentMonth] = useState('October 2023');

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { bg: '#FEE2E2', border: '#FCA5A5', icon: '#DC2626' };
      case 'warning':
        return { bg: '#FEF3C7', border: '#FDE047', icon: '#D97706' };
      case 'info':
        return { bg: '#DBEAFE', border: '#93C5FD', icon: '#2563EB' };
      default:
        return { bg: '#F3F4F6', border: '#D1D5DB', icon: '#6B7280' };
    }
  };

  // Generate calendar days
  const generateCalendar = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    
    // October 2023 starts on Sunday (day 0)
    // Add days 1-31
    for (let i = 1; i <= 31; i++) {
      const day: CalendarDay = { day: i };
      
      // Mark some days with shifts
      if ([5, 12, 17, 23, 26].includes(i)) {
        day.hasShift = true;
      }
      
      // Mark some days with emergencies
      if ([8, 15, 22].includes(i)) {
        day.hasEmergency = true;
      }
      
      // Mark today (let's say it's the 23rd)
      if (i === 23) {
        day.isToday = true;
      }
      
      days.push(day);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {/* Alerts Section */}
      <View style={styles.section}>
        <View style={styles.alertHeader}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>3 New</Text>
          </View>
        </View>

        <View style={styles.alertsList}>
          {ALERTS.map((alert, index) => {
            const alertStyle = getAlertStyle(alert.type);
            
            return (
              <View
                key={index}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: alertStyle.bg,
                    borderColor: alertStyle.border,
                  },
                ]}
              >
                <View style={styles.alertIconContainer}>
                  <Text style={styles.alertIcon}>{alert.icon}</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                  <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Calendar Section */}
      <View style={[styles.section, { marginTop: 16 }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <Text style={styles.calendarNav}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>{currentMonth}</Text>
          <TouchableOpacity>
            <Text style={styles.calendarNav}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Week day headers */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {/* Empty cells for the first few days (October 2023 starts on Sunday) */}
          {calendarDays.map((dayData, index) => {
            const row = Math.floor(index / 7);
            const col = index % 7;
            
            return (
              <View key={index} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayContent,
                    dayData.isToday && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      dayData.isToday && styles.dayTodayText,
                    ]}
                  >
                    {dayData.day}
                  </Text>
                  {dayData.hasShift && (
                    <View style={[styles.dayDot, { backgroundColor: '#3B82F6' }]} />
                  )}
                  {dayData.hasEmergency && (
                    <View style={[styles.dayDot, { backgroundColor: '#EF4444' }]} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Shifts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Emergencies</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  
  // Alerts
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertsList: {
    gap: 10,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 11,
    color: '#6B7280',
  },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNav: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  dayToday: {
    backgroundColor: '#3B82F6',
  },
  dayText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  dayTodayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
