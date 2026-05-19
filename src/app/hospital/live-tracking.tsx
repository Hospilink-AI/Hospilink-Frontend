// import React, { useState } from 'react';
// import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
// import { RangeKm } from '../../types/duty';

// // Metro resolves these to .web.tsx or .native.tsx automatically
// import RangeDropdown from '../../component/cards/hospital/live-tracking/RangeDropdown';
// const LiveMap = React.lazy(
//     () => import('../../component/cards/hospital/live-tracking/LiveMap')
// );

// const LiveTracking: React.FC = () => {
//     const [selectedRange, setSelectedRange] = useState<RangeKm>(5);

//     return (
//         <View style={styles.screen}>


//             <ScrollView
//                 style={styles.scroll}
//                 contentContainerStyle={styles.scrollContent}
//                 showsVerticalScrollIndicator={false}
//             >
//                 {/* ── Map area ───────────────────────────────────── */}
//                 <View style={styles.mapWrapper}>
//                     {/* Range dropdown — overlaid top-right of map */}
//                     <View style={styles.dropdownOverlay}>
//                         <RangeDropdown
//                             selectedRange={selectedRange}
//                             onRangeChange={setSelectedRange}
//                         />
//                     </View>



//                     <View style={styles.floatingBar}>
//                         <View style={styles.floatingBarInner}>
//                             <View style={styles.hospitalIconBox}>
//                                 <Text style={styles.hospitalEmoji}>🏥</Text>
//                             </View>

//                             <View style={styles.liveBadge}>
//                                 <View style={styles.liveDot} />
//                                 <Text style={styles.liveText}>LIVE</Text>
//                             </View>
//                         </View>
//                     </View>

//                 </View>

//                 {/* ── Legend ─────────────────────────────────────── */}
//                 <View style={styles.legend}>
//                     <View style={styles.legendItem}>
//                         <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
//                         <Text style={styles.legendLabel}>Hospital</Text>
//                     </View>
//                     <View style={styles.legendItem}>
//                         <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
//                         <Text style={styles.legendLabel}>Available</Text>
//                     </View>

//                 </View>

//             </ScrollView>
//         </View>
//     );
// };

// export default LiveTracking;

