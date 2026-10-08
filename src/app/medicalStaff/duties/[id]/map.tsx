import { useCallback, useEffect, useRef, useState, createElement } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button, { IconButton } from "@/ds/Button";
import Icon, { IconName } from "@/ds/Icon";
import { ScreenHeader } from "@/ds/Layout";
import { snack } from "@/ds/Snackbar";
import { EmptyState } from "@/ds/States";
import { Card, IconTile } from "@/ds/Surface";
import { Meta } from "@/ds/Tag";
import Txt from "@/ds/Txt";
import { color, depth, glass, radius } from "@/ds/tokens";
import { decodePolyline as decodeOverview } from "@/constant/routeLine";
import { ATTR_SATELLITE, ATTR_STANDARD, HOSPITAL_PIN, LEAFLET, MAP_CSS, ME_DOT, ROUTE_STYLE, STRAIGHT_STYLE, TILE_SATELLITE, TILE_STANDARD, htmlEsc } from "@/doctor/mapAssets";
import { fetchDutyRoute } from "@/service/dutyService";
import { DutyRouteApiResponse } from "@/types/duty";
import { decodePolyline, haversineMeters } from "@/utils/polylineDecoder";

// One screen for phone and web. The map is Leaflet: in the page on web, in a WebView on the phone.
const ExpoLocation: any = Platform.OS !== "web" ? require("expo-location") : null;
const NativeWebView: any = Platform.OS !== "web" ? require("react-native-webview").WebView : null;

type ScreenState = "loading" | "permission_denied" | "error" | "navigating";
type Coord = { latitude: number; longitude: number };

function cleanInstruction(raw: string): string {
  return raw.replace(/<[^>]+>/g, "").replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();
}

function turnIcon(instruction: string): IconName {
  const s = instruction.toLowerCase();
  if (s.includes("u-turn")) return "uTurn";
  if (s.includes("slight left") || s.includes("keep left")) return "bearLeft";
  if (s.includes("slight right") || s.includes("keep right")) return "bearRight";
  if (s.includes("left")) return "turnLeft";
  if (s.includes("right")) return "turnRight";
  if (s.includes("merge")) return "merge";
  return "straight";
}

const metres = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

function buildLeafletHTML(route: Coord[], hospital: Coord, name: string, address: string, me: Coord): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}.css"/><script src="${LEAFLET}.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100vh;overflow:hidden}${MAP_CSS}</style>
</head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false, attributionControl: true });
  map.attributionControl.setPrefix(false);
  var base = L.tileLayer('${TILE_STANDARD}', { attribution: '${ATTR_STANDARD}', maxZoom: 19 }).addTo(map);
  function setMapType(type) {
    map.removeLayer(base);
    base = L.tileLayer(type === 'satellite' ? '${TILE_SATELLITE}' : '${TILE_STANDARD}',
      { attribution: type === 'satellite' ? '${ATTR_SATELLITE}' : '${ATTR_STANDARD}', maxZoom: 19 }).addTo(map);
    base.bringToBack();
  }
  function setBottom(px) { var b = document.querySelector('.leaflet-bottom'); if (b) b.style.bottom = px + 'px'; }
  var coords = ${JSON.stringify(route.map((c) => [c.latitude, c.longitude]))};
  if (coords.length > 1) map.fitBounds(L.polyline(coords, ${JSON.stringify(ROUTE_STYLE)}).addTo(map).getBounds(), { padding: [72, 72] });
  else map.fitBounds(L.polyline([[${me.latitude}, ${me.longitude}], [${hospital.latitude}, ${hospital.longitude}]], ${JSON.stringify(STRAIGHT_STYLE)}).addTo(map).getBounds(), { padding: [72, 72] });
  L.marker([${hospital.latitude}, ${hospital.longitude}], { icon: L.divIcon({ className: '', html: '${HOSPITAL_PIN}', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -46] }) })
    .addTo(map).bindPopup(${JSON.stringify(`<b>${htmlEsc(name)}</b><br/>${htmlEsc(address)}`)});
  var me = L.marker([${me.latitude}, ${me.longitude}], { icon: L.divIcon({ className: '', html: '${ME_DOT}', iconSize: [22, 22], iconAnchor: [11, 11] }), zIndexOffset: 1000 }).addTo(map);
  function updateUserLocation(lat, lng, follow) { me.setLatLng([lat, lng]); if (follow) map.panTo([lat, lng], { animate: true, duration: 1 }); }
  map.on('dragstart', function () { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('drag'); });
