import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminAPI } from '@/service/api';
import { useTrackingReceiver } from '@/hooks/useTrackingReceiver';
import { jitterDuplicates } from '@/utils/distanceDecoder'; 

// ── Leaflet icon setup ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const hospitalIcon = L.divIcon({
  className: '',
  html: `<div style="background:#E53935;border-radius:50% 50% 50% 0;
    width:38px;height:38px;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:17px;">🏥</span>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

const staffIcon = L.divIcon({
  className: '',
  html: `<div style="background:#43A047;border-radius:50% 50% 50% 0;
    width:30px;height:30px;transform:rotate(-45deg);
    border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:14px;">👨‍⚕️</span>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32],
});

// ── Constants ─────────────────────────────────────────────────────────────────
const DISTANCE_OPTIONS = [
  { label: '5 km',   value: 5   },
  { label: '10 km',  value: 10  },
  { label: '15 km',  value: 15  },
  { label: '20 km',  value: 20  },
  { label: '25 km',  value: 25  },
  { label: '30 km',  value: 30  },
  { label: '35 km',  value: 35  },
  { label: '50 km',  value: 50  },
  { label: '100 km', value: 100 },
];

const ROLES = [
  { label: 'All Roles',                    value: ''                  },
  { label: 'RMO (Resident Medical Officer)', value: 'rmo'             },
  { label: 'Duty Medical Officer (DMO)',    value: 'dmo'              },
  { label: 'General Physician',             value: 'general_physician'},
  { label: 'Intensivist / ICU Doctor',      value: 'intensivist'      },
  { label: 'Emergency Medicine Doctor',     value: 'emergency_doctor' },
  { label: 'Anesthetist',                   value: 'anesthetist'      },
  { label: 'Pediatrician (NICU/PICU)',      value: 'pediatrician'     },
  { label: 'Gynecologist (On-call)',         value: 'gynecologist'     },
  { label: 'Orthopedic Surgeon',            value: 'orthopedic_surgeon'},
  { label: 'General Surgeon',               value: 'general_surgeon'  },
  { label: 'Radiologist',                   value: 'radiologist'      },
  { label: 'Pathologist',                   value: 'pathologist'      },
  { label: 'Staff Nurse (Ward)',             value: 'staff_nurse'      },
  { label: 'ICU Nurse',                     value: 'icu_nurse'        },
  { label: 'Emergency Nurse',               value: 'emergency_nurse'  },
  { label: 'OT Nurse',                      value: 'ot_nurse'         },
  { label: 'Dialysis Nurse',                value: 'dialysis_nurse'   },
  { label: 'NICU / PICU Nurse',             value: 'nicu_nurse'       },
  { label: 'Lab Technician',                value: 'lab_technician'   },
  { label: 'Radiology Technician',          value: 'radiology_technician' },
  { label: 'OT Technician',                 value: 'ot_technician'    },
  { label: 'Dialysis Technician',           value: 'dialysis_technician' },
  { label: 'Cath Lab Technician',           value: 'cath_lab_technician' },
  { label: 'ICU Technician',                value: 'icu_technician'   },
  { label: 'Ward Boy',                      value: 'ward_boy'         },
  { label: 'Ayah / Female Attendant',       value: 'ayah'             },
  { label: 'OPD Attendant',                 value: 'opd_attendant'    },
  { label: 'Emergency Attendant',           value: 'emergency_attendant' },
  { label: 'Patient Care Taker',            value: 'patient_care_taker' },
  { label: 'Pharmacist',                    value: 'pharmacist'       },
  { label: 'Pharmacy Assistant',            value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer',           value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff',            value: 'housekeeping_staff' },
  { label: 'Security Guard',                value: 'security_guard'   },
  { label: 'Ambulance Driver',              value: 'ambulance_driver' },
  { label: 'Receptionist',                  value: 'receptionist'     },
  { label: 'Billing Executive',             value: 'billing_executive'},
  { label: 'Medical Records Staff',         value: 'medical_records_staff' },
  { label: 'HR & Accounts',                 value: 'hr_accounts'      },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Hospital { _id?: string; id?: string; name: string; location: string; }

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  distanceText: string;
  location: { latitude: number; longitude: number };
}

