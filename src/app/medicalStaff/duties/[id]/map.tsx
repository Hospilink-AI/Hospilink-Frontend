import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { fetchDutyRoute } from "../../../../service/dutyService";
import { DutyRouteApiResponse, RouteStep } from "../../../../types/duty";
import {
  calcBearing,
  decodePolyline,
  haversineMeters,
} from "../../../../utils/polylineDecoder";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScreenState =
  | "loading"
  | "permission_denied"
  | "error"
  | "navigating"
  | "arrived";

// ─── Component ────────────────────────────────────────────────────────────────
export default function DutyMapScreen() {
  const { id, hospitalName } = useLocalSearchParams<{
    id: string;
    hospitalName: string;
  }>();
  const router = useRouter();

  const mapRef = useRef<MapView>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const bottomAnim = useRef(new Animated.Value(260)).current;
  const bannerAnim = useRef(new Animated.Value(-100)).current;

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [routeData, setRouteData] = useState<DutyRouteApiResponse | null>(null);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [bearing, setBearing] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [navigationStarted, setNavigationStarted] = useState(false);

  // ── TODO: Replace with auth context ────────────────────────────────────────
  const authToken = "YOUR_TOKEN";

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    init();
    return () => locationSub.current?.remove();
  }, []);

  const init = async () => {
    setScreenState("loading");

    // 1. Check/request permission
    const { status: existing } = await Location.getForegroundPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      setScreenState("permission_denied");
      return;
    }

    // 2. Get current position
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setCurrentLocation(loc);
      await loadRoute(loc);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Could not get location");
      setScreenState("error");
    }
  };

  // ─── Load route from API ───────────────────────────────────────────────────
  const loadRoute = async (loc: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const data = await fetchDutyRoute(id, loc);
      setRouteData(data);

      const coords = decodePolyline(data.route.overviewPolyline);
      setPolylineCoords(coords);

      setScreenState("navigating");

      // Animate in bottom panel + step banner
      Animated.parallel([
        Animated.spring(bottomAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.spring(bannerAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
          delay: 200,
        }),
      ]).start();

      // Fit route on map
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 40, bottom: 280, left: 40 },
          animated: true,
        });
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to load route");
      setScreenState("error");
    }
  };

  // ─── Start live GPS tracking (on "Start Navigation" press) ────────────────
  const startNavigation = async () => {
    setNavigationStarted(true);
    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10,
        timeInterval: 2000, // matches backend updateInterval
      },
      (pos) => {
        onLocationUpdate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? 0,
        });
      }
    );
  };

  // ─── Handle location updates ───────────────────────────────────────────────
  const onLocationUpdate = useCallback(
    (loc: { latitude: number; longitude: number; heading: number }) => {
      setCurrentLocation(loc);

      // Update bearing for marker rotation
      if (polylineCoords.length > 1) {
        const idx = closestIndex(loc, polylineCoords);
        if (idx < polylineCoords.length - 1) {
          setBearing(calcBearing(polylineCoords[idx], polylineCoords[idx + 1]));
        }
      }

      // Follow camera
      if (isFollowing) {
        mapRef.current?.animateCamera(
          {
            center: loc,
            heading: loc.heading || bearing,
            pitch: 45,
            zoom: 17,
          },
          { duration: 1000 }
        );
      }

      // Advance step + check arrival
      if (routeData) {
        advanceStep(loc, routeData.route.steps);
        checkArrival(loc, routeData);
      }
    },
    [polylineCoords, isFollowing, bearing, routeData, stepIndex]
  );

  const closestIndex = (
    loc: { latitude: number; longitude: number },
    coords: LatLng[]
  ): number => {
    let min = Infinity,
      idx = 0;
    coords.forEach((c, i) => {
      const d = haversineMeters(loc, c);
      if (d < min) {
        min = d;
        idx = i;
      }
    });
    return idx;
  };

  const advanceStep = (
    loc: { latitude: number; longitude: number },
    steps: RouteStep[]
  ) => {
    setStepIndex((prev) => {
      for (let i = prev; i < steps.length; i++) {
        const d = haversineMeters(loc, {
          latitude: steps[i].endLocation.lat,
          longitude: steps[i].endLocation.lng,
        });
        if (d < 50) return Math.min(i + 1, steps.length - 1);
      }
      return prev;
    });
  };

  const checkArrival = (
    loc: { latitude: number; longitude: number },
    data: DutyRouteApiResponse
  ) => {
    const dist = haversineMeters(loc, data.hospital.location);
    if (dist < (data.tracking.arrivalThreshold ?? 100)) {
      locationSub.current?.remove();
      setScreenState("arrived");
      Alert.alert("🏥 Arrived!", `You have reached ${data.hospital.name}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  // ─── Location disabled mid-session ────────────────────────────────────────
  useEffect(() => {
    if (screenState !== "navigating" || !navigationStarted) return;
    const interval = setInterval(async () => {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        locationSub.current?.remove();
        Alert.alert(
          "Location Disabled",
          "Your GPS was turned off. Navigation stopped.",
          [
            { text: "Go Back", onPress: () => router.back() },
            {
              text: "Enable GPS",
              onPress: () =>
                Platform.OS === "ios"
                  ? Linking.openURL("app-settings:")
                  : Linking.sendIntent(
                      "android.settings.LOCATION_SOURCE_SETTINGS"
                    ),
            },
          ]
        );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [screenState, navigationStarted]);

  // ─── Exit ──────────────────────────────────────────────────────────────────
  const handleExit = () => {
    Alert.alert("Exit Navigation", "Stop navigation and go back?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => {
          locationSub.current?.remove();
          router.back();
        },
      },
    ]);
  };

  const handleRecenter = () => {
    setIsFollowing(true);
    if (currentLocation) {
      mapRef.current?.animateCamera(
        { center: currentLocation, zoom: 17, pitch: 45, heading: bearing },
        { duration: 800 }
      );
    }
  };

  // ─── Step instruction helpers ──────────────────────────────────────────────
  const currentStep = routeData?.route.steps[stepIndex] ?? null;

  const cleanInstruction = (raw: string) =>
    raw.replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();

  const stepArrow = (instruction: string): string => {
    const s = instruction.toLowerCase();
    if (s.includes("turn left")) return "↰";
    if (s.includes("turn right")) return "↱";
    if (s.includes("u-turn")) return "↩";
    if (s.includes("slight left")) return "↖";
    if (s.includes("slight right")) return "↗";
    if (s.includes("keep left")) return "↖";
    if (s.includes("keep right")) return "↗";
    if (s.includes("merge")) return "⤵";
    return "↑";
  };

  // ─── Screen: Loading ───────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  // ─── Screen: Permission Denied ─────────────────────────────────────────────
  if (screenState === "permission_denied") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.bigIcon}>📍</Text>
        <Text style={styles.stateTitle}>Location Required</Text>
        <Text style={styles.stateSubtitle}>
          Location permission is required to show navigation directions to the
          hospital.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={init}>
          <Text style={styles.primaryBtnText}>Grant Location Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
          <Text style={styles.ghostBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Screen: Error ─────────────────────────────────────────────────────────
  if (screenState === "error") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.stateTitle}>Route Unavailable</Text>
        <Text style={styles.stateSubtitle}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            setScreenState("loading");
            init();
          }}
        >
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
          <Text style={styles.ghostBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Screen: Map ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        onPanDrag={() => setIsFollowing(false)}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }
            : undefined
        }
      >
        {/* Blue route polyline */}
        {polylineCoords.length > 0 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2563EB"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={bearing}
            flat
          >
            <View style={styles.userDotRing}>
              <View style={styles.userDotCore} />
            </View>
          </Marker>
        )}

        {/* Hospital destination marker */}
        {routeData && (
          <Marker
            coordinate={routeData.hospital.location}
            title={routeData.hospital.name}
            description={routeData.hospital.address}
          >
            <View style={styles.hospitalPin}>
              <View style={styles.hospitalPinInner}>
                <MaterialIcons name="local-hospital" size={18} color="#fff" />
              </View>
              <View style={styles.hospitalPinTip} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── TOP HEADER ── */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Active Duty Route</Text>
        </View>

        {/* On Call badge */}
        <View style={styles.onCallBadge}>
          <View style={styles.onCallDot} />
          <Text style={styles.onCallText}>On Call</Text>
        </View>

        <TouchableOpacity style={styles.topBarIcon}>
          <Ionicons name="notifications-outline" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarIcon}>
          <Ionicons name="help-circle-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── SEARCH BAR (decorative, matches screenshot) ── */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#94A3B8" />
        <Text style={styles.searchText}>
          {routeData?.hospital.name ?? hospitalName ?? "Search hospital..."}
        </Text>
        <Ionicons name="mic-outline" size={16} color="#94A3B8" />
      </View>

      {/* ── STEP INSTRUCTION BANNER ── */}
      {currentStep && (
        <Animated.View
          style={[
            styles.stepBanner,
            { transform: [{ translateY: bannerAnim }] },
          ]}
        >
          <Text style={styles.stepArrow}>
            {stepArrow(currentStep.instruction)}
          </Text>
          <View style={styles.stepBody}>
            <Text style={styles.stepInstruction} numberOfLines={2}>
              {cleanInstruction(currentStep.instruction)}
            </Text>
            <Text style={styles.stepDist}>
              {currentStep.distance < 1
                ? `in ${Math.round(currentStep.distance * 1000)} m`
                : `in ${currentStep.distance.toFixed(1)} km`}
            </Text>
          </View>
          <Text style={styles.stepCount}>
            {stepIndex + 1}/{routeData?.route.steps.length}
          </Text>
        </Animated.View>
      )}

      {/* ── RECENTER BUTTON ── */}
      {!isFollowing && (
        <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}>
          <Ionicons name="locate" size={20} color="#2563EB" />
        </TouchableOpacity>
      )}

      {/* ── ZOOM CONTROLS (matches screenshot) ── */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() =>
            mapRef.current?.getCamera().then((c) =>
              mapRef.current?.animateCamera({ zoom: (c.zoom ?? 14) + 1 })
            )
          }
        >
          <Text style={styles.zoomBtnText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() =>
            mapRef.current?.getCamera().then((c) =>
              mapRef.current?.animateCamera({ zoom: (c.zoom ?? 14) - 1 })
            )
          }
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM CARD ── */}
      <Animated.View
        style={[
          styles.bottomCard,
          { transform: [{ translateY: bottomAnim }] },
        ]}
      >
        {/* Hospital info row */}
        <View style={styles.hospitalRow}>
          <View style={styles.hospitalIconBox}>
            <MaterialIcons name="local-hospital" size={18} color="#2563EB" />
          </View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>
              {routeData?.hospital.name ?? hospitalName}
            </Text>
            <Text style={styles.hospitalAddress} numberOfLines={1}>
              {routeData?.hospital.address}
            </Text>
          </View>
        </View>

        {/* Stats row: time · distance · traffic */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statDot} />
            <Text style={styles.statValue}>
              {routeData?.route.durationText
                ? routeData.route.durationText.replace(" mins", "").replace(" hours", "h").replace(" hour", "h")
                : "--"}
            </Text>
            <Text style={styles.statLabel}>
              {routeData?.route.durationText?.includes("mins") ? "mins" : ""}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: "#64748B" }]} />
            <Text style={styles.statValue}>{routeData?.route.distanceText ?? "--"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.statValue}>Light</Text>
            <Text style={styles.statLabel}> traffic</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.exitMapBtn} onPress={handleExit}>
            <Text style={styles.exitMapBtnText}>Exit Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.startNavBtn,
              navigationStarted && styles.startNavBtnActive,
            ]}
            onPress={navigationStarted ? undefined : startNavigation}
          >
            <Ionicons
              name={navigationStarted ? "navigate" : "navigate-outline"}
              size={15}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.startNavBtnText}>
              {navigationStarted ? "Navigating…" : "Start Navigation"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Loading / error states
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 28,
  },
  loadingText: { marginTop: 14, fontSize: 16, color: "#64748B" },
  bigIcon: { fontSize: 64, marginBottom: 16 },
  stateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  ghostBtn: { paddingVertical: 12 },
  ghostBtnText: { color: "#64748B", fontSize: 15 },

  // Top header bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  topBarCenter: { flex: 1 },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  onCallBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  onCallDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
  onCallText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  topBarIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },

  // Search bar
  searchBar: {
    position: "absolute",
    top: 76,
    left: 16,
    right: 16,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchText: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },

  // Step banner
  stepBanner: {
    position: "absolute",
    top: 132,
    left: 16,
    right: 16,
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  stepArrow: { fontSize: 24, color: "#fff", marginRight: 12 },
  stepBody: { flex: 1 },
  stepInstruction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 19,
  },
  stepDist: { fontSize: 12, color: "#93C5FD", marginTop: 2 },
  stepCount: { fontSize: 11, color: "#93C5FD", marginLeft: 8 },

  // Zoom controls
  zoomControls: {
    position: "absolute",
    right: 16,
    bottom: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: { fontSize: 22, color: "#374151", fontWeight: "300" },
  zoomDivider: { height: 1, backgroundColor: "#E2E8F0" },

  // Recenter
  recenterBtn: {
    position: "absolute",
    right: 16,
    bottom: 350,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // User location marker
  userDotRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37,99,235,0.18)",
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  userDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },

  // Hospital pin marker
  hospitalPin: { alignItems: "center" },
  hospitalPinInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  hospitalPinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#DC2626",
    marginTop: -1,
  },

  // Bottom card
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },

  // Hospital info in card
  hospitalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  hospitalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  hospitalInfo: { flex: 1 },
  hospitalName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  hospitalAddress: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statValue: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  statLabel: { fontSize: 12, color: "#64748B" },
  statDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  exitMapBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  exitMapBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  startNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startNavBtnActive: {
    backgroundColor: "#16A34A",
  },
  startNavBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
