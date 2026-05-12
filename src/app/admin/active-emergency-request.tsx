import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Platform, Pressable } from 'react-native';

interface Request {
  priority: 'emergency' | 'urgent' | 'normal' | 'routine';
  hospital: string;
  requirement: string;
  eta: string;
  status: string;
  statusColor: string;
}

const REQUESTS: Request[] = [
  { priority: 'emergency', hospital: 'North Hills Trauma Center', requirement: '2x Trauma Nurse', eta: '05 min', status: 'Dispatching', statusColor: '#F59E0B' },
  { priority: 'urgent', hospital: "St. Mary's General", requirement: '1x Anesthesiologist', eta: '15 min', status: 'Matching', statusColor: '#3B82F6' },
  { priority: 'normal', hospital: "Pacific Children's Clinic", requirement: '3x Gen. Staff', eta: '45 min', status: 'Pending', statusColor: '#9CA3AF' },
  { priority: 'emergency', hospital: 'Riverside Medical Hub', requirement: '1x Surgeon Asst.', eta: 'Immediate', status: 'Alert Sent', statusColor: '#EF4444' },
  { priority: 'normal', hospital: "Pacific Children's Clinic", requirement: '3x Gen. Staff', eta: '45 min', status: 'Pending', statusColor: '#9CA3AF' },
  { priority: 'urgent', hospital: "St. Mary's General", requirement: '1x Anesthesiologist', eta: '15 min', status: 'Matching', statusColor: '#3B82F6' },
];

const DOCTORS = [
  { id: '1', name: 'Dr. Vishal Diwekar', role: 'General Physician', distance: '1.5 km', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '2', name: 'Dr. Atharva Kale', role: 'BAMS', distance: '1.9 km', avatar: 'https://i.pravatar.cc/150?img=12' },
];


// ✅ ADD HERE — before the component function
const mapStatus = (status: string) => {
  switch (status) {
    case 'in-progress': return 'Dispatching';
    case 'available':   return 'Pending';
    case 'assigned':    return 'Matching';
    default:            return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress': return '#F59E0B';
    case 'available':   return '#9CA3AF';
    case 'assigned':    return '#3B82F6';
    default:            return '#9CA3AF';
  }
};

const mapApiToRequests = (apiData: any[]): Request[] => {
  return apiData.map(item => ({
    priority: item.urgency,
    hospital: item.hospital.name,
    requirement: item.staffRole.toUpperCase(),
    eta: item.eta ?? 'N/A',
    status: mapStatus(item.status),
    statusColor: getStatusColor(item.status),
  }));
};

