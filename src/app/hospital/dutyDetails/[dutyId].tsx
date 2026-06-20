import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  dutySubType?: string;
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
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      coordinates?: { latitude: number; longitude: number };
    };
  };
  hospitalLocation?: {
    latitude: number;
    longitude: number;
    address: { currentAddress: string; city: string; state: string; pincode: string };
  };
  assignedTo?: {
    fullName?: string;
    user?: { name: string };
    phoneNumber?: string;
    profilePicture?: { s3Key?: string; url?: string };
    coordinates?: {
      coordinates?: { latitude: number; longitude: number };
    };
  };
  review?: { rating: number; review: string; reviewedAt: string };
  statusHistory?: { status: string; timestamp: string; reason: string }[];
  completedAt?: string;
  assignedAt?: string;
}

// ─── Constants ────────────────────────────────────────────
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Available' },
  assigned: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Assigned' },
  enroute: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'En Route' },
  'in-progress': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6', label: 'In Progress' },
  completed: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Cancelled' },
};

const URGENCY_CONFIG: Record<string, { bg: string; text: string }> = {
  low: { bg: '#D1FAE5', text: '#065F46' },
  medium: { bg: '#DBEAFE', text: '#1E40AF' },
  high: { bg: '#FEF3C7', text: '#92400E' },
  emergency: { bg: '#FEE2E2', text: '#991B1B' },
};

// ─── Helpers ──────────────────────────────────────────────
function formatRole(role: string) {
  return ROLE_LABELS[role] || role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Map HTML ─────────────────────────────────────────────
function buildMapHTML(hospLat: number, hospLng: number, staffLat?: number, staffLng?: number) {
  const hasStaff = staffLat != null && staffLng != null;
  const routeScript = hasStaff ? `
    fetch('https://router.project-osrm.org/route/v1/driving/${staffLng},${staffLat};${hospLng},${hospLat}?overview=full&geometries=geojson')
      .then(r=>r.json()).then(data=>{
        if(data.routes&&data.routes[0]){
          L.geoJSON(data.routes[0].geometry,{style:{color:'#EF4444',weight:4,opacity:0.85}}).addTo(map);
          var c=data.routes[0].geometry.coordinates;
          map.fitBounds(L.latLngBounds(c.map(function(x){return[x[1],x[0]];})),{padding:[40,40]});
        }
      }).catch(function(){
        L.polyline([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{color:'#EF4444',weight:3,dashArray:'8 4'}).addTo(map);
        map.fitBounds([[${staffLat},${staffLng}],[${hospLat},${hospLng}]],{padding:[40,40]});
      });
    L.marker([${staffLat},${staffLng}],{icon:L.divIcon({html:'<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',iconSize:[14,14],className:''})}).addTo(map).bindPopup('<b>Staff Location</b>');
  ` : '';
  return `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden}#map{width:100vw;height:100vh}.leaflet-control-attribution{display:none}</style>
  </head><body><div id="map"></div><script>
  var map=L.map('map',{zoomControl:true}).setView([${hospLat},${hospLng}],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  L.marker([${hospLat},${hospLng}],{icon:L.divIcon({html:'<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',iconSize:[16,16],className:''})}).addTo(map).bindPopup('<b>Hospital Location</b>');
  ${routeScript}
  </script></body></html>`;
}

// ─── Map component ────────────────────────────────────────
function DutyMap({ hospLat, hospLng, staffLat, staffLng, height }: {
  hospLat: number; hospLng: number; staffLat?: number; staffLng?: number; height: number;
}) {
  const html = buildMapHTML(hospLat, hospLng, staffLat, staffLng);
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <iframe srcDoc={html} style={{ width: '100%', height, border: 'none', display: 'block' }} title="Map" />
    );
  }
  try {
    const { WebView } = require('react-native-webview');
    return (
      <View style={{ width: '100%', height }}>
        <WebView source={{ html }} style={{ flex: 1 }} scrollEnabled={false} originWhitelist={['*']} javaScriptEnabled />
      </View>
    );
  } catch {
    return (
      <View style={[mobileS.mapPlaceholder, { height }]}>
        <Ionicons name="map-outline" size={28} color="#9CA3AF" />
        <Text style={mobileS.placeholderText}>Install react-native-webview to view map</Text>
      </View>
    );
  }
}

