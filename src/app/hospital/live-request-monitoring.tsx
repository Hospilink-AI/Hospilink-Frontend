import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dutyAPI } from '@/service/api';
import { decodePolyline } from '@/utils/polylineDecoderA'; // adjust path to your utils
import { useTrackingReceiver } from '@/hooks/useTrackingReceiver'; // adjust path to your hooks

// const isWeb = typeof window !== 'undefined' && !!window.document;

// ─── Tile Sources ─────────────────────────────────────────────────────────────
const STREET_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
};

const SATELLITE_TILE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '© Esri, Maxar, Earthstar Geographics',
};

const NativeMap = Platform.OS !== 'web'
  ? require('./NativeMap').default
  : null;

// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffLocation {
  latitude: number;
  longitude: number;
  lastUpdated: number;
  accuracy: null | number;
  source: string;
}

interface StatusHistoryItem {
  _id: string;
  id: string;
  status: string;
  timestamp: string;
  changedBy: string;
  reason: string;
}

interface RouteMapData {
  staff: {
    name: string;
    email: string;
    mobileNumber: string;
    skills: string[];
    avgRating: number;
    address: string;
    location: StaffLocation;
    totalExperience: number;
    verificationStatus: string;
  };
  duty: {
    dutyId: string;
    dutyRole: string;
    formattedRole: string;
    hospitalName: string;
    startTime: string;
    endTime: string;
    date: string;
    description: string;
    totalPayment: number;
    offeredRate: number;
    status: string;
    urgency: string;
    statusHistory: StatusHistoryItem[];
    assignedAt: string;
    enrouteAt?: string;
    startedAt?: string;
    completedAt?: string | null;
  };
  hospital: {
    id: string;
    name: string;
    address: string;
    location: string;
    coordinates: { latitude: number; longitude: number };
  };
  route: {
    polyline: string;
    stepPolylines: string[];
    distance: number;
    distanceText: string;
    duration: number;
    durationText: string;
    steps: any[];
  };
  tracking: {
    isRealTime: boolean;
    updateInterval: number;
    lastUpdate: number;
    estimatedArrival: string;
    accuracy: null | number;
  };
}

interface RouteMapResponse {
  success: boolean;
  data: RouteMapData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

const formatTime = (isoStringOrMs: string | number): string => {
  const d = typeof isoStringOrMs === 'number'
    ? new Date(isoStringOrMs)
    : new Date(isoStringOrMs);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (isoStringOrMs: string | number): string => {
  const d = typeof isoStringOrMs === 'number'
    ? new Date(isoStringOrMs)
    : new Date(isoStringOrMs);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatETA = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
};

const getTimelineSteps = () => [
  { key: 'available', label: 'Posted', icon: 'checkmark' },
  { key: 'assigned', label: 'Accepted', icon: 'checkmark' },
  { key: 'accepted', label: 'Enroute', icon: 'checkmark' },
  { key: 'enroute', label: 'In Progress', icon: 'car' },
  { key: 'in-progress', label: 'Completed', icon: 'location' },
];

const STATUS_STEP_MAP: Record<string, number> = {
  available: 0,
  assigned: 1,
  enroute: 2,
  'in-progress': 3,
  completed: 4,
};

const getActivityDescription = (item: StatusHistoryItem, staffName: string, hospitalName: string) => {
  const reason = item.reason ?? '';
  if (reason.toLowerCase().includes('hospital') || reason.toLowerCase().includes('created')) {
    return `Admin / ${hospitalName}`;
  }
  return staffName;
};

// ─── WebMap ───────────────────────────────────────────────────────────────────
interface WebMapProps {
  staffLocation: { latitude: number; longitude: number };
  hospitalLocation: { latitude: number; longitude: number };
  routePolylines: string[];
  status: string;
  isSatellite: boolean;
  onToggleSatellite: () => void;
}

const WebMap = ({ staffLocation, hospitalLocation, routePolylines, status, isSatellite,
  onToggleSatellite }: WebMapProps) => {
  // const mapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);


  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = (window as any).L;
      const centerLat = (staffLocation.latitude + hospitalLocation.latitude) / 2;
      const centerLng = (staffLocation.longitude + hospitalLocation.longitude) / 2;

      const map = L.map(mapRef.current!).setView([centerLat, centerLng], 12);
      mapInstanceRef.current = map;

      // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //   attribution: '© OpenStreetMap contributors',
      //   maxZoom: 19,
      // }).addTo(map);

      const tile = isSatellite ? SATELLITE_TILE : STREET_TILE;
      tileLayerRef.current = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: 19,
      }).addTo(map);