// const styles = StyleSheet.create({
//     screen: {
//         flex: 1,
//         backgroundColor: '#F5F7FA',
//     },
//     // Header
//     header: {
//         backgroundColor: '#1565C0',
//         paddingTop: 52,
//         paddingBottom: 16,
//         paddingHorizontal: 16,
//     },
//     headerTitle: {
//         fontSize: 20,
//         fontWeight: '700',
//         color: '#FFFFFF',
//     },
//     headerSub: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#BBDEFB',
//         marginTop: 4,
//     },
//     headerAddress: {
//         fontSize: 12,
//         color: '#90CAF9',
//         marginTop: 2,
//     },
//     // Scroll
//     scroll: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingBottom: 40,
//     },
//     // Map
//     mapWrapper: {
//         height:  'calc(100vh - 100px)' as any,
//         width: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//     },
//     dropdownOverlay: {
//         position: 'absolute',
//         top: 12,
//         right: 12,
//         zIndex: 1000,
//     },
//     // Legend
//     legend: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flexWrap: 'wrap',
//         gap: 12,
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         backgroundColor: '#FFFFFF',
//         borderBottomWidth: 1,
//         borderBottomColor: '#E0E0E0',
//     },
//     legendItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     legendDot: {
//         width: 12,
//         height: 12,
//         borderRadius: 6,
//     },
//     legendLabel: {
//         fontSize: 13,
//         color: '#555',
//     },
//     countText: {
//         marginLeft: 'auto' as any,
//         fontSize: 12,
//         fontWeight: '600',
//         color: '#1565C0',
//     },
//     // Doctor list
//     listSection: {
//         paddingHorizontal: 16,
//         paddingTop: 16,
//     },
//     listTitle: {
//         fontSize: 17,
//         fontWeight: '700',
//         color: '#1A237E',
//         marginBottom: 12,
//     },
//     emptyText: {
//         textAlign: 'center',
//         color: '#888',
//         fontSize: 14,
//         marginTop: 24,
//         lineHeight: 22,
//     },
//     floatingBar: {
//   position: 'absolute',
//   bottom: 24,
//   left: 16,
//   right: 16,
//   zIndex: 999,
//   borderRadius: 16,
//   overflow: 'hidden',
//   shadowColor: '#1565C0',
//   shadowOffset: { width: 0, height: 8 },
//   shadowOpacity: 0.25,
//   shadowRadius: 16,
//   elevation: 12,
// },
// floatingBarInner: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 12,
//   paddingVertical: 12,
//   paddingHorizontal: 16,
//   backgroundColor: 'rgba(21, 101, 192, 0.55)',
//   borderWidth: 1,
//   borderColor: 'rgba(255, 255, 255, 0.2)',
//   borderRadius: 16,
//   ...(Platform.OS === 'web' && {
//     backdropFilter: 'blur(12px)',
//     WebkitBackdropFilter: 'blur(12px)',
//   } as any),
// },
// hospitalIconBox: {
//   width: 40,
//   height: 40,
//   borderRadius: 12,
//   backgroundColor: 'rgba(255,255,255,0.15)',
//   alignItems: 'center',
//   justifyContent: 'center',
//   flexShrink: 0,
// },
// hospitalEmoji: { fontSize: 20 },
// hospitalTextBox: { flex: 1 },
// hospitalName: {
//   fontSize: 13,
//   fontWeight: '700',
//   color: '#FFFFFF',
//   letterSpacing: 0.2,
// },
// hospitalAddress: {
//   fontSize: 11,
//   color: 'rgba(255,255,255,0.75)',
//   marginTop: 2,
//   lineHeight: 15,
// },
// liveBadge: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 4,
//   backgroundColor: 'rgba(255,255,255,0.15)',
//   paddingHorizontal: 8,
//   paddingVertical: 4,
//   borderRadius: 20,
//   borderWidth: 1,
//   borderColor: 'rgba(255,255,255,0.25)',
// },
// liveDot: {
//   width: 6,
//   height: 6,
//   borderRadius: 3,
//   backgroundColor: '#69F0AE',
// },
// liveText: {
//   fontSize: 10,
//   fontWeight: '800',
//   color: '#69F0AE',
//   letterSpacing: 1,
// },
// });



