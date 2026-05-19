import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { dutyAPI } from '../../../service/api'; 

// ─── Types ────────────────────────────────────────────────
interface DutyDetail {
  _id: string;
  staffRole: string;
  date: string;
  startTime: string;
  endTime: string;
  isOvernightDuty: boolean;
  urgency: string;
  description: string;
  offeredRate: number;
  totalPayment: number;
  status: string;
  distance?: number;
  distanceText?: string;
  hospital: {
    hospitalLegalName: string;
    currentAddress: string;
    location?: string;
  };
  hospitalLocation?: {
    latitude: number;
    longitude: number;
    // address: string;
     address: string | {       // ✅ updated here
      currentAddress: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  assignedTo?: {
    fullName?: string;
    user?: { name: string };
    coordinates?: {
      coordinates?: { latitude: number; longitude: number };
    };
  };
  review?: {
    rating: number;
    review: string;
    reviewedAt: string;
  };
  statusHistory?: { status: string; timestamp: string; reason: string }[];
  completedAt?: string;
  assignedAt?: string;
}

// ─── Role label map ───────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  rmo: 'RMO (Resident Medical Officer)',
  dmo: 'Duty Medical Officer (DMO)',
  general_physician: 'General Physician',
  intensivist: 'Intensivist / ICU Doctor',
  emergency_doctor: 'Emergency Medicine Doctor',
  anesthetist: 'Anesthetist',
  pediatrician: 'Pediatrician (NICU/PICU)',
  gynecologist: 'Gynecologist (On-call)',
  orthopedic_surgeon: 'Orthopedic Surgeon',
  general_surgeon: 'General Surgeon',
  radiologist: 'Radiologist',
  pathologist: 'Pathologist',
  staff_nurse: 'Staff Nurse (Ward)',
  icu_nurse: 'ICU Nurse',
  emergency_nurse: 'Emergency Nurse',
  ot_nurse: 'OT Nurse',
  dialysis_nurse: 'Dialysis Nurse',
  nicu_nurse: 'NICU / PICU Nurse',
  lab_technician: 'Lab Technician',
  radiology_technician: 'Radiology Technician',
  ot_technician: 'OT Technician',
  dialysis_technician: 'Dialysis Technician',
  cath_lab_technician: 'Cath Lab Technician',
  icu_technician: 'ICU Technician',
  ward_boy: 'Ward Boy',
  ayah: 'Ayah / Female Attendant',
  opd_attendant: 'OPD Attendant',
  emergency_attendant: 'Emergency Attendant',
  patient_care_taker: 'Patient Care Taker',
  pharmacist: 'Pharmacist',
  pharmacy_assistant: 'Pharmacy Assistant',
  biomedical_engineer: 'Biomedical Engineer',
  housekeeping_staff: 'Housekeeping Staff',
  security_guard: 'Security Guard',
  ambulance_driver: 'Ambulance Driver',
  receptionist: 'Receptionist',
  billing_executive: 'Billing Executive',
  medical_records_staff: 'Medical Records Staff',
  hr_accounts: 'HR & Accounts',
};

function formatRole(role: string) {
  return (
    ROLE_LABELS[role] ||
    role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Status badge config ──────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Available' },
  assigned: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Assigned' },
  enroute: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'En Route' },
  'in-progress': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6', label: 'In Progress' },
  completed: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Cancelled' },
};

// ─── Urgency badge config ─────────────────────────────────
const URGENCY_CONFIG: Record<string, { bg: string; text: string }> = {
  low: { bg: '#D1FAE5', text: '#065F46' },
  medium: { bg: '#DBEAFE', text: '#1E40AF' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  emergency: { bg: '#FEE2E2', text: '#991B1B' },
};

// ─── Map HTML generator ───────────────────────────────────
function buildMapHTML(
  hospLat: number,
  hospLng: number,
  staffLat?: number,
  staffLng?: number,
) {
  const hasStaff = staffLat != null && staffLng != null;

  const routeScript = hasStaff
    ? `
      fetch('https://router.project-osrm.org/route/v1/driving/${staffLng},${staffLat};${hospLng},${hospLat}?overview=full&geometries=geojson')
        .then(r => r.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            L.geoJSON(data.routes[0].geometry, {
              style: { color: '#EF4444', weight: 4, opacity: 0.85 }
            }).addTo(map);
            var coords = data.routes[0].geometry.coordinates;
            map.fitBounds(L.latLngBounds(coords.map(function(c){return[c[1],c[0]];})), { padding: [40,40] });
          }
        })
        .catch(function() {
          L.polyline([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{color:'#EF4444',weight:3,dashArray:'8 4'}).addTo(map);
          map.fitBounds([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{padding:[40,40]});
        });
      var staffIcon = L.divIcon({
        html: '<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
        iconSize:[14,14], className:''
      });
      L.marker([${staffLat},${staffLng}],{icon:staffIcon}).addTo(map).bindPopup('<b>Staff Location</b>');
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{overflow:hidden}
    #map{width:100vw;height:100vh}
    .leaflet-control-attribution{display:none}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map',{zoomControl:true}).setView([${hospLat},${hospLng}],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var hospIcon = L.divIcon({
      html: '<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
      iconSize:[16,16], className:''
    });
    L.marker([${hospLat},${hospLng}],{icon:hospIcon}).addTo(map).bindPopup('<b>Hospital Location</b>');
    ${routeScript}
  </script>
</body>
</html>`;
}

// ─── Cross-platform map component ────────────────────────
function DutyMap({
  hospLat, hospLng, staffLat, staffLng, height,
}: {
  hospLat: number; hospLng: number;
  staffLat?: number; staffLng?: number;
  height: number;
}) {
  const html = buildMapHTML(hospLat, hospLng, staffLat, staffLng);

  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <iframe
        srcDoc={html}
        style={{
          width: '100%',
          height,
          border: 'none',
          borderRadius: 12,
          display: 'block',
        }}
        title="Duty Location Map"
      />
    );
  }