</script></body></html>`;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduce);
    return () => sub?.remove?.();
  }, []);
  return reduce;
}

export default function DutyMapScreen() {
  const { id, hospitalName } = useLocalSearchParams<{ id: string; hospitalName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const reduceMotion = useReduceMotion();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [routeData, setRouteData] = useState<DutyRouteApiResponse | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [cardH, setCardH] = useState(0);

  const webViewRef = useRef<any>(null);
  const mapDivRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const arrivedRef = useRef(false);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "web") injectLeafletCSS();
    init();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the map's attribution above the bottom card.
  useEffect(() => {
    const px = cardH ? cardH + 24 : 0;
    if (Platform.OS === "web") {
      const el = mapDivRef.current?.querySelector?.(".leaflet-bottom") as HTMLElement | null;
      if (el) el.style.bottom = `${px}px`;
    } else webViewRef.current?.injectJavaScript(`setBottom(${px});true;`);
  }, [cardH, screenState]);

  const cleanup = () => {
    locationSubRef.current?.remove();
    if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  const injectLeafletCSS = () => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `${LEAFLET}.css`;
      document.head.appendChild(link);
    }
    if (!document.getElementById("hl-map-css")) {
      const style = document.createElement("style");
      style.id = "hl-map-css";
      style.innerHTML = MAP_CSS;
      document.head.appendChild(style);
    }
  };

  const init = async () => {
    setScreenState("loading");
    if (Platform.OS === "web") {
      if (!navigator.geolocation) {
        setErrorMsg("This browser can't share your location. Open the duty on your phone for directions.");
        setScreenState("error");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(loc);
          await loadRoute(loc);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setScreenState("permission_denied");
          else {
            setErrorMsg("We couldn't find where you are. Check that location is on, then try again.");
            setScreenState("error");
          }
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
      return;
    }
    const { status: existing } = await ExpoLocation.getForegroundPermissionsAsync();
    let status = existing;
    if (existing !== "granted") status = (await ExpoLocation.requestForegroundPermissionsAsync()).status;
    if (status !== "granted") {
      setScreenState("permission_denied");
      return;
    }
    try {
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCurrentLocation(loc);
      await loadRoute(loc);
    } catch {
      setErrorMsg("We couldn't find where you are. Check that location is on, then try again.");
      setScreenState("error");
    }
  };

  const loadRoute = async (loc: Coord) => {
    try {
      const data = await fetchDutyRoute(id, loc);
      setRouteData(data);
      let coords: Coord[] = (data.route.stepPolylines ?? []).flatMap((sp: string) => {
        try {
          return decodePolyline(sp);
        } catch {
          return [];
        }
      });
      if (coords.length < 2) coords = decodeOverview(data.route.overviewPolyline).map(([latitude, longitude]) => ({ latitude, longitude }));
      setRouteCoords(coords);
      setScreenState("navigating");
      if (reduceMotion) enter.setValue(1);
      else Animated.timing(enter, { toValue: 1, duration: 240, delay: 120, easing: Easing.out(Easing.exp), useNativeDriver: Platform.OS !== "web" }).start();
      if (Platform.OS === "web") setTimeout(() => initWebMap(data, coords, loc), 50);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Try again in a moment.");
      setScreenState("error");
    }
  };

  const initWebMap = (data: DutyRouteApiResponse, coords: Coord[], loc: Coord) => {
    if (!mapDivRef.current) return;
    const boot = () => {
      const L = (window as any).L;
      if (!L || !mapDivRef.current) return;
      if (mapRef.current) mapRef.current.remove();
      const map = L.map(mapDivRef.current, { zoomControl: false });
      map.attributionControl.setPrefix(false);
      mapRef.current = map;
      tileRef.current = L.tileLayer(TILE_STANDARD, { attribution: ATTR_STANDARD, maxZoom: 19 }).addTo(map);
      const hosp = [data.hospital.location.latitude, data.hospital.location.longitude];
      if (coords.length > 1) map.fitBounds(L.polyline(coords.map((c) => [c.latitude, c.longitude]), ROUTE_STYLE).addTo(map).getBounds(), { padding: [72, 72] });
      else map.fitBounds(L.polyline([[loc.latitude, loc.longitude], hosp], STRAIGHT_STYLE).addTo(map).getBounds(), { padding: [72, 72] });
      const pin = L.divIcon({ className: "", html: HOSPITAL_PIN, iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -46] });
      L.marker([data.hospital.location.latitude, data.hospital.location.longitude], { icon: pin })
        .addTo(map)
        .bindPopup(`<b>${htmlEsc(data.hospital.name)}</b><br/>${htmlEsc(data.hospital.address ?? "")}`);
      const me = L.divIcon({ className: "", html: ME_DOT, iconSize: [22, 22], iconAnchor: [11, 11] });
      meMarkerRef.current = L.marker([loc.latitude, loc.longitude], { icon: me, zIndexOffset: 1000 }).addTo(map);
      map.on("dragstart", () => setIsFollowing(false));
      const el = mapDivRef.current.querySelector(".leaflet-bottom") as HTMLElement | null;
      if (el && cardH) el.style.bottom = `${cardH + 24}px`;
    };
    if (!(window as any).L) {
      const s = document.createElement("script");
      s.src = `${LEAFLET}.js`;
      s.onload = boot;
      document.head.appendChild(s);
    } else boot();
  };

  const toggleMapType = () => {
    const next = mapType === "standard" ? "satellite" : "standard";
    setMapType(next);
    if (Platform.OS === "web") {
      const L = (window as any).L;
      const map = mapRef.current;
      if (!L || !map) return;
      if (tileRef.current) map.removeLayer(tileRef.current);
      tileRef.current = L.tileLayer(next === "satellite" ? TILE_SATELLITE : TILE_STANDARD, {
        attribution: next === "satellite" ? ATTR_SATELLITE : ATTR_STANDARD,
        maxZoom: 19,
      }).addTo(map);
      tileRef.current.bringToBack();
    } else webViewRef.current?.injectJavaScript(`setMapType('${next}');true;`);
  };

  const zoomBy = (delta: number) => {
    if (Platform.OS === "web") mapRef.current?.setZoom(mapRef.current.getZoom() + delta);
    else webViewRef.current?.injectJavaScript(`map.setZoom(map.getZoom()+(${delta}));true;`);
  };

  const recenter = () => {
    setIsFollowing(true);
    if (!currentLocation) return;
    const { latitude, longitude } = currentLocation;
    if (Platform.OS === "web") mapRef.current?.setView([latitude, longitude], 16, { animate: true });
    else webViewRef.current?.injectJavaScript(`map.setView([${latitude},${longitude}],16,{animate:true});true;`);
  };

  const startNavigation = async () => {
    setNavigating(true);
    setIsFollowing(true);
    if (Platform.OS === "web") {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {
          snack("Your location stopped updating. Start again when you have a signal.", { tone: "warning" });
          stopNavigation();
        },
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
    } else {
      locationSubRef.current = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 2000 },
        (pos: any) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      );
    }
  };

  const stopNavigation = () => {
    if (Platform.OS === "web") {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    } else {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    }
    setNavigating(false);
  };

  const onLocationUpdate = useCallback(
    (loc: Coord) => {
      setCurrentLocation(loc);
      if (Platform.OS === "web") {
        meMarkerRef.current?.setLatLng([loc.latitude, loc.longitude]);
        if (isFollowing) mapRef.current?.panTo([loc.latitude, loc.longitude], { animate: true, duration: 1 });
      } else webViewRef.current?.injectJavaScript(`updateUserLocation(${loc.latitude},${loc.longitude},${isFollowing});true;`);
      if (!routeData || arrivedRef.current) return;
      setStepIndex((prev) => {
        const steps = routeData.route.steps;
        for (let i = prev; i < steps.length; i++) {
          if (haversineMeters(loc, { latitude: steps[i].endLocation.lat, longitude: steps[i].endLocation.lng }) < 50) return Math.min(i + 1, steps.length - 1);
        }
        return prev;
      });
      // Arrival here is only a hint; the server's own 100 m check decides the start code.
      if (haversineMeters(loc, routeData.hospital.location) < (routeData.tracking?.arrivalThreshold ?? 100)) {
        arrivedRef.current = true;
        stopNavigation();
        snack(`You're at ${routeData.hospital.name}. Ask the duty desk for your start code.`, { tone: "success" });
        router.replace(`/medicalStaff/dutyDetails/${id}?step=start` as any);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeData, isFollowing]
  );

  const leave = () => {
    stopNavigation();
    if (router.canGoBack()) router.back();
    else router.replace(`/medicalStaff/dutyDetails/${id}` as any);
  };

  const step = routeData?.route.steps[stepIndex] ?? null;
  const totalSteps = routeData?.route.steps.length ?? 0;
  const name = routeData?.hospital.name ?? hospitalName ?? "the hospital";

  if (screenState === "loading")
    return (
      <View style={styles.fill}>
        <ScreenHeader title="Directions" onBack={leave} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.primary} />
          <Txt v="body" tone="soft">
            Finding where you are…
          </Txt>
        </View>
      </View>
    );

  if (screenState === "permission_denied")
    return (
      <View style={styles.fill}>
        <ScreenHeader title="Directions" onBack={leave} />
        <EmptyState
          icon="locationOff"
          tone="warning"
          title="Location is off"
          body="Allow location to see the route to the hospital. We only use it while the app is open."
          action="Allow location"
          onAction={init}
          secondary="Go back"
          onSecondary={leave}
        />
      </View>
    );

  if (screenState === "error")
    return (
      <View style={styles.fill}>
        <ScreenHeader title="Directions" onBack={leave} />
        <EmptyState
          icon="navigate"
          tone="warning"
          title="The route isn't available"
          body={errorMsg || "Try again in a moment."}
          action="Try again"
          onAction={init}
          secondary="Go back"
          onSecondary={leave}
        />
      </View>
    );

  const slide = (from: number) => ({
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });
  const bottomGap = Math.max(insets.bottom, 12) + 4;

  return (
    <View style={styles.fill} testID="duty-map">
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === "web"
          ? createElement("div", { ref: mapDivRef, style: { position: "absolute", inset: 0, zIndex: 0 }, "aria-label": `Map of the route to ${name}` })
          : currentLocation &&
            routeData &&
            NativeWebView && (
              <NativeWebView
                ref={webViewRef}
                source={{ html: buildLeafletHTML(routeCoords, routeData.hospital.location, routeData.hospital.name, routeData.hospital.address ?? "", currentLocation) }}
                style={StyleSheet.absoluteFill}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                onMessage={(e: any) => e?.nativeEvent?.data === "drag" && setIsFollowing(false)}
                onLoadEnd={() => cardH && webViewRef.current?.injectJavaScript(`setBottom(${cardH + 24});true;`)}
              />
            )}
      </View>

      {/* Top: back, where to, and the next turn */}
      <Animated.View style={[styles.top, wide && styles.topWide, slide(-16)]} pointerEvents="box-none">
        <View style={styles.titleRow}>
          <View style={[glass, depth.floating, styles.glassRound]}>
            <IconButton icon="back" label="Leave the map" onPress={leave} size={48} />
          </View>
          <View style={[glass, depth.floating, styles.titleCard]}>
            <Txt v="title" numberOfLines={1} accessibilityRole="header">
              Route to {name}
            </Txt>
            {routeData ? (
              <Txt v="figureSm" tone="soft" numberOfLines={1}>
                {routeData.route.durationText} · {routeData.route.distanceText}
              </Txt>
            ) : null}
          </View>
        </View>

        {step ? (
          <View style={[styles.turn, depth.floating]} accessibilityRole="text" accessibilityLiveRegion="polite" testID="map-next-turn">
            <View style={styles.turnIcon}>
              <Icon name={turnIcon(step.instruction)} size={28} color={color.onDark} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Txt v="rate" color={color.onDark}>
                {metres(step.distance)}
              </Txt>
              <Txt v="bodySm" color={color.onDarkMuted} numberOfLines={2}>
                {cleanInstruction(step.instruction)}
              </Txt>
            </View>
            <Txt v="caption" color={color.onDarkMuted} style={{ fontVariant: ["tabular-nums"], alignSelf: "flex-start" }}>
              {stepIndex + 1} of {totalSteps}
            </Txt>
          </View>
        ) : null}
      </Animated.View>

      {/* Right: map controls */}
      <Animated.View style={[styles.controls, { bottom: (cardH || 180) + bottomGap + 12 }, slide(12)]} pointerEvents="box-none">
        {!isFollowing ? (
          <View style={[glass, depth.floating, styles.glassRound]}>
            <IconButton icon="myLocation" label="Back to my location" onPress={recenter} size={48} />
          </View>
        ) : null}
        <View style={[glass, depth.floating, styles.glassRound]}>
          <IconButton
            icon={mapType === "standard" ? "mapSatellite" : "mapStreet"}
            label={mapType === "standard" ? "Show satellite view" : "Show street map"}
            onPress={toggleMapType}
            size={48}
          />
        </View>
        <View style={[glass, depth.floating, styles.zoom]}>
          <IconButton icon="plus" label="Zoom in" onPress={() => zoomBy(1)} size={48} />
          <View style={styles.zoomRule} />
          <IconButton icon="minus" label="Zoom out" onPress={() => zoomBy(-1)} size={48} />
        </View>
      </Animated.View>

      {/* Bottom: the hospital and the one action */}
      <Animated.View
        style={[styles.bottom, wide && styles.bottomWide, { bottom: bottomGap }, slide(24)]}
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
      >
        <Card tone="glass" pad={16} style={{ gap: 14, borderRadius: radius.card }}>
          <View style={styles.hospRow}>
            <IconTile name="hospital" tone="dark" size={44} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt v="title" numberOfLines={1}>
                {name}
              </Txt>
              {routeData?.hospital.address ? (
                <Txt v="bodySm" tone="soft" numberOfLines={2}>
                  {routeData.hospital.address}
                </Txt>
              ) : null}
            </View>
          </View>
          {routeData ? (
            <View style={styles.metaRow}>
              <Meta icon="time" text={routeData.route.durationText} tone="ink" />
              <Meta icon="nearby" text={routeData.route.distanceText} tone="ink" />
            </View>
          ) : null}
          <Button
            label={navigating ? "Stop following my location" : "Start trip"}
            icon={navigating ? "close" : "navigate"}
            variant={navigating ? "secondary" : "primary"}
            onPress={navigating ? stopNavigation : startNavigation}
            full
            size="lg"
            testID="map-start"
          />
          <Txt v="caption" tone="muted" align="center">
            {navigating
              ? "When you reach the hospital we'll open the duty so you can get your start code."
              : "We follow your location only while this screen is open."}
          </Txt>
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.ground },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  top: { position: "absolute", top: 12, left: 12, right: 12, gap: 10, zIndex: 20 },
  topWide: { left: 24, right: "auto" as any, width: 420 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  // Small controls sit on busy map labels: near-solid so they stay legible.
  glassRound: { borderRadius: 24, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.92)" },
  titleCard: { flex: 1, minWidth: 0, minHeight: 48, borderRadius: radius.input, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center" },
  turn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: radius.card, backgroundColor: color.ink },
  turnIcon: { width: 52, height: 52, borderRadius: radius.icon, backgroundColor: color.primary, alignItems: "center", justifyContent: "center" },
  controls: { position: "absolute", right: 12, gap: 10, alignItems: "center", zIndex: 20 },
  zoom: { borderRadius: 24, overflow: "hidden", alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)" },
  zoomRule: { height: 1, width: 28, backgroundColor: color.line },
  bottom: { position: "absolute", left: 12, right: 12, zIndex: 20 },
  bottomWide: { left: 24, right: "auto" as any, width: 420 },
  hospRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
});
