import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/service/api';
import { decodePolyline } from '@/utils/polylineDecoderA';
import { useTrackingReceiver } from '@/hooks/useTrackingReceiver';


const isWeb = typeof window !== 'undefined' && !!window.document;

const STREET_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
};

const SATELLITE_TILE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '© Esri, Maxar, Earthstar Geographics',
};

// ─── TypeScript Interfaces ──────────────────────────────────────────────
interface Coord { latitude: number; longitude: number; }
interface StatusHistory {
  _id: string;
  status: string;
  timestamp: string;
  reason: string;
  changedBy: string;
}
interface ApiData {
  staff: {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
    userName?: string;
    mobileNumber?: string;
    skills?: string[];
    avgRating?: number;
    address?: string;
    coordinates?: {
      coordinates: {
        latitude: number;
        longitude: number;
      };
      type?: string;
    };
    location?: { latitude: number; longitude: number; lastUpdated?: string, source?: string; };
    realTimeLocation?: any;
  } | null;
  duty: {
    dutyId: string;
    dutyRole?: string;
    role?: string;
    formattedRole?: string;
    hospitalName?: string;
    startTime: string;
    endTime: string;
    date: string;
    description: string;
    totalPayment: number;
    status: string;
    statusHistory?: StatusHistory[];
  };
  hospital: {
    id: string;
    name: string;
    address?: string;
    location: string;
    coordinates: {
      coordinates: {
        latitude: number;
        longitude: number;
      };
      latitude?: number;
      longitude?: number;
      type?: string;
    };
  };
  route?: {
    distanceText: string;
    durationText: string;
    stepPolylines: string[];
  };
  distance?: {
    distance: number;
    distanceText: string;
    estimatedTime: number;
    estimatedTimeText: string;
  };
  tracking?: {
    isRealTime: boolean;
    lastUpdate: string | null;
    estimatedArrival?: string;
    source?: string;
  };
  timing?: {
    date: string;
    startTime: string;
    endTime: string;
    urgency: string;
  };
}
// ───────────────────────────────────────────────────────────────────────

// ─── WebMap Component ───
interface WebMapProps {
  staffLocation: Coord;
  hospitalLocation: Coord;
  routePolylines: string[];
  status: string;
  isSatellite: boolean;
  onToggleSatellite: () => void;
}