  // Native — requires: expo install react-native-webview
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { WebView } = require('react-native-webview');
    return (
      <WebView
        source={{ html }}
        style={{ width: '100%', height, borderRadius: 12 }}
        scrollEnabled={false}
        originWhitelist={['*']}
      />
    );
  } catch {
    return (
      <View style={[styles.mapPlaceholder, { height }]}>
        <Ionicons name="map-outline" size={32} color="#9CA3AF" />
        <Text style={styles.mapPlaceholderText}>Install react-native-webview to view map</Text>
      </View>
    );
  }
}

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

// ─── Info row (label + icon + value) ─────────────────────
function InfoCell({
  label, value, icon,
}: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoCellLabel}>{label}</Text>
      <View style={styles.infoCellValueRow}>
        <Ionicons name={icon as any} size={13} color="#6B7280" />
        <Text style={styles.infoCellValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Rating stars ─────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────
export default function DutyDetailsScreen() {
  const router = useRouter();
  const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [duty, setDuty] = useState<DutyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dutyId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await dutyAPI.getDuty(dutyId);
        // API returns { success, duty } — handle both shapes
        const d = res?.duty ?? res?.data ?? res;
        setDuty(d);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load duty details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [dutyId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading duty details…</Text>
      </View>
    );
  }

  if (error || !duty) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        <Text style={styles.errorText}>{error ?? 'Duty not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Data extraction ──
  const staffName =
    duty.assignedTo?.fullName ?? duty.assignedTo?.user?.name ?? 'Staff';
  const hospLat = duty.hospitalLocation?.latitude;
  const hospLng = duty.hospitalLocation?.longitude;
  const staffLat = duty.assignedTo?.coordinates?.coordinates?.latitude;
  const staffLng = duty.assignedTo?.coordinates?.coordinates?.longitude;
  const hasMap = hospLat != null && hospLng != null;
  const urgencyCfg = URGENCY_CONFIG[duty.urgency] ?? { bg: '#F3F4F6', text: '#374151' };
  const mapHeight = isMobile ? 200 : 240;

  return (
    <View style={styles.screen}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page heading ── */}
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Duty Details</Text>
          <Text style={styles.pageSubtitle}>
            Review specific operational requirements and scheduling parameters for the assigned clinical duty.
          </Text>
        </View>

        {/* ── Two-column (or single on mobile) ── */}
        <View style={[styles.layout, isMobile && styles.layoutMobile]}>

          {/* ──── LEFT card ──── */}
          <View style={[styles.leftCard, isMobile && styles.leftCardMobile]}>

            {/* Header row: role icon + name + hospital + avatar + badges */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.roleIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              </View>

              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{formatRole(duty.staffRole)}</Text>
                <Text style={styles.hospitalSubtitle}>{duty.hospital?.hospitalLegalName ?? '—'}</Text>
              </View>

              <View style={styles.headerRight}>
                {duty.isOvernightDuty && (
                  <View style={styles.overnightBadge}>
                    <Ionicons name="moon-outline" size={11} color="#2563EB" />
                    <Text style={styles.overnightText}>Overnight</Text>
                  </View>
                )}
                <StatusBadge status={duty.status} />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Date / Time grid */}
            <View style={[styles.infoGrid, isMobile && styles.infoGridMobile]}>
              <InfoCell
                label="Start Date:"
                value={formatDate(duty.date)}
                icon="calendar-outline"
              />
              <InfoCell
                label="End Date:"
                value={duty.date ? formatDate(duty.date) : '—'}
                icon="calendar-outline"
              />
              <InfoCell
                label="Start Time:"
                value={formatTime(duty.startTime)}
                icon="time-outline"
              />
              <InfoCell
                label="End Time:"
                value={formatTime(duty.endTime)}
                icon="time-outline"
              />
            </View>

            <View style={styles.divider} />

            {/* Duty Description */}
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>Duty Description</Text>
              <Text style={styles.descText}>{duty.description || 'No description provided.'}</Text>
            </View>

            {/* Extra details row */}
            <View style={[styles.extrasRow, isMobile && styles.extrasRowMobile]}>
              {/* <View style={styles.extraChip}>
                <Ionicons name="cash-outline" size={14} color="#10B981" />
                <Text style={styles.extraChipText}>₹{duty.offeredRate}/hr</Text>
              </View> */}
              <View style={styles.extraChip}>
                <Ionicons name="wallet-outline" size={14} color="#2563EB" />
                <Text style={styles.extraChipText}>Total ₹{duty.totalPayment}</Text>
              </View>
              <View style={[styles.extraChip, { backgroundColor: urgencyCfg.bg }]}>
                <Text style={[styles.extraChipText, { color: urgencyCfg.text }]}>
                  {(duty.urgency ?? '').charAt(0).toUpperCase() + (duty.urgency ?? '').slice(1)} Priority
                </Text>
              </View>
            </View>

            {/* Review (if present) */}
            {duty.review && (
              <>
                <View style={styles.divider} />
                <View style={styles.reviewSection}>
                  <Text style={styles.descLabel}>Review</Text>
                  <View style={styles.reviewRow}>
                    <Stars rating={duty.review.rating} />
                    <Text style={styles.reviewRatingNum}>{duty.review.rating}.0</Text>
                  </View>
                  {duty.review.review ? (
                    <Text style={styles.reviewText}>"{duty.review.review}"</Text>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {/* ──── RIGHT column ──── */}
          <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>

            {/* Map card */}
            {hasMap ? (
              <View style={styles.mapCard}>
                <DutyMap
                  hospLat={hospLat!}
                  hospLng={hospLng!}
                  staffLat={staffLat}
                  staffLng={staffLng}
                  height={mapHeight}
                />

                {/* Location details bar */}
                <View style={styles.locationBar}>
                  <View style={styles.locationBarLeft}>
                    <Text style={styles.locationBarTitle}>Location Details</Text>
                    <Text style={styles.locationBarSub} numberOfLines={2}>
                      {duty.hospital?.hospitalLegalName}
                    </Text>
                    {/* {duty.hospitalLocation?.address ? (
                      <Text style={styles.locationBarAddr} numberOfLines={2}>
                        {duty.hospitalLocation.address}
                      </Text>
                    ) : null} */}
                    {duty.hospitalLocation?.address ? (
                      <Text style={styles.locationBarAddr} numberOfLines={2}>
                        {typeof duty.hospitalLocation.address === 'string'
                          ? duty.hospitalLocation.address
                          : duty.hospitalLocation.address.currentAddress ?? ''}
                      </Text>
                    ) : null}
                  </View>
                  {duty.distanceText ? (
                    <Text style={styles.distanceText}>{duty.distanceText}</Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={[styles.mapCard, styles.mapPlaceholder, { height: mapHeight + 80 }]}>
                <Ionicons name="location-outline" size={32} color="#9CA3AF" />
                <Text style={styles.mapPlaceholderText}>Location not available</Text>
              </View>
            )}

            {/* Assigned staff card */}
            {duty.assignedTo && (
              <View style={styles.staffCard}>
                <View style={styles.staffCardRow}>
                  <Avatar name={staffName} size={48} />
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staffName}</Text>
                    {duty.assignedTo.user?.name && duty.assignedTo.fullName !== duty.assignedTo.user.name ? (
                      <Text style={styles.staffSub}>{duty.assignedTo.user.name}</Text>
                    ) : null}
                    {duty.assignedAt ? (
                      <Text style={styles.staffSub}>
                        Assigned {formatDate(duty.assignedAt)}
                      </Text>
                    ) : null}
                  </View>
                  {duty.review?.rating ? (
                    <View style={styles.staffRating}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.staffRatingText}>{duty.review.rating}.0</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Status history (collapsed on mobile, shown on desktop) */}
            {!isMobile && duty.statusHistory && duty.statusHistory.length > 0 && (
              <View style={styles.historyCard}>
                <Text style={styles.historyTitle}>Status History</Text>
                {duty.statusHistory.map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151' };
                  const isLast = i === duty.statusHistory!.length - 1;
                  return (
                    <View key={i} style={styles.historyRow}>
                      {/* Timeline line + dot */}
                      <View style={styles.historyTimeline}>
                        <View style={[styles.historyDot, { backgroundColor: cfg.dot }]} />
                        {!isLast && <View style={styles.historyLine} />}
                      </View>
                      <View style={styles.historyContent}>
                        <Text style={[styles.historyStatus, { color: cfg.text }]}>
                          {(STATUS_CONFIG[h.status]?.label ?? h.status)}
                        </Text>
                        <Text style={styles.historyReason} numberOfLines={2}>{h.reason}</Text>
                        <Text style={styles.historyTime}>
                          {new Date(h.timestamp).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Status history on mobile (below main content) */}
        {isMobile && duty.statusHistory && duty.statusHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Status History</Text>
            {duty.statusHistory.map((h, i) => {
              const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151' };
              const isLast = i === duty.statusHistory!.length - 1;
              return (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyTimeline}>
                    <View style={[styles.historyDot, { backgroundColor: cfg.dot }]} />
                    {!isLast && <View style={styles.historyLine} />}
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={[styles.historyStatus, { color: cfg.text }]}>
                      {STATUS_CONFIG[h.status]?.label ?? h.status}
                    </Text>
                    <Text style={styles.historyReason} numberOfLines={2}>{h.reason}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(h.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },

  // Loading / error
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F3F4F6', padding: 24 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  // Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
contentMobile: {
  paddingHorizontal: 12,
  width: '100%',
},

  // Heading
  pageHeading: { marginBottom: 18 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

  // Layout
  layout: { flexDirection: 'row', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' },
  layoutMobile: { flexDirection: 'column', width: '100%',gap: 14, },

  // Left card
  leftCard: {
    flex: 3,
    minWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leftCardMobile: { flex: 0, minWidth: 0, width: '100%' , padding: 16,},

  cardHeaderRow: {
     flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 14,
  flexWrap: 'wrap', 
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleInfo: {  flex: 1,
  minWidth: 0,        // ← KEEP THIS
  paddingRight: 6,
  flexShrink: 1,  },
  roleTitle: { fontSize: 16,
  fontWeight: '800',
  color: '#111827',
  marginBottom: 2,
  lineHeight: 22,
  flexWrap: 'wrap', },
  hospitalSubtitle: { fontSize: 13, color: '#6B7280' },

  headerRight: { alignItems: 'flex-end',
  justifyContent: 'flex-start',
  gap: 6, flexShrink: 0},

  // Badges
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  overnightBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  overnightText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginBottom: 4 },
  infoGridMobile: {
  flexDirection: 'column',
},
  infoCell: {
  width: '50%',
  paddingRight: 12,
  marginBottom: 12,
},
infoCellMobile: {
  width: '100%',
  paddingRight: 0,
},
  infoCellLabel: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 5 },
  infoCellValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoCellValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

  // Description
  descSection: { marginBottom: 16 },
  descLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8 },
  descText: { fontSize: 13, color: '#4B5563', lineHeight: 21 },

  // Extras row
  extrasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extrasRowMobile: {},
  extraChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  extraChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Review
  reviewSection: { paddingTop: 4 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reviewRatingNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  reviewText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19 },

  // Right column
  rightCol: { flex: 2, minWidth: 260, gap: 14 },
  rightColMobile: { flex: 0, minWidth: 0, width: '100%', gap: 14 },

  // Map card
 mapCard: {
  backgroundColor: '#fff',
  borderRadius: 14,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  width: '100%',
},
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  mapPlaceholderText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },

  locationBar: {
     flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  locationBarLeft: { flex: 1 },
  locationBarTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 3 },
  locationBarSub: { fontSize: 12, color: '#374151', fontWeight: '500', marginBottom: 2 },
  locationBarAddr: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
  distanceText: { fontSize: 13, fontWeight: '700', color: '#2563EB', flexShrink: 0 },

  // Staff card
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  staffSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  staffRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  staffRatingText: { fontSize: 12, fontWeight: '700', color: '#374151' },

  // Avatar
  avatar: {
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },

  // Status history card
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 14 },
  historyRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  historyTimeline: { alignItems: 'center', width: 14 },
  historyDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 3 },
  historyLine: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginTop: 3, marginBottom: -4, minHeight: 20 },
  historyContent: { flex: 1, paddingBottom: 14 },
  historyStatus: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  historyReason: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 2 },
  historyTime: { fontSize: 11, color: '#9CA3AF' },
});



// import { Ionicons } from '@expo/vector-icons';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   useWindowDimensions,
// } from 'react-native';
// import { dutyAPI } from '../../../service/api';

// // ─── Types ────────────────────────────────────────────────
// interface DutyDetail {
//   _id: string;
//   staffRole: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   isOvernightDuty: boolean;
//   urgency: string;
//   description: string;
//   offeredRate: number;
//   totalPayment: number;
//   status: string;
//   distance?: number;
//   distanceText?: string;
//   hospital: {
//     hospitalLegalName: string;
//     currentAddress: string;
//     location?: string;
//   };
//   hospitalLocation?: {
//     latitude: number;
//     longitude: number;
//     address: string | {
//       currentAddress: string;
//       city: string;
//       state: string;
//       pincode: string;
//     };
//   };
//   assignedTo?: {
//     fullName?: string;
//     user?: { name: string };
//     coordinates?: {
//       coordinates?: { latitude: number; longitude: number };
//     };
//   };
//   review?: {
//     rating: number;
//     review: string;
//     reviewedAt: string;
//   };
//   statusHistory?: { status: string; timestamp: string; reason: string }[];
//   completedAt?: string;
//   assignedAt?: string;
// }

// // ─── Role label map ───────────────────────────────────────
// const ROLE_LABELS: Record<string, string> = {
//   rmo: 'RMO (Resident Medical Officer)',
//   dmo: 'Duty Medical Officer (DMO)',
//   general_physician: 'General Physician',
//   intensivist: 'Intensivist / ICU Doctor',
//   emergency_doctor: 'Emergency Medicine Doctor',
//   anesthetist: 'Anesthetist',
//   pediatrician: 'Pediatrician (NICU/PICU)',
//   gynecologist: 'Gynecologist (On-call)',
//   orthopedic_surgeon: 'Orthopedic Surgeon',
//   general_surgeon: 'General Surgeon',
//   radiologist: 'Radiologist',
//   pathologist: 'Pathologist',
//   staff_nurse: 'Staff Nurse (Ward)',
//   icu_nurse: 'ICU Nurse',
//   emergency_nurse: 'Emergency Nurse',
//   ot_nurse: 'OT Nurse',
//   dialysis_nurse: 'Dialysis Nurse',
//   nicu_nurse: 'NICU / PICU Nurse',
//   lab_technician: 'Lab Technician',
//   radiology_technician: 'Radiology Technician',
//   ot_technician: 'OT Technician',
//   dialysis_technician: 'Dialysis Technician',
//   cath_lab_technician: 'Cath Lab Technician',
//   icu_technician: 'ICU Technician',
//   ward_boy: 'Ward Boy',
//   ayah: 'Ayah / Female Attendant',
//   opd_attendant: 'OPD Attendant',
//   emergency_attendant: 'Emergency Attendant',
//   patient_care_taker: 'Patient Care Taker',
//   pharmacist: 'Pharmacist',
//   pharmacy_assistant: 'Pharmacy Assistant',
//   biomedical_engineer: 'Biomedical Engineer',
//   housekeeping_staff: 'Housekeeping Staff',
//   security_guard: 'Security Guard',
//   ambulance_driver: 'Ambulance Driver',
//   receptionist: 'Receptionist',
//   billing_executive: 'Billing Executive',
//   medical_records_staff: 'Medical Records Staff',
//   hr_accounts: 'HR & Accounts',
// };

// function formatRole(role: string) {
//   return (
//     ROLE_LABELS[role] ||
//     role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
//   );
// }

// function formatDate(iso: string) {
//   if (!iso) return '—';
//   return new Date(iso).toLocaleDateString('en-US', {
//     month: 'long',
//     day: 'numeric',
//     year: 'numeric',
//   });
// }

// function formatTime(t: string) {
//   if (!t) return '—';
//   const [h, m] = t.split(':').map(Number);
//   const ampm = h >= 12 ? 'PM' : 'AM';
//   const hour = h % 12 || 12;
//   return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
// }

// const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
//   available:    { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Available' },
//   assigned:     { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Assigned' },
//   enroute:      { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'En Route' },
//   'in-progress':{ bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6', label: 'In Progress' },
//   completed:    { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Completed' },
//   cancelled:    { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Cancelled' },
// };

// const URGENCY_CONFIG: Record<string, { bg: string; text: string }> = {
//   low:       { bg: '#D1FAE5', text: '#065F46' },
//   medium:    { bg: '#DBEAFE', text: '#1E40AF' },
//   high:      { bg: '#FEF3C7', text: '#92400E' },
//   emergency: { bg: '#FEE2E2', text: '#991B1B' },
// };

// function buildMapHTML(hospLat: number, hospLng: number, staffLat?: number, staffLng?: number) {
//   const hasStaff = staffLat != null && staffLng != null;
//   const routeScript = hasStaff
//     ? `
//       fetch('https://router.project-osrm.org/route/v1/driving/${staffLng},${staffLat};${hospLng},${hospLat}?overview=full&geometries=geojson')
//         .then(r => r.json())
//         .then(data => {
//           if (data.routes && data.routes[0]) {
//             L.geoJSON(data.routes[0].geometry, {
//               style: { color: '#EF4444', weight: 4, opacity: 0.85 }
//             }).addTo(map);
//             var coords = data.routes[0].geometry.coordinates;
//             map.fitBounds(L.latLngBounds(coords.map(function(c){return[c[1],c[0]];})), { padding: [40,40] });
//           }
//         })
//         .catch(function() {
//           L.polyline([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{color:'#EF4444',weight:3,dashArray:'8 4'}).addTo(map);
//           map.fitBounds([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{padding:[40,40]});
//         });
//       var staffIcon = L.divIcon({
//         html: '<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
//         iconSize:[14,14], className:''
//       });
//       L.marker([${staffLat},${staffLng}],{icon:staffIcon}).addTo(map).bindPopup('<b>Staff Location</b>');
//     `
//     : '';

//   return `<!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width,initial-scale=1">
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//   <style>
//     *{margin:0;padding:0;box-sizing:border-box}
//     body{overflow:hidden}
//     #map{width:100vw;height:100vh}
//     .leaflet-control-attribution{display:none}
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//     var map = L.map('map',{zoomControl:true}).setView([${hospLat},${hospLng}],13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
//     var hospIcon = L.divIcon({
//       html: '<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
//       iconSize:[16,16], className:''
//     });
//     L.marker([${hospLat},${hospLng}],{icon:hospIcon}).addTo(map).bindPopup('<b>Hospital Location</b>');
//     ${routeScript}
//   </script>
// </body>
// </html>`;
// }

// function DutyMap({ hospLat, hospLng, staffLat, staffLng, height }: { hospLat: number; hospLng: number; staffLat?: number; staffLng?: number; height: number }) {
//   const html = buildMapHTML(hospLat, hospLng, staffLat, staffLng);

//   if (Platform.OS === 'web') {
//     return (
//       // @ts-ignore
//       <iframe
//         srcDoc={html}
//         style={{ width: '100%', height, border: 'none', borderRadius: 12, display: 'block' }}
//         title="Duty Location Map"
//       />
//     );
//   }

//   try {
//     const { WebView } = require('react-native-webview');
//     return (
//       <WebView
//         source={{ html }}
//         style={{ width: '100%', height, borderRadius: 12 }}
//         scrollEnabled={false}
//         originWhitelist={['*']}
//       />
//     );
//   } catch {
//     return (
//       <View style={[styles.mapPlaceholder, { height }]}>
//         <Ionicons name="map-outline" size={32} color="#9CA3AF" />
//         <Text style={styles.mapPlaceholderText}>Install react-native-webview to view map</Text>
//       </View>
//     );
//   }
// }

// function Avatar({ name, size = 44 }: { name: string; size?: number }) {
//   const initial = name ? name.charAt(0).toUpperCase() : '?';
//   return (
//     <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
//       <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
//     </View>
//   );
// }

// function InfoCell({ label, value, icon, mobile }: { label: string; value: string; icon: string; mobile?: boolean }) {
//   return (
//     <View style={[styles.infoCell, mobile && styles.infoCellMobile]}>
//       <Text style={styles.infoCellLabel}>{label}</Text>
//       <View style={styles.infoCellValueRow}>
//         <Ionicons name={icon as any} size={13} color="#6B7280" />
//         <Text style={styles.infoCellValue}>{value}</Text>
//       </View>
//     </View>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const cfg = STATUS_CONFIG[status] || { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: status };
//   return (
//     <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
//       <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
//       <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
//     </View>
//   );
// }

// function Stars({ rating }: { rating: number }) {
//   return (
//     <View style={{ flexDirection: 'row', gap: 2 }}>
//       {[1, 2, 3, 4, 5].map(i => (
//         <Ionicons
//           key={i}
//           name={i <= rating ? 'star' : 'star-outline'}
//           size={14}
//           color={i <= rating ? '#F59E0B' : '#D1D5DB'}
//         />
//       ))}
//     </View>
//   );
// }

// export default function DutyDetailsScreen() {
//   const router = useRouter();
//   const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
//   const { width } = useWindowDimensions();
//   const isMobile = width < 768;

//   const [duty, setDuty] = useState<DutyDetail | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!dutyId) return;
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await dutyAPI.getDuty(dutyId);
//         const d = res?.duty ?? res?.data ?? res;
//         setDuty(d);
//       } catch (err: any) {
//         setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load duty details.');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [dutyId]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text style={styles.loadingText}>Loading duty details…</Text>
//       </View>
//     );
//   }

//   if (error || !duty) {
//     return (
//       <View style={styles.centered}>
//         <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
//         <Text style={styles.errorText}>{error ?? 'Duty not found.'}</Text>
//         <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
//           <Text style={styles.retryBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const staffName = duty.assignedTo?.fullName ?? duty.assignedTo?.user?.name ?? 'Staff';
//   const hospLat = duty.hospitalLocation?.latitude;
//   const hospLng = duty.hospitalLocation?.longitude;
//   const staffLat = duty.assignedTo?.coordinates?.coordinates?.latitude;
//   const staffLng = duty.assignedTo?.coordinates?.coordinates?.longitude;
//   const hasMap = hospLat != null && hospLng != null;
//   const urgencyCfg = URGENCY_CONFIG[duty.urgency] ?? { bg: '#F3F4F6', text: '#374151' };
//   const mapHeight = isMobile ? 200 : 240;

//   return (
//     <View style={styles.screen}>
//       <View style={styles.topBar}>
//         <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
//           <Ionicons name="arrow-back" size={16} color="#6B7280" />
//           <Text style={styles.backText}>Back to Dashboard</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.pageHeading}>
//           <Text style={styles.pageTitle}>Duty Details</Text>
//           <Text style={styles.pageSubtitle}>
//             Review specific operational requirements and scheduling parameters for the assigned clinical duty.
//           </Text>
//         </View>

//         {/* MAIN LAYOUT WRAPPER */}
//         <View style={[styles.layout, isMobile && styles.layoutMobile]}>

//           {/* ──── LEFT MAIN CARD ──── */}
//           <View style={[styles.leftCard, isMobile && styles.leftCardMobile]}>
//             {isMobile ? (
//               <View style={styles.cardHeaderMobile}>
//                 <View style={styles.cardHeaderTopRow}>
//                   <View style={styles.roleIconWrap}>
//                     <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
//                   </View>
//                   <View style={styles.roleInfoMobile}>
//                     <Text style={styles.roleTitle}>{formatRole(duty.staffRole)}</Text>
//                     <Text style={styles.hospitalSubtitle}>{duty.hospital?.hospitalLegalName ?? '—'}</Text>
//                   </View>
//                 </View>
//                 <View style={styles.cardHeaderBadgeRow}>
//                   {duty.isOvernightDuty && (
//                     <View style={styles.overnightBadge}>
//                       <Ionicons name="moon-outline" size={11} color="#2563EB" />
//                       <Text style={styles.overnightText}>Overnight</Text>
//                     </View>
//                   )}
//                   <StatusBadge status={duty.status} />
//                 </View>
//               </View>
//             ) : (
//               <View style={styles.cardHeaderRow}>
//                 <View style={styles.roleIconWrap}>
//                   <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
//                 </View>
//                 <View style={styles.roleInfo}>
//                   <Text style={styles.roleTitle}>{formatRole(duty.staffRole)}</Text>
//                   <Text style={styles.hospitalSubtitle}>{duty.hospital?.hospitalLegalName ?? '—'}</Text>
//                 </View>
//                 <View style={styles.headerRight}>
//                   {duty.isOvernightDuty && (
//                     <View style={styles.overnightBadge}>
//                       <Ionicons name="moon-outline" size={11} color="#2563EB" />
//                       <Text style={styles.overnightText}>Overnight</Text>
//                     </View>
//                   )}
//                   <StatusBadge status={duty.status} />
//                 </View>
//               </View>
//             )}

//             <View style={styles.divider} />

//             <View style={[styles.infoGrid, isMobile && styles.infoGridMobile]}>
//               <InfoCell label="Start Date:" value={formatDate(duty.date)} icon="calendar-outline" mobile={isMobile} />
//               <InfoCell label="End Date:" value={duty.date ? formatDate(duty.date) : '—'} icon="calendar-outline" mobile={isMobile} />
//               <InfoCell label="Start Time:" value={formatTime(duty.startTime)} icon="time-outline" mobile={isMobile} />
//               <InfoCell label="End Time:" value={formatTime(duty.endTime)} icon="time-outline" mobile={isMobile} />
//             </View>

//             <View style={styles.divider} />

//             <View style={styles.descSection}>
//               <Text style={styles.descLabel}>Duty Description</Text>
//               <Text style={styles.descText}>{duty.description || 'No description provided.'}</Text>
//             </View>

//             <View style={[styles.extrasRow, isMobile && styles.extrasRowMobile]}>
//               <View style={styles.extraChip}>
//                 <Ionicons name="wallet-outline" size={14} color="#2563EB" />
//                 <Text style={styles.extraChipText}>Total ₹{duty.totalPayment}</Text>
//               </View>
//               <View style={[styles.extraChip, { backgroundColor: urgencyCfg.bg }]}>
//                 <Text style={[styles.extraChipText, { color: urgencyCfg.text }]}>
//                   {(duty.urgency ?? '').charAt(0).toUpperCase() + (duty.urgency ?? '').slice(1)} Priority
//                 </Text>
//               </View>
//             </View>

//             {duty.review && (
//               <>
//                 <View style={styles.divider} />
//                 <View style={styles.reviewSection}>
//                   <Text style={styles.descLabel}>Review</Text>
//                   <View style={styles.reviewRow}>
//                     <Stars rating={duty.review.rating} />
//                     <Text style={styles.reviewRatingNum}>{duty.review.rating}.0</Text>
//                   </View>
//                   {duty.review.review ? (
//                     <Text style={styles.reviewText}>"{duty.review.review}"</Text>
//                   ) : null}
//                 </View>
//               </>
//             )}
//           </View>

//           {/* ──── RIGHT COLUMN WRAPPER ──── */}
//           <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
//             {hasMap ? (
//               <View style={styles.mapCard}>
//                 <DutyMap
//                   hospLat={hospLat!}
//                   hospLng={hospLng!}
//                   staffLat={staffLat}
//                   staffLng={staffLng}
//                   height={mapHeight}
//                 />
//                 <View style={[styles.locationBar, isMobile && styles.locationBarMobile]}>
//                   <View style={styles.locationBarLeft}>
//                     <Text style={styles.locationBarTitle}>Location Details</Text>
//                     <Text style={styles.locationBarSub}>{duty.hospital?.hospitalLegalName}</Text>
//                     {duty.hospitalLocation?.address ? (
//                       <Text style={styles.locationBarAddr}>
//                         {typeof duty.hospitalLocation.address === 'string'
//                           ? duty.hospitalLocation.address
//                           : duty.hospitalLocation.address.currentAddress ?? ''}
//                       </Text>
//                     ) : null}
//                   </View>
//                   {duty.distanceText ? (
//                     <Text style={styles.distanceText}>{duty.distanceText}</Text>
//                   ) : null}
//                 </View>
//               </View>
//             ) : (
//               <View style={[styles.mapCard, styles.mapPlaceholder, { height: mapHeight + 80 }]}>
//                 <Ionicons name="location-outline" size={32} color="#9CA3AF" />
//                 <Text style={styles.mapPlaceholderText}>Location not available</Text>
//               </View>
//             )}

//             {duty.assignedTo && (
//               <View style={styles.staffCard}>
//                 <View style={styles.staffCardRow}>
//                   <Avatar name={staffName} size={48} />
//                   <View style={styles.staffInfo}>
//                     <Text style={styles.staffName}>{staffName}</Text>
//                     {duty.assignedTo.user?.name && duty.assignedTo.fullName !== duty.assignedTo.user.name ? (
//                       <Text style={styles.staffSub}>{duty.assignedTo.user.name}</Text>
//                     ) : null}
//                     {duty.assignedAt ? (
//                       <Text style={styles.staffSub}>Assigned {formatDate(duty.assignedAt)}</Text>
//                     ) : null}
//                   </View>
//                   {duty.review?.rating ? (
//                     <View style={styles.staffRating}>
//                       <Ionicons name="star" size={13} color="#F59E0B" />
//                       <Text style={styles.staffRatingText}>{duty.review.rating}.0</Text>
//                     </View>
//                   ) : null}
//                 </View>
//               </View>
//             )}

//             {!isMobile && duty.statusHistory && duty.statusHistory.length > 0 && (
//               <View style={styles.historyCard}>
//                 <Text style={styles.historyTitle}>Status History</Text>
//                 {duty.statusHistory.map((h, i) => {
//                   const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151' };
//                   const isLast = i === duty.statusHistory!.length - 1;
//                   return (
//                     <View key={i} style={styles.historyRow}>
//                       <View style={styles.historyTimeline}>
//                         <View style={[styles.historyDot, { backgroundColor: cfg.dot }]} />
//                         {!isLast && <View style={styles.historyLine} />}
//                       </View>
//                       <View style={styles.historyContent}>
//                         <Text style={[styles.historyStatus, { color: cfg.text }]}>
//                           {STATUS_CONFIG[h.status]?.label ?? h.status}
//                         </Text>
//                         <Text style={styles.historyReason}>{h.reason}</Text>
//                         <Text style={styles.historyTime}>
//                           {new Date(h.timestamp).toLocaleString('en-US', {
//                             month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
//                           })}
//                         </Text>
//                       </View>
//                     </View>
//                   );
//                 })}
//               </View>
//             )}
//           </View>
//         </View>

//         {isMobile && duty.statusHistory && duty.statusHistory.length > 0 && (
//           <View style={styles.historyCard}>
//             <Text style={styles.historyTitle}>Status History</Text>
//             {duty.statusHistory.map((h, i) => {
//               const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151' };
//               const isLast = i === duty.statusHistory!.length - 1;
//               return (
//                 <View key={i} style={styles.historyRow}>
//                   <View style={styles.historyTimeline}>
//                     <View style={[styles.historyDot, { backgroundColor: cfg.dot }]} />
//                     {!isLast && <View style={styles.historyLine} />}
//                   </View>
//                   <View style={styles.historyContent}>
//                     <Text style={[styles.historyStatus, { color: cfg.text }]}>
//                       {STATUS_CONFIG[h.status]?.label ?? h.status}
//                     </Text>
//                     <Text style={styles.historyReason}>{h.reason}</Text>
//                     <Text style={styles.historyTime}>
//                       {new Date(h.timestamp).toLocaleString('en-US', {
//                         month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
//                       })}
//                     </Text>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         )}

//         <View style={{ height: 32 }} />
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────
// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: '#F3F4F6' },

//   centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F3F4F6', padding: 24 },
//   loadingText: { fontSize: 14, color: '#6B7280' },
//   errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },
//   retryBtn: { marginTop: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
//   retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

//   topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
//   backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   backText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

//   scroll: { flex: 1 },
//   content: { paddingHorizontal: 20, paddingBottom: 40 },
//   contentMobile: { paddingHorizontal: 12, width: '100%' },

//   pageHeading: { marginBottom: 18 },
//   pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
//   pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

//   /* CRITICAL FIX HERE: 
//     Changed layout from flex-wrap to explicit layout directions.
//     On desktop, it uses explicit row flex without wrapping constraints.
//   */
//   layout: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
//   layoutMobile: { flexDirection: 'column', width: '100%', gap: 14 },

//   leftCard: {
//     flex: 3,
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     padding: 22,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   leftCardMobile: {
//     flex: 0, 
//     width: '100%',
//     padding: 16,
//   },

//   cardHeaderRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     gap: 10,
//     marginBottom: 14,
//   },

//   cardHeaderMobile: {
//     marginBottom: 14,
//     gap: 12,
//   },
//   cardHeaderTopRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 12,
//   },
//   cardHeaderBadgeRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 4,
//   },

//   roleIconWrap: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: '#EFF6FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },

//   roleInfo: {
//     flex: 1,
//     minWidth: 0,
//     paddingRight: 6,
//   },

//   roleInfoMobile: {
//     flex: 1,
//     minWidth: 0,
//   },

//   roleTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#111827',
//     marginBottom: 2,
//     lineHeight: 22,
//   },
//   hospitalSubtitle: { fontSize: 13, color: '#6B7280' },

//   headerRight: {
//     alignItems: 'flex-end',
//     justifyContent: 'flex-start',
//     gap: 6,
//     flexShrink: 0,
//   },

//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 20,
//   },
//   badgeDot: { width: 7, height: 7, borderRadius: 4 },
//   badgeText: { fontSize: 12, fontWeight: '700' },

//   overnightBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     backgroundColor: '#EFF6FF',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 20,
//   },
//   overnightText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

//   divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

//   infoGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   infoGridMobile: {
//     flexDirection: 'column',
//   },
//   infoCell: {
//     width: '50%',
//     paddingRight: 12,
//     marginBottom: 12,
//   },
//   infoCellMobile: {
//     width: '100%',
//     paddingRight: 0,
//     marginBottom: 10,
//   },
//   infoCellLabel: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 5 },
//   infoCellValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   infoCellValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

//   descSection: { marginBottom: 16 },
//   descLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8 },
//   descText: { fontSize: 13, color: '#4B5563', lineHeight: 21 },

//   extrasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//   extrasRowMobile: { marginTop: 4 },
//   extraChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     backgroundColor: '#F9FAFB',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   extraChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

//   reviewSection: { paddingTop: 4 },
//   reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
//   reviewRatingNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
//   reviewText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19 },

//   /* CRITICAL MOBILE FIXES:
//     Removed static minWidths on mobile blocks that caused horizontal scaling failure 
//     and element stacking conflicts.
//   */
//   rightCol: { flex: 2, minWidth: 260, gap: 14 },
//   rightColMobile: { flex: 0, width: '100%', gap: 14 },

//   mapCard: {
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     width: '100%',
//   },
//   mapPlaceholder: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#F9FAFB',
//     gap: 10,
//   },
//   mapPlaceholderText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },

//   locationBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 14,
//     gap: 12,
//   },
//   locationBarMobile: {
//     flexDirection: 'column',
//     alignItems: 'flex-start',
//     gap: 8,
//   },
//   locationBarLeft: { flex: 1, minWidth: 0 },
//   locationBarTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 3 },
//   locationBarSub: { fontSize: 12, color: '#374151', fontWeight: '500', marginBottom: 2 },
//   locationBarAddr: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
//   distanceText: { fontSize: 13, fontWeight: '700', color: '#2563EB', flexShrink: 0 },

//   staffCard: {
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   staffCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   staffInfo: { flex: 1 },
//   staffName: { fontSize: 14, fontWeight: '700', color: '#111827' },
//   staffSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
//   staffRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   staffRatingText: { fontSize: 12, fontWeight: '700', color: '#374151' },

//   avatar: {
//     backgroundColor: '#10B981',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: { color: '#fff', fontWeight: '800' },

//   historyCard: {
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     marginTop: 4,
//   },
//   historyTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 14 },
//   historyRow: { flexDirection: 'row', gap: 12 },
//   historyTimeline: { alignItems: 'center', width: 14 },
//   historyDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 4 },
//   historyLine: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginTop: 4, marginBottom: -4, minHeight: 24 },
//   historyContent: { flex: 1, paddingBottom: 16 },
//   historyStatus: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
//   historyReason: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 2 },
//   historyTime: { fontSize: 11, color: '#9CA3AF' },
// });