export default function RecentRequests() {
   const [requests, setRequests] = useState<Request[]>([]);
  const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('1');

  

  const getPriorityStyle = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'emergency': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'urgent':    return { bg: '#FEF3C7', text: '#D97706' };
    case 'normal':
    case 'routine':   return { bg: '#DBEAFE', text: '#2563EB' };
    default:          return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const renderPriorityIcon = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'emergency': return <Text style={styles.criticalIcon}>!</Text>;
    case 'urgent':    return <Ionicons name="triangle" size={10} color="#D97706" />;
    case 'normal':
    case 'routine':   return <Ionicons name="information-circle" size={12} color="#2563EB" />;
    default:          return null;
  }
};

  const getEtaColor = (eta: string) => {
    if (eta.includes('Immediate') || eta.includes('05')) return '#EF4444';
    if (eta.includes('15')) return '#D97706';
    return '#6B7280';
  };

  const togglePopup = (index: number) => {
    setActivePopupIndex(activePopupIndex === index ? null : index);
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.container, { zIndex: 1 }]}>
        
        {/* Backdrop for Popup */}
        {activePopupIndex !== null && (
          <Pressable style={styles.backdrop} onPress={() => setActivePopupIndex(null)} />
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Emergency Requests</Text>
        </View>

        {/* Responsive Table Wrapper */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            {requests.map((req, index) => {
              const priorityStyle = getPriorityStyle(req.priority);
              const etaColor = getEtaColor(req.eta);
              const isPopupOpen = activePopupIndex === index;

              return (
                <View key={index} style={[styles.tableRow, isPopupOpen && { zIndex: 100, elevation: 100 }]}>
                  {/* Priority */}
                  <View style={styles.colPriority}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                      {renderPriorityIcon(req.priority)}
                      <Text style={[styles.priorityText, { color: priorityStyle.text }]}>{req.priority}</Text>
                    </View>
                  </View>

                  {/* Hospital */}
                  <View style={styles.colDepartment}>
                    <Text style={styles.departmentText} numberOfLines={1}>{req.hospital}</Text>
                  </View>

                  {/* Requirement */}
                  <View style={styles.colRequirement}>
                    <Text style={styles.requirementText} numberOfLines={1}>{req.requirement}</Text>
                  </View>

                  {/* ETA */}
                  <View style={styles.colEta}>
                    <Text style={[styles.etaText, { color: etaColor }]} numberOfLines={1}>{req.eta}</Text>
                  </View>

                  {/* Status */}
                  <View style={styles.colStatus}>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: req.statusColor }]} />
                      <Text style={styles.statusText} numberOfLines={1}>{req.status}</Text>
                    </View>
                  </View>

                  {/* Action */}
                  <View style={[styles.colAction, isPopupOpen && { zIndex: 100 }]}>
                    <TouchableOpacity onPress={() => togglePopup(index)}>
                      <Text style={styles.assignText}>Assign</Text>
                    </TouchableOpacity>

                    {/* Assign Staff Popup */}
                    {isPopupOpen && (
                      <View style={styles.popupContainer}>
                        <View style={styles.popupHeader}>
                          <Text style={styles.popupTitle}>Assign Staff</Text>
                        </View>
                        <Text style={styles.popupSectionLabel}>Search Medical Staff</Text>
                        <View style={styles.searchContainer}>
                          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#6B7280" />
                        </View>
                        <ScrollView style={styles.doctorList} showsVerticalScrollIndicator={true}>
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
                                {isSelected ? (
                                  <Ionicons name="checkmark-circle-outline" size={22} color="#4B5563" />
                                ) : (
                                  <Ionicons name="ellipse-outline" size={22} color="#E5E7EB" />
                                )}
                              </TouchableOpacity>
                            )
                          })}
                        </ScrollView>
                        <TouchableOpacity style={styles.popupAssignBtn} onPress={() => setActivePopupIndex(null)}>
                          <Text style={styles.popupAssignBtnText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* --- EXACT SCREENSHOT PAGINATION --- */}
        <View style={styles.paginationContainer}>
          <View style={styles.paginationControls}>
            
            {/* Previous Button (Disabled State) */}
            <TouchableOpacity style={styles.pageIconButton} disabled>
              <Ionicons name="chevron-back" size={14} color="#9CA3AF" />
            </TouchableOpacity>
            
            {/* Page 1 (Active) */}
            <TouchableOpacity style={[styles.pageNumberButton, styles.pageNumberActive]}>
              <Text style={styles.pageNumberTextActive}>1</Text>
            </TouchableOpacity>
            
            {/* Page 2 */}
            <TouchableOpacity style={styles.pageNumberButton}>
              <Text style={styles.pageNumberText}>2</Text>
            </TouchableOpacity>
            
            {/* Page 3 */}
            <TouchableOpacity style={styles.pageNumberButton}>
              <Text style={styles.pageNumberText}>3</Text>
            </TouchableOpacity>
            
            {/* Next Button */}
            <TouchableOpacity style={styles.pageIconButton}>
              <Ionicons name="chevron-forward" size={14} color="#4B5563" />
            </TouchableOpacity>

          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1, 
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    overflow: 'hidden', 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    flexGrow: 1, 
  },
  table: {
    flex: 1,
    minWidth: 700, 
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  colPriority: { flex: 1.5, paddingRight: 10 },
  colDepartment: { flex: 2.5, paddingRight: 10 },
  colRequirement: { flex: 2, paddingRight: 10 },
  colEta: { flex: 1, paddingRight: 10 },
  colStatus: { flex: 1.5, paddingRight: 10 },
  colAction: { flex: 1, alignItems: 'flex-start' },
  
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', gap: 6 },
  criticalIcon: { fontSize: 13, fontWeight: '900', color: '#DC2626' },
  priorityText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  departmentText: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  requirementText: { fontSize: 14, color: '#6B7280' },
  etaText: { fontSize: 14, fontWeight: '800' },
  
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, color: '#6B7280' },
  
  assignText: { fontSize: 14, fontWeight: '800', color: '#2563EB' },

  popupContainer: { position: 'absolute', top: -20, right: '100%', marginLeft: 16, width: 310, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  popupTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  popupSectionLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  searchContainer: { backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 16 },
  searchInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#374151', ...(Platform.select({ web: { outlineStyle: 'none' } }) as any) },
  doctorList: { maxHeight: 200, marginBottom: 16 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, marginBottom: 8 },
  doctorCardSelected: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  doctorAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  doctorRole: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  popupAssignBtn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  popupAssignBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  /* --- NEW EXACT PAGINATION STYLES --- */
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Right aligns everything just like the screenshot
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF', 
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 8, // Accurate spacing between items
    alignItems: 'center',
  },
  pageIconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F8FAFC', // Very light grey/blue backing for icons
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F8FAFC', // Very light grey/blue backing for inactive numbers
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberActive: {
    backgroundColor: '#2563EB', // The active solid blue
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B', // Dark grey/slate for inactive text
  },
  pageNumberTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF', // White text for active
  },
});