const WebMap = ({ staffLocation, hospitalLocation, routePolylines, status, isSatellite, onToggleSatellite }: WebMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!isWeb || !mapRef.current) return;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
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

      const map = L.map(mapRef.current!).setView([centerLat, centerLng], 13);
      mapInstanceRef.current = map;

      // const tile = isSatellite ? SATELLITE_TILE : STREET_TILE;

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
        html: `<div style="width: 36px; height: 36px; background: #3B82F6; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">👤</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const hospitalIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 36px; height: 36px; background: #EF4444; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">🏥</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([staffLocation.latitude, staffLocation.longitude], { icon: staffIcon }).addTo(map);
      L.marker([hospitalLocation.latitude, hospitalLocation.longitude], { icon: hospitalIcon }).addTo(map);

      if (routePolylines && routePolylines.length > 0) {
        const allPoints: [number, number][] = [];
        routePolylines.forEach((encodedPolyline: string) => {
          const points = decodePolyline(encodedPolyline);
          allPoints.push(...points);
          L.polyline(points, { color: status === 'in-progress' ? '#10B981' : '#2563EB', weight: 4, opacity: 0.8 }).addTo(map);
        });
        if (allPoints.length > 0) {
          map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
        }
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

    tileLayerRef.current.bringToBack();
  }, [isSatellite]);

  return (
    // <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 350, zIndex: 1 }} />
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 350 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 350, zIndex: 1 }} />
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

// ─── Main Component ───
export default function LiveRequestMonitoring() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  const liveLocations = useTrackingReceiver({ dutyId: dutyId as string });


  const fetchDutyRoute = async () => {
    try {
      if (!data) setLoading(true);
      const response = await adminAPI.getTrackStaffLocation(dutyId as string);
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to load duty information');
      }
    } catch (err) {
      console.error('❌ [API Error]:', err);
      setError('Error loading duty information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dutyId) {
      fetchDutyRoute();
      const interval = setInterval(fetchDutyRoute, 30000);
      return () => clearInterval(interval);
    }
  }, [dutyId]);

  // Helpers
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading tracking details...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDutyRoute}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Additional safety check for required data
  if (!data.duty || !data.hospital) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading complete data...</Text>
      </View>
    );
  }

  // Handle null staff case
  if (!data.staff) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No staff assigned to this duty yet</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { staff, duty, hospital, route: routeData, tracking, distance, timing } = data;

  // Extract coordinates from nested structure
  const getStaffCoordinates = () => {
    if (staff?.coordinates?.coordinates) {
      return {
        latitude: staff.coordinates.coordinates.latitude,
        longitude: staff.coordinates.coordinates.longitude
      };
    }

    if (staff?.location) {
      return {
        latitude: staff.location.latitude,
        longitude: staff.location.longitude
      };
    }

    return null;
  };

  const getHospitalCoordinates = () => {
    // Check for nested structure first (coordinates.coordinates)
    if (hospital?.coordinates?.coordinates) {
      return {
        latitude: hospital.coordinates.coordinates.latitude,
        longitude: hospital.coordinates.coordinates.longitude
      };
    }

    // Check for flat structure (coordinates.latitude)
    if (hospital?.coordinates?.latitude && hospital?.coordinates?.longitude) {
      return {
        latitude: hospital.coordinates.latitude,
        longitude: hospital.coordinates.longitude
      };
    }

    return null;
  };

  const staffCoordinates = getStaffCoordinates();
  const hospitalCoordinates = getHospitalCoordinates();

  // Get duty role and status
  const dutyRole = duty.formattedRole || duty.dutyRole || duty.role || 'Medical Staff';
  const dutyStatus = (duty as any).status?.status || duty.status || 'unknown';

  const timelineSteps = [
    { key: 'available', label: 'Posted', icon: 'checkmark' },
    { key: 'assigned', label: 'Accepted', icon: 'checkmark' },
    { key: 'accepted', label: 'Enroute', icon: 'checkmark' },
    { key: 'enroute', label: 'In Progress', icon: 'car' },
    { key: 'in-progress', label: 'Completed', icon: 'location' }
  ];

  const currentStatusMap: Record<string, number> = {
    'available': 0, 'assigned': 1, 'accepted': 2, 'enroute': 3, 'in-progress': 4, 'completed': 5
  };
  const currentStepIndex = currentStatusMap[dutyStatus] ?? 0;

  const sortedHistory = [...(duty.statusHistory || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActorFromReason = (reason: string, staffName: string, hospitalName: string) => {
    if (!reason) return 'System';
    if (reason.toLowerCase().includes('staff')) return staffName;
    if (reason.toLowerCase().includes('hospital')) return `Admin / ${hospitalName}`;
    return staffName;
  };

  // Get live coordinates from socket or fallback to last known location
  let staffId: string | undefined;

  if (staff) {
    staffId = staff.id || staff._id;

    if (!staffId && duty.statusHistory && duty.statusHistory.length > 0) {
      const assignedHistory = duty.statusHistory.find(h => h.status === 'assigned');
      if (assignedHistory) {
        staffId = assignedHistory.changedBy;
      }
    }
  }

  // Check if we have real-time location from API
  const hasRealtimeFromAPI = staff?.location?.source === 'realtime';
  const apiLocationAge = staff?.location?.lastUpdated
    ? Date.now() - new Date(staff.location.lastUpdated).getTime()
    : null;

  // Priority: WebSocket > API realtime > Static profile
  let staffLiveCoord;
  let coordinateSource;

  if (staffId && liveLocations[staffId]) {
    // Use WebSocket data (highest priority)
    staffLiveCoord = liveLocations[staffId];
    coordinateSource = '🔴 LIVE (WebSocket)';
  } else if (hasRealtimeFromAPI && apiLocationAge && apiLocationAge < 10000) {
    // Use API realtime data if less than 10 seconds old
    staffLiveCoord = {
      // latitude: staff.location.latitude,
      latitude: staff.location!.latitude,
      longitude: staff.location!.longitude
      // longitude: staff.location.longitude
    };
    coordinateSource = '🟢 LIVE (API)';
  } else {
    // Fallback to static profile coordinates
    staffLiveCoord = staffCoordinates;
    coordinateSource = '📍 STATIC (Profile)';
  }

  console.log('🗺️ [COORDINATE SOURCE]:', coordinateSource, staffLiveCoord);

  // Calculate live update time and ETA
  const lastUpdate = staffId && liveLocations[staffId]?.timestamp
    ? new Date(liveLocations[staffId].timestamp! * 1000).toLocaleTimeString()
    : 'Just now';

  const liveETA = staffId && liveLocations[staffId]?.estimatedArrival
    ? new Date(liveLocations[staffId].estimatedArrival! * 1000).toLocaleTimeString()
    : distance?.estimatedTimeText || routeData?.durationText || '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

      {/* Top Header */}
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
            <View style={styles.badgeHighPriority}>
              <Text style={styles.badgeHighPriorityText}>High Priority</Text>
            </View>
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

      <View style={styles.mainGrid}>

        {/* LEFT COLUMN: Request Details */}
        <View style={styles.leftCol}>
          <View style={styles.detailCard}>
            <Text style={styles.cardSectionTitle}>Request Details</Text>

            <View style={styles.detailItem}>
              <View style={styles.iconBox} />
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>REQUEST ID</Text>
                <Text style={styles.detailValueBold}>MGT-{duty.dutyId.slice(-5).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox} />
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Hospital Name</Text>
                <Text style={styles.detailValueBold}>{hospital.name}</Text>
                <Text style={styles.detailSub}>{hospital.address?.split(',')[0] || hospital.location}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox} />
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>SHIFT TIME</Text>
                <Text style={styles.detailValueBold}>{timing?.startTime || duty.startTime} - {timing?.endTime || duty.endTime}</Text>
                <Text style={styles.detailSub}>Payment: ₹{duty.totalPayment}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox} />
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>ROLE REQUIRED</Text>
                <Text style={styles.detailValueBold}>{dutyRole.toUpperCase()}</Text>
                <Text style={styles.detailSub}>Specialist</Text>
              </View>
            </View>

            <View style={styles.shiftNotesWrap}>
              <Text style={styles.detailLabel}>SHIFT NOTES</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  {duty.description || "No specific notes provided for this shift. Please coordinate with the head nurse upon arrival."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CENTER COLUMN: Map & Tracking */}
        <View style={styles.centerCol}>
          <View style={styles.mapStatusTop}>
            <View style={styles.mapStatusLeft}>
              <View style={styles.livePulseDot} />
              <View>
                <Text style={styles.mapStatusTitle}>Nurse Enroute</Text>
                <Text style={styles.mapStatusSub}>Estimated arrival in {liveETA || '--'}</Text>
              </View>
            </View>
            <View style={styles.mapStatusRight}>
              <Text style={styles.lastUpdatedLabel}>LAST UPDATED</Text>
              <Text style={styles.lastUpdatedValue}>{lastUpdate}</Text>
            </View>
          </View>

          <View style={styles.mapWrapper}>
            {/* The Map */}
            <View style={styles.mapContainer}>
              {(() => {
                if (!isWeb) {
                  return (
                    <View style={styles.mapPlaceholder}>
                      <Text style={{ color: '#64748B' }}>Map view available on web version</Text>
                    </View>
                  );
                }

                if (!staffLiveCoord) {
                  return (
                    <View style={styles.mapPlaceholder}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={{ color: '#64748B', marginTop: 12 }}>Loading staff location...</Text>
                    </View>
                  );
                }

                if (!hospitalCoordinates) {
                  return (
                    <View style={styles.mapPlaceholder}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={{ color: '#64748B', marginTop: 12 }}>Loading hospital location...</Text>
                    </View>
                  );
                }

                return (
                  <WebMap
                    staffLocation={staffLiveCoord}
                    hospitalLocation={hospitalCoordinates}
                    routePolylines={routeData?.stepPolylines || []}
                    status={dutyStatus}
                    isSatellite={isSatellite}
                    onToggleSatellite={() => setIsSatellite(v => !v)}
                  />
                );
              })()}
            </View>

            {/* Horizontal Timeline placed relatively BELOW the map */}
            <View style={styles.horizontalTimeline}>
              <View style={styles.timelineTrackBg} />
              <View style={[styles.timelineTrackFill, { width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }]} />

              {timelineSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <View key={step.key} style={styles.timelineNodeWrap}>
                    <View style={[styles.timelineNode, isCompleted && styles.timelineNodeCompleted, isCurrent && styles.timelineNodeCurrent]}>
                      {/* {step.icon === 'checkmark' && isCompleted ? (
                        <Text style={styles.nodeIconText}>✓</Text>
                      ) : step.icon === 'car' && isCurrent ? (
                        <Ionicons name="car" size={16} color="#2563EB" />
                      ) : null} */}
                      {isCompleted ? (
                        step.icon === 'car' && isCurrent ? (
                          <Ionicons name="car" size={16} color="#fff" />
                        ) : (
                          <Text style={styles.nodeIconText}>✓</Text>
                        )
                      ) : null}
                    </View>
                    <Text style={[styles.timelineNodeLabel, isCompleted && styles.timelineNodeLabelActive]}>{step.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* RIGHT COLUMN: Staff Profile */}
        <View style={styles.rightCol}>
          <View style={styles.staffCard}>
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

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {staff.avgRating > 0 ? staff.avgRating : '0'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.staffSection}>
              <Text style={styles.sectionLabel}>Skills</Text>
              <View style={styles.tagsRow}>
                {staff.skills && staff.skills.length > 0 ? (
                  staff.skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{skill}</Text>
                    </View>
                  ))
                ) : <Text style={styles.tagText}>No skills added</Text>}
              </View>
            </View>

            <View style={styles.staffSection}>
              <Text style={styles.sectionLabel}>CONTACT INFO</Text>
              {staff.mobileNumber && (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color="#475569" />
                  <Text style={styles.contactText}>{staff.mobileNumber}</Text>
                </View>
              )}
              {staff.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color="#475569" />
                  <Text style={styles.contactText}>{staff.email}</Text>
                </View>
              )}
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

      {/* ─── BOTTOM ROW: Live Activity Log ─── */}
      <View style={styles.bottomSection}>
        <Text style={styles.activityTitle}>Live Activity Log</Text>
        <View style={styles.activityCard}>
          {sortedHistory.map((item, idx) => {
            const actor = getActorFromReason(item.reason, staff.name, hospital.name);
            const isLast = idx === sortedHistory.length - 1;

            return (
              <View key={item._id} style={[styles.activityRow, !isLast && styles.activityBorder]}>

                {/* Time & Date Column */}
                <View style={styles.activityTimeCol}>
                  <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
                  <Text style={styles.activityDate}>{formatDate(item.timestamp)}</Text>
                </View>

                {/* Description Column */}
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityDesc}>
                    <Text style={styles.activityBold}>{actor}</Text>

                    {item.status === 'available' && ' created the shift request.'}
                    {item.status === 'assigned' && ' accepted the shift request.'}
                    {(item.status === 'enroute' || item.status === 'in-progress' || item.status === 'completed') && (
                      <Text> marked status as <Text style={styles.activityHighlight}>{item.status.toUpperCase()}</Text>.</Text>
                    )}
                  </Text>

                  {/* Sub Descriptions based on reason or status */}
                  {item.status === 'enroute' && (
                    <Text style={styles.activitySubDesc}>Location tracking started via mobile app.</Text>
                  )}
                  {item.status === 'available' && (
                    <Text style={styles.activitySubDesc}>System sent offer to matching candidates.</Text>
                  )}
                  {(item.status === 'in-progress' || item.status === 'completed') && (
                    <Text style={styles.activitySubDesc}>{item.reason}</Text>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.viewHistoryBtn} activeOpacity={0.8}>
            <Text style={styles.viewHistoryText}>View Full History</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

// ─── StyleSheet ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 24, paddingBottom: 60, maxWidth: 1600, marginHorizontal: 'auto', width: '100%' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B' },
  errorText: { color: '#EF4444', marginBottom: 16 },
  retryButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600' },

  headerArea: { marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  headerMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeHighPriority: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  badgeHighPriorityText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  btnOutlineText: { color: '#1E293B', fontSize: 13, fontWeight: '600' },
  btnDanger: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  btnDangerText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  // Responsive Grid Settings
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap', // Ensures it wraps on smaller screens
    alignItems: 'stretch' // Makes columns match height if desired
  },

  // Responsive Columns
  leftCol: { flex: 1, minWidth: 280, maxWidth: 350 },
  centerCol: { flex: 2.5, minWidth: 400 },
  rightCol: { flex: 1, minWidth: 300, maxWidth: 350 },

  detailCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  detailItem: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  iconBox: { width: 40, height: 40, backgroundColor: '#EFF6FF', borderRadius: 8 },
  detailTextCol: { flex: 1, justifyContent: 'center' },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  detailValueBold: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  detailSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  shiftNotesWrap: { marginTop: 10 },
  notesBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  notesText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  mapStatusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#DBEAFE', paddingHorizontal: 20, paddingVertical: 14, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  mapStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  livePulseDot: { width: 10, height: 10, backgroundColor: '#2563EB', borderRadius: 5 },
  mapStatusTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  mapStatusSub: { fontSize: 12, color: '#60A5FA', marginTop: 2 },
  mapStatusRight: { alignItems: 'flex-end' },
  lastUpdatedLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  lastUpdatedValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },

  // Map Wrapper -> now a flex container
  mapWrapper: {
    flex: 1,
    minHeight: 500,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'column'
  },
  mapContainer: {
    flex: 1,
    minHeight: 400,
    position: 'relative',
    zIndex: 1
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Timeline moved to regular flow (not absolute)
  horizontalTimeline: {
    position: 'relative',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2
  },

  satelliteToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  // Lines remain absolute relative to the horizontalTimeline container
  timelineTrackBg: { position: 'absolute', height: 4, backgroundColor: '#E2E8F0', left: 40, right: 40, top: 34, zIndex: 1 },
  timelineTrackFill: { position: 'absolute', height: 4, backgroundColor: '#2563EB', left: 40, top: 34, zIndex: 2 },
  timelineNodeWrap: { alignItems: 'center', gap: 8, zIndex: 3, width: 60 },
  timelineNode: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  timelineNodeCompleted: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timelineNodeCurrent: {  backgroundColor: '#2563EB',
     borderColor: '#2563EB', borderWidth: 3, width: 32, height: 32, marginTop: -4 },
  nodeIconText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  timelineNodeLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  timelineNodeLabelActive: { color: '#2563EB' },

  staffCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  staffAvatarWrap: { position: 'relative', marginBottom: 16 },
  staffAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  staffInitials: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, backgroundColor: '#10B981', borderRadius: 7, borderWidth: 2, borderColor: '#FFF' },
  staffProfileName: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  acceptedBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  acceptedBadgeText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  shiftsText: { color: '#94A3B8', fontWeight: '400' },
  divider: { height: 1, backgroundColor: '#F1F5F9', width: '100%', marginVertical: 20 },
  staffSection: { width: '100%', marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  staffActionRow: { flexDirection: 'row', width: '100%', gap: 12, marginTop: 4 },
  btnMessage: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  btnMessageText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  btnCall: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  btnCallText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Activity Log
  bottomSection: { marginTop: 24, width: '100%' },
  activityTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  activityCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  activityRow: { flexDirection: 'row', padding: 20, paddingVertical: 16 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityTimeCol: { width: 90, marginRight: 16 },
  activityTime: { fontSize: 13, fontWeight: '600', color: '#475569' },
  activityDate: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  activityTextWrap: { flex: 1, justifyContent: 'center' },
  activityDesc: { fontSize: 14, color: '#475569', lineHeight: 22 },
  activityBold: { fontWeight: '700', color: '#1E293B' },
  activityHighlight: { color: '#3B82F6', fontWeight: '700' },
  activitySubDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  viewHistoryBtn: { backgroundColor: '#F8FAFC', padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  viewHistoryText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
});