// ─── Shared sub-components ────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: status };
  return (
    <View style={[sharedS.badge, { backgroundColor: cfg.bg }]}>
      <View style={[sharedS.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[sharedS.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={i <= rating ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </View>
  );
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[sharedS.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[sharedS.avatarText, { fontSize: size * 0.38 }]}>{name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

// ─── MOBILE layout ────────────────────────────────────────
function MobileLayout({ duty, dutyId, router }: { duty: DutyDetail; dutyId: string; router: any }) {
  const hospLat = duty.hospital?.coordinates?.coordinates?.latitude;
  const hospLng = duty.hospital?.coordinates?.coordinates?.longitude;
  const staffLat = duty.assignedTo?.coordinates?.coordinates?.latitude;
  const staffLng = duty.assignedTo?.coordinates?.coordinates?.longitude;
  const hasMap = hospLat != null && hospLng != null;
  const staffName = duty.assignedTo?.fullName ?? duty.assignedTo?.user?.name ?? 'Staff';
  const urgencyCfg = URGENCY_CONFIG[duty.urgency] ?? { bg: '#F3F4F6', text: '#374151' };
  const showSubType = duty.staffRole === 'rmo' && !!duty.dutySubType;

  return (
    <ScrollView style={mobileS.scroll} contentContainerStyle={mobileS.content} showsVerticalScrollIndicator={false}>
      {/* Page header */}
      <View style={mobileS.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={mobileS.pageTitle}>Duty Details</Text>
          <Text style={mobileS.pageSubtitle}>Review operational requirements for the assigned clinical duty.</Text>
        </View>
        <TouchableOpacity
          style={mobileS.editBtn}
          onPress={() => router.push({ pathname: '/hospital/create-duty', params: { dutyId, mode: 'edit' } })}
          activeOpacity={0.8}
        >
          <Text style={mobileS.editBtnText}>Edit Duty</Text>
        </TouchableOpacity>
      </View>

      {/* ── Card 1: Role + Status ── */}
      <View style={mobileS.card}>
        <View style={mobileS.roleRow}>
          <View style={mobileS.roleIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mobileS.roleTitle}>{formatRole(duty.staffRole)}</Text>
            <Text style={mobileS.hospitalName}>{duty.hospital?.hospitalLegalName ?? '—'}</Text>
          </View>
        </View>
        <View style={mobileS.badgeRow}>
          {duty.isOvernightDuty && (
            <View style={mobileS.overnightBadge}>
              <Ionicons name="moon-outline" size={11} color="#2563EB" />
              <Text style={mobileS.overnightText}>Overnight</Text>
            </View>
          )}
          <StatusBadge status={duty.status} />
        </View>
      </View>

      {/* ── Card 2: Date & Time ── */}
      <View style={mobileS.card}>
        <Text style={mobileS.sectionLabel}>Schedule</Text>
        <View style={mobileS.grid2}>
          <View style={mobileS.gridCell}>
            <Text style={mobileS.cellLabel}>Start Date</Text>
            <View style={mobileS.cellValueRow}>
              <Ionicons name="calendar-outline" size={13} color="#6B7280" />
              <Text style={mobileS.cellValue}>{formatDate(duty.date)}</Text>
            </View>
          </View>
          <View style={mobileS.gridCell}>
            <Text style={mobileS.cellLabel}>End Date</Text>
            <View style={mobileS.cellValueRow}>
              <Ionicons name="calendar-outline" size={13} color="#6B7280" />
              <Text style={mobileS.cellValue}>{formatDate(duty.date)}</Text>
            </View>
          </View>
          <View style={mobileS.gridCell}>
            <Text style={mobileS.cellLabel}>Start Time</Text>
            <View style={mobileS.cellValueRow}>
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text style={mobileS.cellValue}>{formatTime(duty.startTime)}</Text>
            </View>
          </View>
          <View style={mobileS.gridCell}>
            <Text style={mobileS.cellLabel}>End Time</Text>
            <View style={mobileS.cellValueRow}>
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text style={mobileS.cellValue}>{formatTime(duty.endTime)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Card 3: Description + Payment + Priority ── */}
      <View style={mobileS.card}>
        <Text style={mobileS.sectionLabel}>Duty Description</Text>
        <Text style={mobileS.descText}>{duty.description || 'No description provided.'}</Text>
        <View style={mobileS.chipsRow}>
          <View style={mobileS.chip}>
            <Ionicons name="wallet-outline" size={13} color="#2563EB" />
            <Text style={mobileS.chipText}>Total ₹{duty.totalPayment}</Text>
          </View>
          <View style={[mobileS.chip, { backgroundColor: urgencyCfg.bg, borderColor: urgencyCfg.bg }]}>
            <Text style={[mobileS.chipText, { color: urgencyCfg.text }]}>
              {(duty.urgency ?? '').charAt(0).toUpperCase() + (duty.urgency ?? '').slice(1)} Priority
            </Text>
          </View>
        </View>
        {showSubType && (
          <View style={mobileS.chip}>
            <Ionicons name="git-branch-outline" size={13} color="#2563EB" />
            <Text style={mobileS.chipText}>{duty.dutySubType!.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* ── Card 4: Map ── */}
      {hasMap ? (
        <View style={mobileS.mapCard}>
          <DutyMap hospLat={hospLat!} hospLng={hospLng!} staffLat={staffLat} staffLng={staffLng} height={200} />
          <View style={mobileS.locationBar}>
            <View style={{ flex: 1 }}>
              <Text style={mobileS.locationTitle}>Location Details</Text>
              <Text style={mobileS.locationAddr} numberOfLines={2}>
                {[duty.hospital?.currentAddress, duty.hospital?.city, duty.hospital?.state, duty.hospital?.pincode].filter(Boolean).join(', ')}
              </Text>
            </View>
            {duty.distanceText ? <Text style={mobileS.distanceText}>{duty.distanceText}</Text> : null}
          </View>
        </View>
      ) : (
        <View style={[mobileS.mapCard, mobileS.mapPlaceholder, { height: 120 }]}>
          <Ionicons name="location-outline" size={28} color="#9CA3AF" />
          <Text style={mobileS.placeholderText}>Location not available</Text>
        </View>
      )}

      {/* ── Card 5: Assigned Staff ── */}
      {duty.assignedTo && (
        <View style={mobileS.card}>
          <Text style={mobileS.sectionLabel}>Assigned Staff</Text>
          <View style={mobileS.staffRow}>
            <Avatar name={staffName} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={mobileS.staffName}>{staffName}</Text>
              {duty.assignedAt && <Text style={mobileS.staffSub}>Assigned {formatDate(duty.assignedAt)}</Text>}
            </View>
            {duty.review?.rating ? (
              <View style={mobileS.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={mobileS.ratingText}>{duty.review.rating}.0</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Card 6: Review ── */}
      {duty.review && (
        <View style={mobileS.card}>
          <Text style={mobileS.sectionLabel}>Review</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Stars rating={duty.review.rating} />
            <Text style={mobileS.ratingNum}>{duty.review.rating}.0</Text>
          </View>
          {duty.review.review ? <Text style={mobileS.reviewText}>"{duty.review.review}"</Text> : null}
        </View>
      )}

      {/* ── Card 7: Status History ── */}
      {duty.statusHistory && duty.statusHistory.length > 0 && (
        <View style={mobileS.card}>
          <Text style={mobileS.sectionLabel}>Status History</Text>
          {duty.statusHistory.map((h, i) => {
            const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151', label: h.status };
            const isLast = i === duty.statusHistory!.length - 1;
            return (
              <View key={i} style={mobileS.historyRow}>
                <View style={mobileS.timeline}>
                  <View style={[mobileS.dot, { backgroundColor: cfg.dot }]} />
                  {!isLast && <View style={mobileS.line} />}
                </View>
                <View style={mobileS.historyContent}>
                  <Text style={[mobileS.historyStatus, { color: cfg.text }]}>{cfg.label}</Text>
                  {h.reason ? <Text style={mobileS.historyReason}>{h.reason}</Text> : null}
                  <Text style={mobileS.historyTime}>
                    {new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── DESKTOP layout ───────────────────────────────────────
function DesktopLayout({ duty, dutyId, router }: { duty: DutyDetail; dutyId: string; router: any }) {
  const hospLat = duty.hospital?.coordinates?.coordinates?.latitude;
  const hospLng = duty.hospital?.coordinates?.coordinates?.longitude;
  const staffLat = duty.assignedTo?.coordinates?.coordinates?.latitude;
  const staffLng = duty.assignedTo?.coordinates?.coordinates?.longitude;
  const hasMap = hospLat != null && hospLng != null;
  const staffName = duty.assignedTo?.fullName ?? duty.assignedTo?.user?.name ?? 'Staff';
  const urgencyCfg = URGENCY_CONFIG[duty.urgency] ?? { bg: '#F3F4F6', text: '#374151' };
  const showSubType = duty.staffRole === 'rmo' && !!duty.dutySubType;

  return (
    <ScrollView style={desktopS.scroll} contentContainerStyle={desktopS.content} showsVerticalScrollIndicator={false}>
      {/* Page header */}
      <View style={desktopS.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={desktopS.pageTitle}>Duty Details</Text>
          <Text style={desktopS.pageSubtitle}>Review specific operational requirements and scheduling parameters for the assigned clinical duty.</Text>
        </View>
        <TouchableOpacity
          style={desktopS.editBtn}
          onPress={() => router.push({ pathname: '/hospital/create-duty', params: { dutyId, mode: 'edit' } })}
          activeOpacity={0.8}
        >
          <Text style={desktopS.editBtnText}>Edit Duty</Text>
        </TouchableOpacity>
      </View>

      {/* Two-column layout */}
      <View style={desktopS.columns}>

        {/* ── LEFT column ── */}
        <View style={desktopS.leftCol}>
          {/* Role header */}
          <View style={desktopS.card}>
            <View style={desktopS.roleRow}>
              <View style={desktopS.roleIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={desktopS.roleTitle}>{formatRole(duty.staffRole)}</Text>
                <Text style={desktopS.hospitalName}>{duty.hospital?.hospitalLegalName ?? '—'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {duty.isOvernightDuty && (
                  <View style={desktopS.overnightBadge}>
                    <Ionicons name="moon-outline" size={11} color="#2563EB" />
                    <Text style={desktopS.overnightText}>Overnight</Text>
                  </View>
                )}
                <StatusBadge status={duty.status} />
              </View>
            </View>

            <View style={desktopS.divider} />

            {/* Date / Time */}
            <View style={desktopS.infoGrid}>
              {[
                { label: 'Start Date:', value: formatDate(duty.date), icon: 'calendar-outline' },
                { label: 'End Date:', value: formatDate(duty.date), icon: 'calendar-outline' },
                { label: 'Start Time:', value: formatTime(duty.startTime), icon: 'time-outline' },
                { label: 'End Time:', value: formatTime(duty.endTime), icon: 'time-outline' },
              ].map(({ label, value, icon }) => (
                <View key={label} style={desktopS.infoCell}>
                  <Text style={desktopS.infoCellLabel}>{label}</Text>
                  <View style={desktopS.infoCellValueRow}>
                    <Ionicons name={icon as any} size={13} color="#6B7280" />
                    <Text style={desktopS.infoCellValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={desktopS.divider} />

            {/* Description */}
            <Text style={desktopS.sectionLabel}>Duty Description</Text>
            <Text style={desktopS.descText}>{duty.description || 'No description provided.'}</Text>

            {/* Chips */}
            <View style={desktopS.chipsRow}>
              <View style={desktopS.chip}>
                <Ionicons name="wallet-outline" size={14} color="#2563EB" />
                <Text style={desktopS.chipText}>Total ₹{duty.totalPayment}</Text>
              </View>
              <View style={[desktopS.chip, { backgroundColor: urgencyCfg.bg, borderColor: urgencyCfg.bg }]}>
                <Text style={[desktopS.chipText, { color: urgencyCfg.text }]}>
                  {(duty.urgency ?? '').charAt(0).toUpperCase() + (duty.urgency ?? '').slice(1)} Priority
                </Text>
              </View>
            </View>

            {/* Review */}
            {duty.review && (
              <>
                <View style={desktopS.divider} />
                <Text style={desktopS.sectionLabel}>Review</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Stars rating={duty.review.rating} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>{duty.review.rating}.0</Text>
                </View>
                {duty.review.review ? (
                  <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19 }}>"{duty.review.review}"</Text>
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* ── RIGHT column ── */}
        <View style={desktopS.rightCol}>
          {/* Map */}
          {hasMap ? (
            <View style={desktopS.mapCard}>
              <DutyMap hospLat={hospLat!} hospLng={hospLng!} staffLat={staffLat} staffLng={staffLng} height={240} />
              <View style={desktopS.locationBar}>
                <View style={{ flex: 1 }}>
                  <Text style={desktopS.locationTitle}>Location Details</Text>
                  <Text style={desktopS.locationAddr} numberOfLines={2}>
                    {[duty.hospital?.currentAddress, duty.hospital?.city, duty.hospital?.state, duty.hospital?.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
                {duty.distanceText ? <Text style={desktopS.distanceText}>{duty.distanceText}</Text> : null}
              </View>
            </View>
          ) : (
            <View style={[desktopS.mapCard, { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
              <Ionicons name="location-outline" size={28} color="#9CA3AF" />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Location not available</Text>
            </View>
          )}

          {/* Staff */}
          {duty.assignedTo && (
            <View style={desktopS.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={staffName} size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={desktopS.staffName}>{staffName}</Text>
                  {duty.assignedAt && <Text style={desktopS.staffSub}>Assigned {formatDate(duty.assignedAt)}</Text>}
                </View>
                {duty.review?.rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{duty.review.rating}.0</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Status history */}
          {duty.statusHistory && duty.statusHistory.length > 0 && (
            <View style={desktopS.card}>
              <Text style={desktopS.sectionLabel}>Status History</Text>
              {duty.statusHistory.map((h, i) => {
                const cfg = STATUS_CONFIG[h.status] ?? { dot: '#9CA3AF', text: '#374151', label: h.status };
                const isLast = i === duty.statusHistory!.length - 1;
                return (
                  <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                    <View style={{ alignItems: 'center', width: 14 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cfg.dot, marginTop: 3 }} />
                      {!isLast && <View style={{ flex: 1, width: 2, backgroundColor: '#E5E7EB', marginTop: 3, marginBottom: -4, minHeight: 20 }} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 14 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: cfg.text, marginBottom: 2 }}>{cfg.label}</Text>
                      {h.reason ? <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 2 }}>{h.reason}</Text> : null}
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────
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
        setDuty(res?.duty ?? res?.data ?? res);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load duty details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [dutyId]);

  if (loading) {
    return (
      <View style={sharedS.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Loading duty details…</Text>
      </View>
    );
  }

  if (error || !duty) {
    return (
      <View style={sharedS.centered}>
        <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        <Text style={{ fontSize: 14, color: '#EF4444', textAlign: 'center', marginTop: 8 }}>{error ?? 'Duty not found.'}</Text>
        <TouchableOpacity style={sharedS.retryBtn} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={sharedS.screen}>
      {/* Back button — always visible */}
      <View style={sharedS.topBar}>
        <TouchableOpacity style={sharedS.backBtn} onPress={() => router.push("/hospital/dashboard")} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={sharedS.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {isMobile
        ? <MobileLayout duty={duty} dutyId={dutyId} router={router} />
        : <DesktopLayout duty={duty} dutyId={dutyId} router={router} />
      }
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────
const sharedS = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 24 },
  retryBtn: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  avatar: { backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
});

// ─── Mobile-specific styles ───────────────────────────────
const mobileS = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingBottom: 24 },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 3 },
  pageSubtitle: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  editBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexShrink: 0 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  roleIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  hospitalName: { fontSize: 12, color: '#6B7280' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overnightBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  overnightText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 10 },

  grid2: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '50%', paddingRight: 12, marginBottom: 12 },
  cellLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  cellValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cellValue: { fontSize: 13, color: '#111827', fontWeight: '600', flexShrink: 1 },

  descText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  mapPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },
  locationBar: { padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locationTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  locationName: { fontSize: 11, color: '#374151', fontWeight: '500', marginBottom: 2 },
  locationAddr: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
  distanceText: { fontSize: 13, fontWeight: '700', color: '#2563EB', flexShrink: 0 },

  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  staffSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  reviewText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19 },

  historyRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  timeline: { alignItems: 'center', width: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 3 },
  line: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginTop: 3, marginBottom: -4, minHeight: 18 },
  historyContent: { flex: 1, paddingBottom: 12 },
  historyStatus: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  historyReason: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 2 },
  historyTime: { fontSize: 11, color: '#9CA3AF' },
});

// ─── Desktop-specific styles ──────────────────────────────
const desktopS = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  editBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, flexShrink: 0 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  leftCol: { flex: 3, minWidth: 320 },
  rightCol: { flex: 2, minWidth: 280, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  roleIconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 3 },
  hospitalName: { fontSize: 13, color: '#6B7280' },
  overnightBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  overnightText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 10 },
  descText: { fontSize: 13, color: '#4B5563', lineHeight: 21, marginBottom: 14 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  infoCell: { width: '50%', paddingRight: 16, marginBottom: 14 },
  infoCellLabel: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 5 },
  infoCellValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoCellValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationBar: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  locationTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 3 },
  locationName: { fontSize: 12, color: '#374151', fontWeight: '500', marginBottom: 2 },
  locationAddr: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
  distanceText: { fontSize: 13, fontWeight: '700', color: '#2563EB', flexShrink: 0 },

  staffName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  staffSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});