      const staffIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:36px;height:36px;background:#3B82F6;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">👤</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const hospitalIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:36px;height:36px;background:#EF4444;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🏥</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([staffLocation.latitude, staffLocation.longitude], { icon: staffIcon })
        .addTo(map)
        .bindPopup(`<b>Staff Location</b>`);

      L.marker([hospitalLocation.latitude, hospitalLocation.longitude], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>Hospital</b>`);

      // ── Draw polyline route ──
      if (routePolylines && routePolylines.length > 0) {
        const allPoints: [number, number][] = [];
        const polylineColor = status === 'in-progress' ? '#10B981' : '#2563EB';

        routePolylines.forEach((encodedPolyline: string) => {
          const points = decodePolyline(encodedPolyline);
          allPoints.push(...points);
          L.polyline(points, {
            color: polylineColor,
            weight: 4,
            opacity: 0.8,
          }).addTo(map);
        });

        // Fit map to the full route extent
        if (allPoints.length > 0) {
          map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
        }
      } else {
        // No polyline — fall back to fitting both markers
        map.fitBounds(
          L.latLngBounds([
            [staffLocation.latitude, staffLocation.longitude],
            [hospitalLocation.latitude, hospitalLocation.longitude],
          ]),
          { padding: [50, 50] }
        );
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [staffLocation, hospitalLocation, routePolylines, status]);

  // ── Swap tile layer when satellite toggles ──────────────────────────────────
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tile = isSatellite ? SATELLITE_TILE : STREET_TILE;
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current.bringToBack(); // keeps markers and route on top
  }, [isSatellite]);

  return (
    // <div
    //   ref={mapRef}
    //   style={{ width: '100%', height: '100%', minHeight: 350, zIndex: 1 }}
    // />

    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 350 }}>
      {/* Map */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 350, zIndex: 1 }} />

      {/* Satellite Toggle Button */}
      <TouchableOpacity
        style={styles.satelliteToggle}
        onPress={onToggleSatellite}
        activeOpacity={0.8}
      >
        <Text style={styles.satelliteToggleText}>
          {isSatellite ? '🗺 Street View' : '🛰 Satellite'}
        </Text>
      </TouchableOpacity>
    </div>

  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveRequestMonitoring() {
  const router = useRouter();
  const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
  const { width } = useWindowDimensions();

  const [routeData, setRouteData] = useState<RouteMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  // ── Fetch ──
  const fetchRouteMap = useCallback(async () => {
    if (!dutyId) {
      setError('No duty ID provided.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data: RouteMapResponse = await dutyAPI.getTrackHospitalStaffLocation(dutyId);
      if (data.success) {
        setRouteData(data.data);
      } else {
        setError('Failed to load duty details.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [dutyId]);

  useEffect(() => {
    fetchRouteMap();
  }, [fetchRouteMap]);

  // ── Derived ──
  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading duty details…</Text>
      </View>
    );
  }

  if (error || !routeData) {
    return (
      <View style={styles.centeredState}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error ?? 'No data found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRouteMap}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { staff, duty, hospital, route: routeInfo, tracking } = routeData;

  const timelineSteps = getTimelineSteps();
  const currentStepIndex = STATUS_STEP_MAP[duty.status] ?? 0;

  const sortedHistory = [...(duty.statusHistory ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const etaDisplay = tracking?.estimatedArrival
    ? formatETA(tracking.estimatedArrival)
    : '--';

  const lastUpdateDisplay = tracking?.lastUpdate
    ? formatTime(tracking.lastUpdate)
    : 'Just Now';

  const isHighPriority = duty.urgency === 'emergency' || duty.urgency === 'urgent';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Header ── */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#1E293B" />
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.headerMainRow}>
          <View>
            <Text style={styles.pageTitle}>Live Request Monitoring</Text>
            <Text style={styles.pageSubtitle}>Real-time tracking</Text>
          </View>
          <View style={styles.headerActions}>
            {isHighPriority && (
              <View style={styles.badgeHighPriority}>
                <Text style={styles.badgeHighPriorityText}>
                  {duty.urgency.charAt(0).toUpperCase() + duty.urgency.slice(1)} Priority
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.btnOutline} activeOpacity={0.8}>
              <Text style={styles.btnOutlineText}>Edit Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.btnDangerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Main Grid ── */}
      <View style={styles.mainGrid}>

        {/* LEFT: Request Details */}
        <View style={styles.leftCol}>
          <View style={styles.detailCard}>
            <Text style={styles.cardSectionTitle}>Request Details</Text>

            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Ionicons name="document-text-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>REQUEST ID</Text>
                <Text style={styles.detailValueBold}>
                  {duty.dutyId.slice(-6).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Ionicons name="business-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>HOSPITAL NAME</Text>
                <Text style={styles.detailValueBold}>{hospital.name}</Text>
                <Text style={styles.detailSub}>
                  {/* {hospital.address.split(',')[0]} */}
                  {hospital.address?.split(',')[0] ?? ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Ionicons name="time-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>SHIFT TIME</Text>
                <Text style={styles.detailValueBold}>
                  {duty.startTime} – {duty.endTime}
                </Text>
                <Text style={styles.detailSub}>
                  Payment: ₹{duty.totalPayment.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Ionicons name="person-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>ROLE REQUIRED</Text>
                <Text style={styles.detailValueBold}>
                  {(duty.formattedRole || duty.dutyRole).toUpperCase()}
                </Text>
                <Text style={styles.detailSub}>
                  Rate: ₹{duty.offeredRate}/hr
                </Text>
              </View>
            </View>

            {/* Distance & Duration from route */}
            {routeInfo && (
              <View style={styles.detailItem}>
                <View style={styles.iconBox}>
                  <Ionicons name="navigate-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailLabel}>ROUTE INFO</Text>
                  <Text style={styles.detailValueBold}>{routeInfo.distanceText}</Text>
                  <Text style={styles.detailSub}>{routeInfo.durationText}</Text>
                </View>
              </View>
            )}

            <View style={styles.shiftNotesWrap}>
              <Text style={styles.detailLabel}>SHIFT NOTES</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  {duty.description?.trim() ||
                    'No specific notes provided for this shift. Please coordinate with the head nurse upon arrival.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CENTER: Map & Timeline */}
        <View style={styles.centerCol}>
          {/* Map Status Bar */}
          <View style={styles.mapStatusTop}>
            <View style={styles.mapStatusLeft}>
              <View style={styles.livePulseDot} />
              <View>
                <Text style={styles.mapStatusTitle}>
                  {duty.status === 'enroute'
                    ? 'Staff Enroute'
                    : duty.status === 'in-progress'
                      ? 'Shift In Progress'
                      : duty.status === 'assigned'
                        ? 'Staff Assigned'
                        : 'Status: ' + duty.status}
                </Text>
                <Text style={styles.mapStatusSub}>
                  ETA {etaDisplay} · {routeInfo?.durationText ?? '--'}
                </Text>
              </View>
            </View>
            <View style={styles.mapStatusRight}>
              <Text style={styles.lastUpdatedLabel}>LAST UPDATED</Text>
              <Text style={styles.lastUpdatedValue}>{lastUpdateDisplay}</Text>
            </View>
          </View>

          <View style={styles.mapWrapper}>
            {/* Map Container */}
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <WebMap
                  staffLocation={{ latitude: staff.location.latitude, longitude: staff.location.longitude }}
                  hospitalLocation={{ latitude: hospital.coordinates.latitude, longitude: hospital.coordinates.longitude }}
                  routePolylines={routeInfo?.stepPolylines ?? []}
                  status={duty.status}
                  isSatellite={isSatellite}
                  onToggleSatellite={() => setIsSatellite(v => !v)}
                />
              ) : NativeMap ? (
                <NativeMap
                  staffLocation={{ latitude: staff.location.latitude, longitude: staff.location.longitude }}
                  hospitalLocation={{ latitude: hospital.coordinates.latitude, longitude: hospital.coordinates.longitude }}
                  routePolylines={routeInfo?.stepPolylines ?? []}
                  status={duty.status}
                  isSatellite={isSatellite}
                  onToggleSatellite={() => setIsSatellite(v => !v)}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator color="#2563EB" />
                </View>
              )}
            </View>
            {/* <View style={styles.mapContainer}>
              {isWeb ? (
                <WebMap
                  staffLocation={{
                    latitude: staff.location.latitude,
                    longitude: staff.location.longitude,
                  }}
                  hospitalLocation={{
                    latitude: hospital.coordinates.latitude,
                    longitude: hospital.coordinates.longitude,
                  }}
                  routePolylines={routeInfo?.stepPolylines ?? []}
                  status={duty.status}
                  isSatellite={isSatellite}
                  onToggleSatellite={() => setIsSatellite(v => !v)}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={36} color="#94A3B8" />
                  <Text style={{ color: '#64748B', marginTop: 8 }}>
                    Map view available on web version
                  </Text>
                </View>
              )}
            </View> */}

            {/* Horizontal Timeline */}
            <View style={styles.horizontalTimeline}>
              <View style={styles.timelineTrackBg} />
              <View
                style={[
                  styles.timelineTrackFill,
                  {
                    width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100
                      }%`,
                  },
                ]}
              />
              {timelineSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <View key={step.key} style={styles.timelineNodeWrap}>
                    <View
                      style={[
                        styles.timelineNode,
                        isCompleted && styles.timelineNodeCompleted,
                        isCurrent && styles.timelineNodeCurrent,
                      ]}
                    >
                      {isCompleted ? (
                        step.icon === 'car' && isCurrent ? (
                          <Ionicons name="car" size={14} color="#fff" />   // white icon on blue bg
                        ) : (
                          <Text style={styles.nodeIconText}>✓</Text>
                        )
                      ) : null}

                    </View>
                    <Text
                      style={[
                        styles.timelineNodeLabel,
                        isCompleted && styles.timelineNodeLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* RIGHT: Staff Profile */}
        <View style={styles.rightCol}>
          <View style={styles.staffCard}>
            {/* Avatar */}
            <View style={styles.staffAvatarWrap}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffInitials}>{getInitials(staff.name)}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.staffProfileName}>{staff.name}</Text>
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedBadgeText}>Accepted Staff</Text>
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {staff.avgRating > 0 ? staff.avgRating.toFixed(1) : 'New'}
              </Text>
              {staff.verificationStatus === 'verified' && (
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              )}
            </View>

            <View style={styles.divider} />

            {/* Skills */}
            <View style={styles.staffSection}>
              <Text style={styles.sectionLabel}>SKILLS</Text>
              <View style={styles.tagsRow}>
                {staff.skills && staff.skills.length > 0 ? (
                  staff.skills.map((skill, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.tagText}>No skills listed</Text>
                )}
              </View>
            </View>

            {/* Contact */}
            <View style={styles.staffSection}>
              <Text style={styles.sectionLabel}>CONTACT INFO</Text>
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color="#475569" />
                <Text style={styles.contactText}>{staff.mobileNumber}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={14} color="#475569" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {staff.email}
                </Text>
              </View>
              {staff.address ? (
                <View style={styles.contactRow}>
                  <Ionicons name="location-outline" size={14} color="#475569" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {staff.address}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.staffActionRow}>
              <TouchableOpacity style={styles.btnMessage} activeOpacity={0.8}>
                <Text style={styles.btnMessageText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCall} activeOpacity={0.8}>
                <Text style={styles.btnCallText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── Live Activity Log ── */}
      <View style={styles.bottomSection}>
        <Text style={styles.activityTitle}>Live Activity Log</Text>
        <View style={styles.activityCard}>
          {sortedHistory.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                No activity recorded yet.
              </Text>
            </View>
          ) : (
            sortedHistory.map((item, idx) => {
              const actor = getActivityDescription(item, staff.name, hospital.name);
              const isLast = idx === sortedHistory.length - 1;

              return (
                <View
                  key={item._id}
                  style={[styles.activityRow, !isLast && styles.activityBorder]}
                >
                  {/* Time column */}
                  <View style={styles.activityTimeCol}>
                    <Text style={styles.activityTime}>
                      {formatTime(item.timestamp)}
                    </Text>
                    <Text style={styles.activityDate}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>

                  {/* Description column */}
                  <View style={styles.activityTextWrap}>
                    <Text style={styles.activityDesc}>
                      <Text style={styles.activityBold}>{actor}</Text>
                      {item.status === 'available' && ' created the shift request.'}
                      {item.status === 'assigned' && ' accepted the shift request.'}
                      {(item.status === 'enroute' ||
                        item.status === 'in-progress' ||
                        item.status === 'completed') && (
                          <Text>
                            {' '}
                            marked status as{' '}
                            <Text style={styles.activityHighlight}>
                              {item.status.toUpperCase()}
                            </Text>
                            .
                          </Text>
                        )}
                    </Text>

                    {/* Sub description */}
                    {item.reason ? (
                      <Text style={styles.activitySubDesc}>{item.reason}</Text>
                    ) : null}
                    {item.status === 'enroute' && (
                      <Text style={styles.activitySubDesc}>
                        Location tracking started via mobile app.
                      </Text>
                    )}
                    {item.status === 'available' && (
                      <Text style={styles.activitySubDesc}>
                        System sent offer to matching candidates.
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity style={styles.viewHistoryBtn} activeOpacity={0.8}>
            <Text style={styles.viewHistoryText}>View Full History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 1600,
    marginHorizontal: 'auto',
    width: '100%',
  },

  satelliteToggle: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  satelliteToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  // States
  centeredState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
  },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Header
  headerArea: { marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  headerMainRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  badgeHighPriority: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  badgeHighPriorityText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6,
  },
  btnOutlineText: { color: '#1E293B', fontSize: 13, fontWeight: '600' },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6,
  },
  btnDangerText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  // Grid
  mainGrid: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' },
  leftCol: { flex: 1, minWidth: 280 },
  centerCol: { flex: 2, minWidth: 280 },
  rightCol: { flex: 1, minWidth: 280 },

  // Detail card
  detailCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  detailItem: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',      // ← add this
    justifyContent: 'center',  // ← add this
  },
  detailTextCol: { flex: 1, justifyContent: 'center' },
  detailLabel: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4,
  },
  detailValueBold: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  detailSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  shiftNotesWrap: { marginTop: 10 },
  notesBox: {
    backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8,
  },
  notesText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  // Map status bar
  mapStatusTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#DBEAFE', paddingHorizontal: 20, paddingVertical: 14,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  mapStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  livePulseDot: { width: 10, height: 10, backgroundColor: '#2563EB', borderRadius: 5 },
  mapStatusTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  mapStatusSub: { fontSize: 12, color: '#60A5FA', marginTop: 2 },
  mapStatusRight: { alignItems: 'flex-end' },
  lastUpdatedLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  lastUpdatedValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },

  // Map
  // mapWrapper: {
  //   flex: 1, minHeight: 500, backgroundColor: '#FFF',
  //   borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  //   borderWidth: 1, borderTopWidth: 0, borderColor: '#E2E8F0',
  //   overflow: 'hidden', flexDirection: 'column',
  // },
  mapWrapper: {
  height: Platform.OS === 'web' ? undefined : 500,
  flex: Platform.OS === 'web' ? 1 : undefined,
  minHeight: 500,
  backgroundColor: '#FFF',
  borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  borderWidth: 1, borderTopWidth: 0, borderColor: '#E2E8F0',
  overflow: 'hidden', flexDirection: 'column',
},
  // mapContainer: { flex: 1, minHeight: 400, position: 'relative', zIndex: 1 },
  mapContainer: { 
  height: Platform.OS === 'web' ? undefined : 400,
  flex: Platform.OS === 'web' ? 1 : undefined,
  minHeight: 400, 
  position: 'relative', 
  zIndex: 1 
},
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Timeline
  horizontalTimeline: {
    position: 'relative', backgroundColor: '#FFF',
    paddingHorizontal: 20, paddingVertical: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderTopWidth: 1, borderColor: '#E2E8F0', zIndex: 2,
  },
  timelineTrackBg: {
    position: 'absolute', height: 4, backgroundColor: '#E2E8F0',
    left: 40, right: 40, top: 34, zIndex: 1,
  },
  timelineTrackFill: {
    position: 'absolute', height: 4, backgroundColor: '#2563EB', left: 40, top: 34, zIndex: 2,
  },
  timelineNodeWrap: { alignItems: 'center', gap: 8, zIndex: 3, width: 60 },
  timelineNode: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF',
    borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  timelineNodeCompleted: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timelineNodeCurrent: {
    // backgroundColor: '#FFF',
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    borderWidth: 3, width: 32, height: 32, marginTop: -4,
  },
  nodeIconText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  timelineNodeLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  timelineNodeLabelActive: { color: '#2563EB' },

  // Staff card
  staffCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 24,
    borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
  },
  staffAvatarWrap: { position: 'relative', marginBottom: 16 },
  staffAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  staffInitials: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4, width: 14, height: 14,
    backgroundColor: '#10B981', borderRadius: 7, borderWidth: 2, borderColor: '#FFF',
  },
  staffProfileName: {
    fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8, textAlign: 'center',
  },
  acceptedBadge: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 12, marginBottom: 12,
  },
  acceptedBadgeText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', width: '100%', marginVertical: 20 },
  staffSection: { width: '100%', marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 0.5, marginBottom: 12,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#F8FAFC', borderWidth: 1,
    borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactText: { fontSize: 13, color: '#1E293B', fontWeight: '500', flex: 1 },
  staffActionRow: { flexDirection: 'row', width: '100%', gap: 12, marginTop: 4 },
  btnMessage: {
    flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10,
    borderRadius: 6, alignItems: 'center',
  },
  btnMessageText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  btnCall: {
    flex: 1, backgroundColor: '#2563EB', paddingVertical: 10,
    borderRadius: 6, alignItems: 'center',
  },
  btnCallText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Activity log
  bottomSection: { marginTop: 24, width: '100%' },
  activityTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  activityCard: {
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  activityRow: { flexDirection: 'row', padding: 20, paddingVertical: 16, flexWrap: 'wrap' },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityTimeCol: { width: 90, marginRight: 16, marginBottom: 8 },
  activityTime: { fontSize: 13, fontWeight: '600', color: '#475569' },
  activityDate: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  activityTextWrap: { flex: 1, justifyContent: 'center', minWidth: 200 },
  activityDesc: { fontSize: 14, color: '#475569', lineHeight: 22 },
  activityBold: { fontWeight: '700', color: '#1E293B' },
  activityHighlight: { color: '#3B82F6', fontWeight: '700' },
  activitySubDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  viewHistoryBtn: {
    backgroundColor: '#F8FAFC', padding: 16,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  viewHistoryText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' }
});