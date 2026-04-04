import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Request {
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD';
  department: string;
  requirement: string;
  eta: string;
  status: string;
  statusColor: string;
}

const REQUESTS: Request[] = [
  {
    priority: 'CRITICAL',
    department: 'ER - Trauma Center',
    requirement: '2x Trauma Nurse',
    eta: '05 min',
    status: 'Dispatching',
    statusColor: '#EF4444',
  },
  {
    priority: 'HIGH',
    department: 'ICU - Wing A',
    requirement: '1x Anesthesiologist',
    eta: '15 min',
    status: 'Matching',
    statusColor: '#F59E0B',
  },
  {
    priority: 'STANDARD',
    department: 'Pediatrics',
    requirement: '3x Gen. Staff',
    eta: '45 min',
    status: 'Pending',
    statusColor: '#6B7280',
  },
  {
    priority: 'CRITICAL',
    department: 'Cardiology OR 2',
    requirement: '1x Surgeon Asst.',
    eta: 'Immediate',
    status: 'Alert Sent',
    statusColor: '#EF4444',
  },
];

interface RecentRequestsProps {
  isTablet?: boolean;
}

export default function RecentRequests({ isTablet = false }: RecentRequestsProps) {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'HIGH':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'STANDARD':
        return { bg: '#DBEAFE', text: '#2563EB' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getEtaColor = (eta: string) => {
    if (eta.includes('Immediate') || eta.includes('05')) return '#EF4444';
    if (eta.includes('15')) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Emergency Requests</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, styles.colPriority]}>PRIORITY</Text>
            <Text style={[styles.columnHeader, styles.colDepartment]}>DEPARTMENT</Text>
            <Text style={[styles.columnHeader, styles.colRequirement]}>REQUIREMENT</Text>
            <Text style={[styles.columnHeader, styles.colEta]}>ETA</Text>
            <Text style={[styles.columnHeader, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.columnHeader, styles.colAction]}>ACTION</Text>
          </View>

          {/* Table Rows */}
          {REQUESTS.map((req, index) => {
            const priorityStyle = getPriorityStyle(req.priority);
            const etaColor = getEtaColor(req.eta);

            return (
              <View key={index} style={styles.tableRow}>
                {/* Priority */}
                <View style={styles.colPriority}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityStyle.bg }
                  ]}>
                    <View style={[
                      styles.priorityDot,
                      { backgroundColor: priorityStyle.text }
                    ]} />
                    <Text style={[
                      styles.priorityText,
                      { color: priorityStyle.text }
                    ]}>
                      {req.priority}
                    </Text>
                  </View>
                </View>

                {/* Department */}
                <View style={styles.colDepartment}>
                  <Text style={styles.departmentText}>{req.department}</Text>
                </View>

                {/* Requirement */}
                <View style={styles.colRequirement}>
                  <Text style={styles.requirementText}>{req.requirement}</Text>
                </View>

                {/* ETA */}
                <View style={styles.colEta}>
                  <Text style={[styles.etaText, { color: etaColor }]}>
                    {req.eta}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.colStatus}>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: req.statusColor }
                    ]} />
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                </View>

                {/* Action */}
                <View style={styles.colAction}>
                  <TouchableOpacity style={styles.assignButton}>
                    <Text style={styles.assignText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  table: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  colPriority: {
    width: 120,
  },
  colDepartment: {
    width: 150,
  },
  colRequirement: {
    width: 150,
  },
  colEta: {
    width: 100,
  },
  colStatus: {
    width: 120,
  },
  colAction: {
    width: 80,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  departmentText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    color: '#374151',
  },
  assignButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  assignText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