/**
 * MapScreen.tsx (live-tracking.tsx)
 * All 3 controls — Role, Range, Satellite — in ONE compact row, top-right.
 * Works on Web and Android/iOS.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RangeDropdown from '../../component/cards/hospital/live-tracking/RangeDropdown';
import { dutyAPI } from '../../service/api';
import { DoctorWithDistance, Hospital, RangeKm } from '../../types/duty';
import { adaptStaffToDoctor, jitterDuplicates } from '../../utils/distanceDecoder';
import LiveMapView, { DoctorPin, HospitalPin } from '../../component/cards/hospital/live-tracking/LiveMapView';

// ── Roles ──────────────────────────────────────────────────────────────────────
const ROLES = [
  { label: 'All Roles',          value: '' },
  { label: 'RMO',                value: 'rmo' },
  { label: 'DMO',                value: 'dmo' },
  { label: 'General Physician',  value: 'general_physician' },
  { label: 'Intensivist / ICU',  value: 'intensivist' },
  { label: 'Emergency Doctor',   value: 'emergency_doctor' },
  { label: 'Anesthetist',        value: 'anesthetist' },
  { label: 'Pediatrician',       value: 'pediatrician' },
  { label: 'Gynecologist',       value: 'gynecologist' },
  { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
  { label: 'General Surgeon',    value: 'general_surgeon' },
  { label: 'Radiologist',        value: 'radiologist' },
  { label: 'Staff Nurse',        value: 'staff_nurse' },
  { label: 'ICU Nurse',          value: 'icu_nurse' },
  { label: 'Emergency Nurse',    value: 'emergency_nurse' },
  { label: 'Lab Technician',     value: 'lab_technician' },
  { label: 'Ward Boy',           value: 'ward_boy' },
  { label: 'Pharmacist',         value: 'pharmacist' },
  { label: 'Ambulance Driver',   value: 'ambulance_driver' },
];

// ── Cache ──────────────────────────────────────────────────────────────────────
const cache: {
  data: { hospital: Hospital; doctors: DoctorWithDistance[] } | null;
  range: RangeKm | null;
  role: string | null;
  fetching: boolean;
} = { data: null, range: null, role: null, fetching: false };

// ── Role Selector ─────────────────────────────────────────────────────────────
// Web  → native <select> (compact, fixed width)
// Native → TouchableOpacity + bottom-sheet Modal
interface RoleSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const label = ROLES.find(r => r.value === value)?.label ?? 'All Roles';

  if (Platform.OS === 'web') {
    return (
      // @ts-ignore — <select> is valid JSX on web
      <select
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        style={{
          height: 36,
          padding: '0 8px',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          fontSize: 12,
          fontWeight: '600',
          backgroundColor: '#fff',
          color: '#374151',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          // Fixed width so it doesn't expand and break the row
          width: 120,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    );
  }

  // Native
  return (
    <>
      <TouchableOpacity
        style={pickerStyles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={pickerStyles.triggerText} numberOfLines={1}>{label}</Text>
        <Text style={pickerStyles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={pickerStyles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.sheetHeader}>
            <Text style={pickerStyles.sheetTitle}>Select Role</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={pickerStyles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ROLES}
            keyExtractor={r => r.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[pickerStyles.item, item.value === value && pickerStyles.itemActive]}
                onPress={() => { onChange(item.value); setOpen(false); }}
              >
                <Text style={[pickerStyles.itemText, item.value === value && pickerStyles.itemTextActive]}>
                  {item.label}
                </Text>
                {item.value === value && <Text style={{ color: '#1565C0', fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [selectedRange, setSelectedRange] = useState<RangeKm>(5);
  const [selectedRole,  setSelectedRole]  = useState('');
  const [doctors,       setDoctors]       = useState<DoctorWithDistance[]>([]);
  const [hospital,      setHospital]      = useState<Hospital | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [isSatellite,   setIsSatellite]   = useState(false);

  useEffect(() => {
    if (cache.fetching) return;
    if (cache.range === selectedRange && cache.role === selectedRole && cache.data) {
      setHospital(cache.data.hospital);
      setDoctors(cache.data.doctors);
      setLoading(false);
      return;
    }

    let cancelled = false;
    cache.fetching = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res  = await dutyAPI.getNearbyStaff(selectedRange, selectedRole);
        if (cancelled) return;
        const data = res.data;

        const hospitalData: Hospital = {
          id: 'hospital-main',
          name: data.hospital.name,
          location: {
            latitude:  data.hospital.location.latitude,
            longitude: data.hospital.location.longitude,
            address:   data.hospital.hospital?.address?.currentAddress ?? data.hospital.name,
          },
        };
        const doctorsData = jitterDuplicates(
          data.staff.map(adaptStaffToDoctor),
        ) as DoctorWithDistance[];

        cache.data  = { hospital: hospitalData, doctors: doctorsData };
        cache.range = selectedRange;
        cache.role  = selectedRole;
        setHospital(hospitalData);
        setDoctors(doctorsData);
      } catch {
        if (!cancelled) setError('Failed to load nearby staff. Please try again.');
      } finally {
        cache.fetching = false;
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; cache.fetching = false; };
  }, [selectedRange, selectedRole, refreshKey]);

  const handleRefresh = () => {
    cache.data = null; cache.range = null; cache.role = null; cache.fetching = false;
    setRefreshKey(k => k + 1);
  };

  const handleRoleChange = (val: string) => {
    cache.data = null; cache.range = null; cache.role = null;
    setSelectedRole(val);
  };

  const availableCount = doctors.filter(d => d.available).length;

  const hospitalPin: HospitalPin | null = hospital
    ? { name: hospital.name, location: hospital.location } : null;

  const doctorPins: DoctorPin[] = doctors.map(d => ({
    id: d.id, name: d.name, specialty: d.specialty,
    available: d.available, distanceKm: d.distanceKm,
    phone: d.phone, email: d.email, location: d.location,
  }));

  const screenHeight = Dimensions.get('window').height;
  const mapHeight    = Platform.OS === 'web'
    ? ('calc(100vh - 64px)' as any)
    : screenHeight - 120;

  return (
    <View style={styles.screen}>

      {/* ── Map area ── */}
      <View style={[styles.mapWrapper, { height: mapHeight }]}>

        {/* ── Controls row: Role | Range | 🛰 — top-right, single line ── */}
        <View style={styles.controlsOverlay}>
          <View style={styles.controlsRow}>

            {/* 1. Role selector */}
            <RoleSelector value={selectedRole} onChange={handleRoleChange} />

            {/* 2. Range dropdown */}
            <RangeDropdown selectedRange={selectedRange} onRangeChange={setSelectedRange} />

            {/* 3. Satellite toggle — icon only (36×36) */}
            <TouchableOpacity
              style={styles.satBtn}
              onPress={() => setIsSatellite(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.satIcon}>{isSatellite ? '🗺' : '🛰'}</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Finding nearby staff...</Text>
          </View>
        )}

        {/* Map */}
        {hospitalPin ? (
          <LiveMapView
            hospital={hospitalPin}
            doctors={doctorPins}
            rangeKm={selectedRange}
            isSatellite={isSatellite}
            onToggleSatellite={() => setIsSatellite(v => !v)}
            onRefresh={handleRefresh}
          />
        ) : !loading ? (
          <View style={styles.mapLoading}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : null}

        {/* Floating hospital bar — bottom of map */}
        {hospital && (
          <View style={styles.floatingBar}>
            <View style={styles.floatingBarInner}>
              <View style={styles.hospitalIconBox}>
                <Text style={styles.hospitalEmoji}>🏥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hospitalName} numberOfLines={1}>{hospital.name}</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
          <Text style={styles.legendLabel}>Hospital</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
          <Text style={styles.legendLabel}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FB8C00' }]} />
          <Text style={styles.legendLabel}>Busy</Text>
        </View>
        <Text style={styles.countText}>
          {availableCount} available · {doctors.length} total in {selectedRange} km
        </Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#F5F7FA' },
  mapWrapper: { width: '100%', position: 'relative', overflow: 'hidden' },

  // ── Controls overlay — hugs top-right corner ──
  controlsOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Satellite button — 36×36 icon only
  satBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexShrink: 0,
  },
  satIcon: { fontSize: 17 },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center', zIndex: 500,
  },
  loadingText: { marginTop: 10, color: '#1565C0', fontWeight: '600', fontSize: 14 },
  mapLoading:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD' },

  floatingBar: {
    position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 999,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  floatingBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(21,101,192,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 16,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any)
      : {}),
  },
  hospitalIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hospitalEmoji: { fontSize: 20 },
  hospitalName:  { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69F0AE' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#69F0AE', letterSpacing: 1 },

  legend: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 13, color: '#555' },
  countText:   { marginLeft: 'auto' as any, fontSize: 12, fontWeight: '600', color: '#1565C0' },
  errorText:   { color: '#C62828', textAlign: 'center', padding: 12, fontSize: 13 },
});

// ── Native bottom-sheet picker styles ─────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    height: 36,
    // Fixed width so it doesn't push siblings off screen
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  triggerText: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },
  chevron:     { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '65%', paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sheetClose: { fontSize: 18, color: '#6B7280', padding: 4 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  itemActive:     { backgroundColor: '#EFF6FF' },
  itemText:       { fontSize: 14, color: '#374151' },
  itemTextActive: { color: '#1565C0', fontWeight: '600' },
});