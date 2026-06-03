import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchDutyRoute } from "../../../../service/dutyService";
import { DutyRouteApiResponse, RouteStep } from "../../../../types/duty";
import { decodePolyline, haversineMeters } from "../../../../utils/polylineDecoder";

// ── Conditionally import native-only modules ──────────────────────────────────
const ExpoLocation: any =
  Platform.OS !== "web" ? require("expo-location") : null;
const NativeWebView: any =
  Platform.OS !== "web" ? require("react-native-webview").WebView : null;

// ── Types ─────────────────────────────────────────────────────────────────────
type ScreenState = "loading" | "permission_denied" | "error" | "navigating" | "arrived";
type Coord = { latitude: number; longitude: number };

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanInstruction(raw: string): string {
  return raw.replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();
}

function stepArrow(instruction: string): string {
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
}

// ── Leaflet HTML ──────────────────────────────────────────────────────────────
function buildLeafletHTML(
  routeCoords: Coord[],
  hospitalCoord: Coord,
  hospitalName: string,
  hospitalAddress: string,
  initialLoc: Coord,
): string {
  const coordsJson = JSON.stringify(routeCoords.map(c => [c.latitude, c.longitude]));
  const hospitalJson = JSON.stringify([hospitalCoord.latitude, hospitalCoord.longitude]);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100vh; overflow:hidden; }
    .leaflet-control-zoom {
      border:none !important;
      box-shadow:0 2px 8px rgba(0,0,0,0.15) !important;
      border-radius:10px !important; overflow:hidden;
    }
    .leaflet-control-zoom a {
      color:#374151 !important; font-weight:300 !important;
      font-size:18px !important; width:36px !important;
      height:36px !important; line-height:36px !important;
    }
      .leaflet-bottom.leaflet-right {
  bottom: 130px !important;   /* clears the floating card height */
  right: 8px !important;
}
    .user-pulse {
      width:20px; height:20px; background:#2563EB;
      border:3px solid #fff; border-radius:50%;
      box-shadow:0 0 0 6px rgba(37,99,235,0.2);
      animation:pulse 2s infinite;
    }
    @keyframes pulse {
      0%   { box-shadow:0 0 0 0   rgba(37,99,235,0.4); }
      70%  { box-shadow:0 0 0 10px rgba(37,99,235,0);  }
      100% { box-shadow:0 0 0 0   rgba(37,99,235,0);  }
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>

  var map = L.map('map', { zoomControl: false })
L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap contributors', maxZoom:19
  }).addTo(map);

  var coords = ${coordsJson};
  if (coords.length > 0) {
    var poly = L.polyline(coords, {
      color:'#2563EB', weight:5, opacity:0.92, lineCap:'round', lineJoin:'round'
    }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding:[80,80] });
  }

  var hIcon = L.divIcon({
    className: '',
    html: '<div style="width:40px;height:40px;background:#DC2626;border:3px solid #fff;' +
          'border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
          'display:flex;align-items:center;justify-content:center;' +
          'box-shadow:0 4px 14px rgba(220,38,38,0.45);">' +
          '<span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>',
    iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-44],
  });
  L.marker(${hospitalJson}, { icon: hIcon })
    .addTo(map)
    .bindPopup('<b>${esc(hospitalName)}</b><br/><small>${esc(hospitalAddress)}</small>');

  var uIcon = L.divIcon({
    html: '<div class="user-pulse"></div>',
    iconSize:[20,20], iconAnchor:[10,10], className:'',
  });
  var userMarker = L.marker(
    [${initialLoc.latitude}, ${initialLoc.longitude}],
    { icon: uIcon, zIndexOffset: 1000 }
  ).addTo(map);

  function sendToNative(data) {
    if (window.ReactNativeWebView)
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }

  function updateUserLocation(lat, lng, follow) {
    userMarker.setLatLng([lat, lng]);
    if (follow) map.panTo([lat, lng], { animate:true, duration:1 });
  }

  function handleIncoming(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'updateLocation') updateUserLocation(msg.lat, msg.lng, msg.follow);
    } catch(_) {}
  }
  document.addEventListener('message', handleIncoming);
  window.addEventListener('message', handleIncoming);
