import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Platform, Pressable } from 'react-native';

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

const DOCTORS = [
  { id: '1', name: 'Dr. Vishal Diwekar', role: 'General Physician', distance: '1.5 km', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '2', name: 'Dr. Atharva Kale', role: 'BAMS', distance: '1.9 km', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: '3', name: 'Dr. Vishwas Kaul', role: 'Resident Doctor', distance: '2.0 km', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: '4', name: 'Dr. Aditya Wani', role: 'Specialist', distance: '2.1 km', avatar: 'https://i.pravatar.cc/150?img=14' },
];

interface RecentRequestsProps {
  isTablet?: boolean;
}

export default function RecentRequests({ isTablet = false }: RecentRequestsProps) {
  const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('1');

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

  const togglePopup = (index: number) => {
    setActivePopupIndex(activePopupIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { zIndex: 1 }]}>
      
      {/* ─── INVISIBLE BACKDROP FOR OUTSIDE CLICKS ─── */}
      {activePopupIndex !== null && (
        <Pressable 
          style={styles.backdrop} 
          onPress={() => setActivePopupIndex(null)} 
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Emergency Requests</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <View style={[styles.table, { zIndex: 2 }]}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, styles.colPriority]}>PRIORITY</Text>
          <Text style={[styles.columnHeader, styles.colDepartment]}>HOSPITAL</Text>
          <Text style={[styles.columnHeader, styles.colRequirement]}>REQUIREMENT</Text>
          <Text style={[styles.columnHeader, styles.colEta]}>ETA</Text>
          <Text style={[styles.columnHeader, styles.colStatus]}>STATUS</Text>
          <Text style={[styles.columnHeader, styles.colAction]}>ACTION</Text>
        </View>

        {/* Table Rows */}
        {REQUESTS.map((req, index) => {
          const priorityStyle = getPriorityStyle(req.priority);
          const etaColor = getEtaColor(req.eta);
          const isPopupOpen = activePopupIndex === index;

          return (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                isPopupOpen && { zIndex: 100, elevation: 100 } // Elevate the active row to show popup above others
              ]}
            >
              {/* Priority */}
              <View style={styles.colPriority}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityStyle.text }]} />
                  <Text style={[styles.priorityText, { color: priorityStyle.text }]} numberOfLines={1}>
                    {req.priority}
                  </Text>
                </View>
              </View>

              {/* Department */}
              <View style={styles.colDepartment}>
                <Text style={styles.departmentText} numberOfLines={1}>{req.department}</Text>
              </View>

              {/* Requirement */}
              <View style={styles.colRequirement}>
                <Text style={styles.requirementText} numberOfLines={1}>{req.requirement}</Text>
              </View>

              {/* ETA */}
              <View style={styles.colEta}>
                <Text style={[styles.etaText, { color: etaColor }]} numberOfLines={1}>
                  {req.eta}
                </Text>
              </View>

              {/* Status */}
              <View style={styles.colStatus}>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: req.statusColor }]} />
                  <Text style={styles.statusText} numberOfLines={1}>{req.status}</Text>
                </View>
              </View>

              {/* Action (With Popup) */}
              <View style={[styles.colAction, isPopupOpen && { zIndex: 100 }]}>
                <TouchableOpacity 
                  style={styles.assignButton} 
                  onPress={() => togglePopup(index)}
                >
                  <Text style={styles.assignText}>Assign</Text>
                </TouchableOpacity>

                {/* --- ASSIGN STAFF POPUP --- */}
                {isPopupOpen && (
                  <View style={styles.popupContainer}>
                    {/* Popup Header */}
                    <View style={styles.popupHeader}>
                      <Text style={styles.popupTitle}>Assign Staff</Text>
                      <TouchableOpacity style={styles.popupSelectBtn}>
                        <Ionicons name="paper-plane-outline" size={16} color="#3B82F6" />
                        <Text style={styles.popupSelectText}>Select</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Search Field */}
                    <Text style={styles.popupSectionLabel}>Search Medical Staff</Text>
                    <View style={styles.searchContainer}>
                      <TextInput 
                        style={styles.searchInput}
                        placeholder="Dr. Vishal Diwekar"
                        placeholderTextColor="#6B7280"
                      />
                    </View>

                    {/* Doctors List */}
                    <Text style={styles.popupSectionLabel}>Available Doctors</Text>
                    <ScrollView 
                      style={styles.doctorList} 
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={{ paddingRight: 4 }}
                    >
                      {DOCTORS.map((doctor) => {
                        const isSelected = selectedDoctorId === doctor.id;
                        return (
                          <TouchableOpacity 
                            key={doctor.id} 
                            style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                            onPress={() => setSelectedDoctorId(doctor.id)}
                            activeOpacity={0.7}
                          >
                            <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
                            <View style={styles.doctorInfo}>
                              <Text style={styles.doctorName}>{doctor.name}</Text>
                              <Text style={styles.doctorRole}>{doctor.role}</Text>
                            </View>
                            <Text style={styles.doctorDistance}>{doctor.distance}</Text>
                            
                            {/* Radio Button Icon */}
                            {isSelected ? (
                              <Ionicons name="checkmark-circle-outline" size={22} color="#4B5563" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={22} color="#E5E7EB" />
                            )}
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>

                    {/* Bottom Assign Button */}
                    <TouchableOpacity 
                      style={styles.popupAssignBtn}
                      onPress={() => setActivePopupIndex(null)} // Closes popup
                    >
                      <Text style={styles.popupAssignBtnText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
    width: '100%',
    position: 'relative', // Ensures the absolute backdrop maps to this container
  },
  
  /* --- BACKDROP FOR OUTSIDE CLICKS --- */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90, // Sits above the table rows but below the active popup (which is 100)
    elevation: 90,
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
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
    alignItems: 'center',
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
  colPriority: { flex: 1.5, paddingRight: 8 },
  colDepartment: { flex: 2, paddingRight: 8 },
  colRequirement: { flex: 1.8, paddingRight: 8 },
  colEta: { flex: 1, paddingRight: 8 },
  colStatus: { flex: 1.5, paddingRight: 8 },
  colAction: { flex: 1, alignItems: 'flex-end', position: 'relative' },
  
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  departmentText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  requirementText: { fontSize: 13, color: '#6B7280' },
  etaText: { fontSize: 13, fontWeight: '600' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13, color: '#374151' },
  
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

  /* --- POPUP STYLES --- */
  popupContainer: {
    position: 'absolute',
    top: -20,
    right: '100%',
    marginLeft: 16,
    width: 310,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  popupSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popupSelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  popupSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  searchContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 16,
  },
  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    ...(Platform.select({
      web: { outlineStyle: 'none' }
    }) as any),
  },
  doctorList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
  },
  doctorCardSelected: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  doctorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorRole: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  doctorDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginRight: 10,
  },
  popupAssignBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  popupAssignBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});