// ── Custom Dropdown ───────────────────────────────────────────────────────────
const CustomDropdown = ({ value, options, onSelect, placeholder, isPrimary = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdownTrigger, isPrimary && styles.dropdownTriggerPrimary]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.dropdownTriggerText, isPrimary && styles.dropdownTriggerTextPrimary]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={[styles.dropdownChevron, isPrimary && styles.dropdownChevronPrimary]}>▼</Text>
      </TouchableOpacity>
      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdownList}>
            <FlatList
              data={options}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dropdownOption} onPress={() => { onSelect(item); setIsOpen(false); }}>
                  <Text style={styles.dropdownOptionText}>{item.label || item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function StaffTrackingDashboard() {
  const [hospitals, setHospitals]             = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedRole, setSelectedRole]       = useState(ROLES[0]);
  const [selectedDistance, setSelectedDistance] = useState(DISTANCE_OPTIONS[1]);
  const [hospitalCoords, setHospitalCoords]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [staff, setStaff]                     = useState<StaffMember[]>([]);
  const [isSatellite, setIsSatellite]         = useState(false);
  const [loading, setLoading]                 = useState(false);

  const liveLocations = useTrackingReceiver({
    hospitalId: selectedHospital?._id ?? selectedHospital?.id,
  });

  // ── Fetch hospital list ──
  useEffect(() => {
    adminAPI.getHospitalsList()
      .then((res: any) => {
        if (res.success && res.data.length > 0) setHospitals(res.data);
      })
      .catch((e: any) => console.error('Failed to fetch hospitals', e));
  }, []);

  // ── Fetch nearby staff ──
  useEffect(() => {
    if (!selectedHospital) return;

    const hospitalId = selectedHospital._id ?? selectedHospital.id;
    if (!hospitalId) return;

    setLoading(true);

    adminAPI.getNearbyStaff(hospitalId, selectedDistance.value, selectedRole.value)
      .then((res: any) => {
        if (res.success) {
          const data = res.data.data; // ✅ unwrap the extra .data level

          setHospitalCoords({
            latitude:  data.hospital.location.latitude,
            longitude: data.hospital.location.longitude,
          });

          // ✅ jitter overlapping markers using the shared utility
          setStaff(jitterDuplicates(data.staff || []));
        }
      })
      .catch((e: any) => console.error('Failed to fetch nearby staff', e))
      .finally(() => setLoading(false));
  }, [selectedHospital, selectedRole, selectedDistance]);

  // ── Render ──
  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Staff Location and Monitoring</Text>
          <Text style={styles.subtitle}>Real-time location and monitoring of medical staff for hospitals.</Text>
        </View>
        <View style={styles.headerFilters}>
          <CustomDropdown value={selectedRole.label}        options={ROLES}             onSelect={setSelectedRole}     />
          <CustomDropdown value={selectedHospital?.name}    options={hospitals}          onSelect={setSelectedHospital} placeholder="Select Hospital" />
          <CustomDropdown value={selectedDistance.label}    options={DISTANCE_OPTIONS}   onSelect={setSelectedDistance} isPrimary />
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        {!selectedHospital ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🏥</Text>
            <Text style={styles.placeholderText}>Please select a hospital to view the map and nearby staff.</Text>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Syncing Live Radar...</Text>
              </View>
            )}

            {hospitalCoords && (
              <MapContainer
                key={`${hospitalCoords.latitude}-${hospitalCoords.longitude}-${selectedDistance.value}`}
                center={[hospitalCoords.latitude, hospitalCoords.longitude]}
                zoom={12}
                style={{ width: '100%', height: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution={
                    isSatellite
                      ? 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                      : '&copy; OpenStreetMap'
                  }
                  url={
                    isSatellite
                      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  }
                />

                {/* Radius circle */}
                <Circle
                  center={[hospitalCoords.latitude, hospitalCoords.longitude]}
                  radius={selectedDistance.value * 1000}
                  pathOptions={{ color: '#1565C0', fillColor: '#42A5F5', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                />

                {/* Hospital marker */}
                <Marker position={[hospitalCoords.latitude, hospitalCoords.longitude]} icon={hospitalIcon}>
                  <Popup><strong style={{ color: '#C62828' }}>{selectedHospital?.name}</strong></Popup>
                </Marker>

                {/* Staff markers — coordinates already jittered */}
                {staff.map((person) => (
                  <Marker
                    key={person.id}
                    position={[person.location.latitude, person.location.longitude]}
                    icon={staffIcon}
                  >
                    <Popup>
                      <strong>{person.name}</strong><br />
                      {ROLE_LABELS[person.role] || person.role}<br />
                      <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✅ Available now</span><br />
                      📍 {person.distanceText} away<br />
                      📞 {person.phone}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {/* Satellite / Street toggle */}
            <TouchableOpacity style={styles.satelliteToggle} onPress={() => setIsSatellite(prev => !prev)}>
              <Text style={styles.satelliteToggleText}>
                {isSatellite ? '🗺 Street View' : '🛰 Satellite'}
              </Text>
            </TouchableOpacity>

            {/* Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Hospital</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
                <Text style={styles.legendText}>Available Staff</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Total: {staff.length}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.syncIndicator}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Tracking data updates every 30 seconds.</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:                  { flex: 1, backgroundColor: '#F9FAFB', padding: 24 },
  header:                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 100 },
  title:                   { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle:                { fontSize: 12, color: '#6B7280', marginTop: 4 },
  headerFilters:           { flexDirection: 'row', gap: 12 },
  dropdownContainer:       { position: 'relative', zIndex: 100 },
  dropdownTrigger:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8, maxWidth: 220 },
  dropdownTriggerPrimary:  { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  dropdownTriggerText:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  dropdownTriggerTextPrimary: { color: '#FFFFFF' },
  dropdownChevron:         { fontSize: 10, color: '#6B7280' },
  dropdownChevronPrimary:  { color: '#FFFFFF' },
  modalOverlay:            { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.05)' },
  dropdownList:            { backgroundColor: '#FFF', borderRadius: 8, marginTop: 70, marginRight: 24, width: 250, maxHeight: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownOption:          { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownOptionText:      { fontSize: 13, color: '#111827' },
  mapWrapper:              { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#E5E5E5', position: 'relative', minHeight: 500 },
  placeholderContainer:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  placeholderIcon:         { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  placeholderText:         { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  loadingOverlay:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  loadingText:             { marginTop: 10, fontWeight: '600', color: '#3B82F6' },
  mapLegend:               { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', gap: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  legendItem:              { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:               { width: 8, height: 8, borderRadius: 4 },
  legendText:              { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  footer:                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  syncIndicator:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncDot:                 { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  syncText:                { fontSize: 11, color: '#9CA3AF' },
  satelliteToggle:         { position: 'absolute', top: 12, right: 12, zIndex: 999, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  satelliteToggleText:     { fontSize: 13, fontWeight: '600', color: '#111827' },
});