</script>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DutyMapScreen() {
  const { id, hospitalName } = useLocalSearchParams<{ id: string; hospitalName: string }>();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [routeData, setRouteData] = useState<DutyRouteApiResponse | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const webViewRef = useRef<any>(null);
  const mapDivRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerWebRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const bottomAnim = useRef(new Animated.Value(300)).current;
  const bannerAnim = useRef(new Animated.Value(-120)).current;

  // const screenW = Dimensions.get("window").width;
  // // Floating card: on desktop give side margins, on mobile minimal margins
  // const cardLeft  = Platform.OS === "web" && screenW > 700 ? screenW * 0.2 : 12;
  // const cardRight = Platform.OS === "web" && screenW > 700 ? screenW * 0.2 : 12;

  useEffect(() => {
    if (Platform.OS === "web") injectLeafletCSS();
    init();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    locationSubRef.current?.remove();
    if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
  };

  const injectLeafletCSS = () => {
    if (typeof document === "undefined" || document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css"; link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  };

  const init = async () => {
    setScreenState("loading");
    if (Platform.OS === "web") {
      if (!navigator.geolocation) { setErrorMsg("Geolocation not supported."); setScreenState("error"); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => { const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; setCurrentLocation(loc); await loadRoute(loc); },
        (err) => { if (err.code === err.PERMISSION_DENIED) setScreenState("permission_denied"); else { setErrorMsg(err.message); setScreenState("error"); } },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    } else {
      const { status: ex } = await ExpoLocation.getForegroundPermissionsAsync();
      let final = ex;
      if (ex !== "granted") { const { status } = await ExpoLocation.requestForegroundPermissionsAsync(); final = status; }
      if (final !== "granted") { setScreenState("permission_denied"); return; }
      try {
        const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCurrentLocation(loc); await loadRoute(loc);
      } catch (err: any) { setErrorMsg(err.message ?? "Could not get location"); setScreenState("error"); }
    }
  };

  const loadRoute = async (loc: Coord) => {
    try {
      const data = await fetchDutyRoute(id, loc);
      setRouteData(data);
      const allCoords: Coord[] = data.route.stepPolylines.flatMap((sp: string) => {
        try { return decodePolyline(sp); } catch { return []; }
      });
      setRouteCoords(allCoords);
      setScreenState("navigating");
      Animated.parallel([
        Animated.spring(bottomAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.spring(bannerAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11, delay: 200 }),
      ]).start();
      if (Platform.OS === "web") setTimeout(() => initWebMap(data, allCoords, loc), 200);
    } catch (err: any) { setErrorMsg(err.message ?? "Failed to load route"); setScreenState("error"); }
  };

  const initWebMap = (data: DutyRouteApiResponse, coords: Coord[], loc: Coord) => {
    if (!mapDivRef.current) return;
    const boot = () => {
      const L = (window as any).L;
      if (!L) return;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const map = L.map(mapDivRef.current).setView([loc.latitude, loc.longitude], 13);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
      if (coords.length > 0) {
        const poly = L.polyline(coords.map(c => [c.latitude, c.longitude]), { color: "#2563EB", weight: 5, opacity: 0.92, lineCap: "round", lineJoin: "round" }).addTo(map);
        map.fitBounds(poly.getBounds(), { padding: [80, 80] });
      }
      const hIcon = L.divIcon({ className: "", html: `<div style="width:40px;height:40px;background:#DC2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(220,38,38,0.45);"><span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>`, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44] });
      L.marker([data.hospital.location.latitude, data.hospital.location.longitude], { icon: hIcon }).addTo(map).bindPopup(`<b>${data.hospital.name}</b><br/><small>${data.hospital.address}</small>`);
      const style = document.createElement("style");
      style.innerHTML = `.user-pulse{width:20px;height:20px;background:#2563EB;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.2);animation:pulse 2s infinite;}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,0.4);}70%{box-shadow:0 0 0 10px rgba(37,99,235,0);}100%{box-shadow:0 0 0 0 rgba(37,99,235,0);}}`;
      document.head.appendChild(style);
      const uIcon = L.divIcon({ html: '<div class="user-pulse"></div>', iconSize: [20, 20], iconAnchor: [10, 10], className: "" });
      userMarkerWebRef.current = L.marker([loc.latitude, loc.longitude], { icon: uIcon, zIndexOffset: 1000 }).addTo(map);
    };
    if (!(window as any).L) { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = boot; document.head.appendChild(s); }
    else boot();
  };

  const startNavigation = async () => {
    setNavigationStarted(true);
    if (Platform.OS === "web") {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => { Alert.alert("Location error", err.message); stopNavigation(); },
        { enableHighAccuracy: true, maximumAge: 2000 },
      );
    } else {
      locationSubRef.current = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 2000 },
        (pos: any) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      );
    }
  };

  const stopNavigation = () => {
    if (Platform.OS === "web") { if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; } }
    else { locationSubRef.current?.remove(); locationSubRef.current = null; }
    setNavigationStarted(false);
  };

  const onLocationUpdate = useCallback((loc: Coord) => {
    setCurrentLocation(loc);
    if (Platform.OS === "web") {
      userMarkerWebRef.current?.setLatLng([loc.latitude, loc.longitude]);
      if (isFollowing && mapInstanceRef.current) mapInstanceRef.current.panTo([loc.latitude, loc.longitude], { animate: true, duration: 1 });
    } else {
      webViewRef.current?.injectJavaScript(`updateUserLocation(${loc.latitude},${loc.longitude},${isFollowing});true;`);
    }
    if (routeData) {
      setStepIndex(prev => {
        const steps = routeData.route.steps;
        for (let i = prev; i < steps.length; i++) {
          if (haversineMeters(loc, { latitude: steps[i].endLocation.lat, longitude: steps[i].endLocation.lng }) < 50)
            return Math.min(i + 1, steps.length - 1);
        }
        return prev;
      });
      const dist = haversineMeters(loc, routeData.hospital.location);
      if (dist < (routeData.tracking.arrivalThreshold ?? 100)) {
        stopNavigation(); setScreenState("arrived");
        const msg = `You have arrived at ${routeData.hospital.name}!`;
        if (Platform.OS === "web") { alert(`🏥 ${msg}`); router.back(); }
        else Alert.alert("🏥 Arrived!", msg, [{ text: "OK", onPress: () => router.back() }]);
      }
    }
  }, [routeData, isFollowing]);

  const handleBack = () => {
    stopNavigation();
    try { if (router.canGoBack()) router.back(); else router.replace("/medicalStaff/dashboard" as any); }
    catch { router.replace("/medicalStaff/dashboard" as any); }
  };

  const currentStep = routeData?.route.steps[stepIndex] ?? null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (screenState === "loading") return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Getting your location…</Text>
    </View>
  );

  // ── Permission Denied ──────────────────────────────────────────────────────
  if (screenState === "permission_denied") return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.bigEmoji}>📍</Text>
      <Text style={styles.stateTitle}>Location Required</Text>
      <Text style={styles.stateSubtitle}>Please allow location access to view navigation.</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={init}><Text style={styles.primaryBtnText}>Grant Location Access</Text></TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}><Text style={styles.ghostBtnText}>Go Back</Text></TouchableOpacity>
    </SafeAreaView>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (screenState === "error") return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.bigEmoji}>⚠️</Text>
      <Text style={styles.stateTitle}>Route Unavailable</Text>
      <Text style={styles.stateSubtitle}>{errorMsg}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => { setScreenState("loading"); init(); }}><Text style={styles.primaryBtnText}>Retry</Text></TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}><Text style={styles.ghostBtnText}>Go Back</Text></TouchableOpacity>
    </SafeAreaView>
  );

  // ── Map ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {Platform.OS !== "web" && <StatusBar barStyle="dark-content" />}

      {/* MAP */}
      <View style={StyleSheet.absoluteFillObject}>
        {Platform.OS === "web" ? (
          React.createElement("div", { ref: mapDivRef, style: { position: "absolute", inset: 0, zIndex: 0 } })
        ) : (
          currentLocation && routeData && NativeWebView && (
            <NativeWebView
              ref={webViewRef}
              source={{ html: buildLeafletHTML(routeCoords, routeData.hospital.location, routeData.hospital.name, routeData.hospital.address, currentLocation) }}
              style={StyleSheet.absoluteFill}
              originWhitelist={["*"]} javaScriptEnabled domStorageEnabled
              startInLoadingState mixedContentMode="always"
              onTouchStart={() => setIsFollowing(false)}
            />
          )
        )}
      </View>

      {/* ── TOP BAR ── */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <View style={styles.topBarMid}>
          <Text style={styles.topBarTitle} numberOfLines={1}>Active Duty Route</Text>
          {routeData && (
            <Text style={styles.topBarSub} numberOfLines={1}>
              · {routeData.route.distanceText} · {routeData.route.durationText}
            </Text>
          )}
        </View>
        <View style={styles.onCallBadge}>
          <View style={styles.onCallDot} />
          <Text style={styles.onCallText}>On Call</Text>
        </View>
      </SafeAreaView>

      {/* ── STEP BANNER ── */}
      {currentStep && (
        <Animated.View style={[styles.stepBanner, { transform: [{ translateY: bannerAnim }] }]}>
          <Text style={styles.stepArrow}>{stepArrow(currentStep.instruction)}</Text>
          <Text style={styles.stepText} numberOfLines={1}>
            {cleanInstruction(currentStep.instruction)}
          </Text>
          <Text style={styles.stepDist}>
            · in {currentStep.distance < 1
              ? `${Math.round(currentStep.distance * 1000)} m`
              : `${currentStep.distance.toFixed(1)} km`}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.stepCount}>{stepIndex + 1}/{routeData?.route.steps.length}</Text>
        </Animated.View>
      )}

      {/* ── RECENTER ── */}
      {!isFollowing && (
        <TouchableOpacity style={styles.recenterBtn} onPress={() => {
          setIsFollowing(true);
          if (currentLocation) {
            if (Platform.OS === "web" && mapInstanceRef.current)
              mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 16, { animate: true });
            else
              webViewRef.current?.injectJavaScript(`map.setView([${currentLocation.latitude},${currentLocation.longitude}],16,{animate:true});true;`);
          }
        }}>
          <Ionicons name="locate" size={20} color="#2563EB" />
        </TouchableOpacity>
      )}

      {/* ── FLOATING BOTTOM CARD ── */}
      <Animated.View style={[styles.card, { transform: [{ translateY: bottomAnim }] }]}>

        {/* Row 1: Hospital */}
        <View style={styles.cardHospRow}>
          <View style={styles.cardHospIcon}>
            <Text style={{ fontSize: 16 }}>🏥</Text>
          </View>
          <View style={styles.cardHospInfo}>
            <Text style={styles.cardHospName} numberOfLines={1}>
              {routeData?.hospital.name ?? hospitalName}
            </Text>
            <Text style={styles.cardHospAddr} numberOfLines={1}>
              {routeData?.hospital.address ?? ""}
            </Text>
          </View>
        </View>

        {/* Row 2: Stats + Buttons */}
        <View style={styles.cardBottomRow}>
          {/* Stats */}
          <View style={styles.statsGroup}>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.statTxt} numberOfLines={1}>
                {routeData?.route.durationText ?? "--"}
              </Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: "#64748B" }]} />
              <Text style={styles.statTxt} numberOfLines={1}>
                {routeData?.route.distanceText ?? "--"}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.exitBtn} onPress={handleBack}>
              <Text style={styles.exitBtnTxt}>Exit Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, navigationStarted && styles.startBtnActive]}
              onPress={navigationStarted ? stopNavigation : startNavigation}
            >
              <Ionicons
                name={navigationStarted ? "navigate" : "navigate-outline"}
                size={13} color="#fff" style={{ marginRight: 4 }}
              />
              <Text style={styles.startBtnTxt} numberOfLines={1}>
                {navigationStarted ? "Navigating…" : "Start Navigation"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EFF7" },

  // Loading / error
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 28 },
  loadingText: { marginTop: 14, fontSize: 16, color: "#64748B" },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  stateTitle: { fontSize: 22, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  stateSubtitle: { fontSize: 15, color: "#64748B", textAlign: "center", marginTop: 8, marginBottom: 32, lineHeight: 22 },
  primaryBtn: { backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  ghostBtn: { paddingVertical: 12 },
  ghostBtnText: { color: "#64748B", fontSize: 15 },

  // ── Top bar ──
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderBottomWidth: 1, borderBottomColor: "#E8EFF7",
    zIndex: 20, gap: 8,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  topBarMid: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "nowrap", minWidth: 0 },
  topBarTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", flexShrink: 0 },
  topBarSub: { fontSize: 12, color: "#64748B", marginLeft: 4, flexShrink: 1 },
  onCallBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#DCFCE7", paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 12, gap: 4, flexShrink: 0,
  },
  onCallDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
  onCallText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

  // ── Step banner — single row ──
  stepBanner: {
    position: "absolute", top: 52, left: 12, right: 12,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    zIndex: 20, gap: 6,
  },
  stepArrow: { fontSize: 20, color: "#fff", flexShrink: 0 },
  stepText: { fontSize: 13, fontWeight: "600", color: "#fff", flexShrink: 1 },
  stepDist: { fontSize: 12, color: "#93C5FD", flexShrink: 0 },
  stepCount: { fontSize: 11, color: "#93C5FD", flexShrink: 0 },

  // ── Recenter ──
  recenterBtn: {
    position: "absolute", right: 14, bottom: 160,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    zIndex: 20, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },

  // ── Floating card ──
  card: {
    position: "absolute",
    bottom: 20,               // floats above bottom edge
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 16,         // all 4 corners rounded — matches screenshot
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },

  // Row 1 — hospital info
  cardHospRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 10,
  },
  cardHospIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardHospInfo: { flex: 1, minWidth: 0 },
  cardHospName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  cardHospAddr: { fontSize: 11, color: "#64748B", marginTop: 1 },

  // Row 2 — stats + buttons
  cardBottomRow: {
    flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between",
  },

  // Stats — left side
  statsGroup: {
    flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1, minWidth: 0,
  },
  statChip: {
    flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0,
  },
  statDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  statTxt: {
    fontSize: 12, fontWeight: "600", color: "#374151",
    flexShrink: 1,
  },

  // Buttons — right side
  btnGroup: {
    flexDirection: "row", alignItems: "center", gap: 8,
    flexShrink: 0,
  },
  exitBtn: {
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  exitBtnTxt: { fontSize: 12, fontWeight: "600", color: "#374151" },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10, backgroundColor: "#2563EB",
    shadowColor: "#2563EB", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  startBtnActive: { backgroundColor: "#16A34A" },
  startBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff", flexShrink: 1 },
});