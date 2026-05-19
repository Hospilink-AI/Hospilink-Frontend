import React, { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import RangeDropdown from '../../component/cards/hospital/live-tracking/RangeDropdown';
import { dutyAPI } from '../../service/api';
import { DoctorWithDistance, Hospital, NearbyStaffResponse, RangeKm } from '../../types/duty';
import { adaptStaffToDoctor, jitterDuplicates } from '../../utils/distanceDecoder';

const LiveMap = React.lazy(
  () => import('../../component/cards/hospital/live-tracking/LiveMap.web')
);

// Module-level cache — survives Strict Mode remounts
const cache: {
  data: { hospital: Hospital; doctors: DoctorWithDistance[] } | null;
  range: RangeKm | null;
  fetching: boolean;
} = { data: null, range: null, fetching: false };

export default function MapScreen() {
  const [selectedRange, setSelectedRange] = useState<RangeKm>(5);
  const [selectedRole, setSelectedRole] = useState('');
  const [doctors, setDoctors] = useState<DoctorWithDistance[]>([]);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);//this
  const [isSatellite, setIsSatellite] = useState(false);

  const ROLES = [
    { label: 'All Roles', value: '' },
    { label: 'RMO', value: 'rmo' },
    { label: 'DMO', value: 'dmo' },
    { label: 'General Physician', value: 'general_physician' },
    { label: 'Intensivist / ICU', value: 'intensivist' },
    { label: 'Emergency Doctor', value: 'emergency_doctor' },
    { label: 'Anesthetist', value: 'anesthetist' },
    { label: 'Pediatrician', value: 'pediatrician' },
    { label: 'Gynecologist', value: 'gynecologist' },
    { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
    { label: 'General Surgeon', value: 'general_surgeon' },
    { label: 'Radiologist', value: 'radiologist' },
    { label: 'Staff Nurse', value: 'staff_nurse' },
    { label: 'ICU Nurse', value: 'icu_nurse' },
    { label: 'Emergency Nurse', value: 'emergency_nurse' },
    { label: 'Lab Technician', value: 'lab_technician' },
    { label: 'Ward Boy', value: 'ward_boy' },
    { label: 'Pharmacist', value: 'pharmacist' },
    { label: 'Ambulance Driver', value: 'ambulance_driver' },
  ];

  const handleRefresh = () => {
    cache.data = null;
    cache.range = null;
    cache.fetching = false;
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (cache.fetching) return;
    if (cache.range === selectedRange && cache.data) {
      setHospital(cache.data.hospital);
      setDoctors(cache.data.doctors);
      setLoading(false);
      return;
    }

    let cancelled = false;
    cache.fetching = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        // const data: NearbyStaffResponse = await dutyAPI.getNearbyStaff(selectedRange);
        // if (cancelled) return;
        const res = await dutyAPI.getNearbyStaff(selectedRange, selectedRole); // ✅ pass role
        if (cancelled) return;

        const data = res.data;

        // const hospitalData: Hospital = {
        //   id: 'hospital-main',
        //   name: data.hospital.name,
        //   location: {
        //     latitude: data.hospital.location.latitude,
        //     longitude: data.hospital.location.longitude,
        //     address: data.hospital.name,
        //   },
        // };


        const hospitalData: Hospital = {
          id: 'hospital-main',
          name: data.hospital.name,
          location: {
            latitude: data.hospital.location.latitude,
            longitude: data.hospital.location.longitude,
            address: data.hospital.hospital?.address?.currentAddress ?? data.hospital.name,
          },
        };
        // const doctorsData = data.staff.map(adaptStaffToDoctor);
        // const doctorsData = jitterDuplicates(data.staff.map(adaptStaffToDoctor));
        const doctorsData = jitterDuplicates(
  data.staff.map(adaptStaffToDoctor)
) as DoctorWithDistance[]; // ✅ explicit cast

        cache.data = { hospital: hospitalData, doctors: doctorsData };
        cache.range = selectedRange;

        setHospital(hospitalData);
        setDoctors(doctorsData);
      } catch (err) {
        if (cancelled) return;
        setError('Failed to load nearby staff. Please try again.');
      } finally {
        cache.fetching = false;
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      cache.fetching = false;
    };
  }, [selectedRange, selectedRole, refreshTrigger]);

  const availableCount = doctors.filter((d) => d.available).length;

  return (

    <View style={styles.screen}>
      {/* Map area */}
      <View style={styles.mapWrapper}>
        {/* <View style={styles.dropdownOverlay}>
          <RangeDropdown selectedRange={selectedRange} onRangeChange={setSelectedRange} />
        </View> */}
        <View style={styles.dropdownOverlay}>
          {/* Role filter */}
          <View style={styles.roleDropdownWrapper}>
            <select
              value={selectedRole}
              onChange={(e: any) => {
                cache.data = null;
                cache.range = null;
                setSelectedRole(e.target.value);
              }}
              style={{
                padding: '8px 12px', borderRadius: 8,
                border: '1px solid #E5E7EB', fontSize: 13,
                fontWeight: '600', backgroundColor: '#fff',
                color: '#374151', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: 8,
                width: '100%',
              }}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </View>
          <RangeDropdown selectedRange={selectedRange} onRangeChange={setSelectedRange} />
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Finding nearby staff...</Text>
          </View>
        )}

        {hospital ? (
          <Suspense fallback={<View style={styles.mapLoading} />}>
            <LiveMap hospital={hospital} doctors={doctors} rangeKm={selectedRange} onRefresh={handleRefresh} isSatellite={isSatellite} onToggleSatellite={() => setIsSatellite(v => !v)} />
          </Suspense>
        ) : !loading ? (
          <View style={styles.mapLoading}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : null}

        {hospital && (
          <View style={styles.floatingBar}>
            <View style={styles.floatingBarInner}>
              <View style={styles.hospitalIconBox}>
                <Text style={styles.hospitalEmoji}>🏥</Text>
              </View>
              <View style={styles.hospitalTextBox}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>

              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Scrollable section */}

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

      {/* <View style={styles.listSection}>
          <Text style={styles.listTitle}>Staff Nearby</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#1565C0" style={{ marginTop: 20 }} />
          ) : doctors.length === 0 && !error ? (
            <Text style={styles.emptyText}>
              No staff found within {selectedRange} km.{'\n'}Try increasing the range.
            </Text>
          ) : (
            doctors.map((doc) => <DoctorCard key={doc.id} doctor={doc} />)
          )}
        </View> */}

    </View>

  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA', paddingRight: 3 },
  mapWrapper: {
    height: 'calc(100vh - 64px)' as any,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  dropdownOverlay: { position: 'absolute', top: 12, right: 12, zIndex: 1000 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center', zIndex: 500,
  },
  loadingText: { marginTop: 10, color: '#1565C0', fontWeight: '600', fontSize: 14 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2FD' },
  floatingBar: {
    position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 999,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  floatingBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(21, 101, 192, 0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 16,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    } as any),
  },
  hospitalIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  roleDropdownWrapper: { marginBottom: 4, minWidth: 180 },
  hospitalEmoji: { fontSize: 20 },
  hospitalTextBox: { flex: 1 },
  hospitalName: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69F0AE' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#69F0AE', letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  legend: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 13, color: '#555' },
  countText: { marginLeft: 'auto' as any, fontSize: 12, fontWeight: '600', color: '#1565C0' },
  listSection: { paddingHorizontal: 16, paddingTop: 16 },
  listTitle: { fontSize: 17, fontWeight: '700', color: '#1A237E', marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 24, lineHeight: 22 },
  errorText: { color: '#C62828', textAlign: 'center', padding: 12, fontSize: 13 },
});