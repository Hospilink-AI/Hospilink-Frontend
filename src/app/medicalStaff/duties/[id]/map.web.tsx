// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { fetchDutyRoute } from "../../../../service/dutyService";
// import { DutyRouteApiResponse } from "../../../../types/duty";
// import { decodePolyline, haversineMeters } from "../../../../utils/polylineDecoder";

// // ─── Inject Leaflet CSS ────────────────────────────────────────────────────
// function injectLeafletCSS() {
//     if (typeof document === "undefined") return;
//     if (document.getElementById("leaflet-css")) return;
//     const link = document.createElement("link");
//     link.id = "leaflet-css";
//     link.rel = "stylesheet";
//     link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//     document.head.appendChild(link);
//     const style = document.createElement("style");
//     style.innerHTML = `
//     html, body, #root { margin: 0; padding: 0; height: 100%; }
//     .leaflet-container { font-family: inherit; }
//     .leaflet-control-zoom {
//       border: none !important;
//       box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
//       border-radius: 10px !important; overflow: hidden;
//     }
//     .leaflet-control-zoom a {
//       color: #374151 !important; font-weight: 300 !important;
//       font-size: 18px !important; width: 36px !important;
//       height: 36px !important; line-height: 36px !important;
//     }
//     .leaflet-control-zoom-in { border-bottom: 1px solid #E2E8F0 !important; }
//     .user-location-pulse {
//       width: 20px; height: 20px; background: #2563EB;
//       border: 3px solid #fff; border-radius: 50%;
//       box-shadow: 0 0 0 6px rgba(37,99,235,0.2);
//       animation: pulse 2s infinite;
//     }
//     @keyframes pulse {
//       0%   { box-shadow: 0 0 0 0   rgba(37,99,235,0.4); }
//       70%  { box-shadow: 0 0 0 10px rgba(37,99,235,0);  }
//       100% { box-shadow: 0 0 0 0   rgba(37,99,235,0);  }
//     }
//     .hospital-pin {
//       width: 40px; height: 40px; background: #DC2626;
//       border: 3px solid #fff; border-radius: 50% 50% 50% 0;
//       transform: rotate(-45deg); display: flex;
//       align-items: center; justify-content: center;
//       box-shadow: 0 4px 14px rgba(220,38,38,0.45);
//     }
//     .hospital-pin-inner { transform: rotate(45deg); font-size: 17px; }
//   `;
//     document.head.appendChild(style);
// }

// // ─── Types ─────────────────────────────────────────────────────────────────
// type ScreenState = "loading" | "permission_denied" | "error" | "navigating";

// // ─── Helpers ───────────────────────────────────────────────────────────────
// function cleanInstruction(raw: string): string {
//     return raw.replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();
// }

// function stepArrow(instruction: string): string {
//     const s = instruction.toLowerCase();
//     if (s.includes("turn left")) return "↰";
//     if (s.includes("turn right")) return "↱";
//     if (s.includes("u-turn")) return "↩";
//     if (s.includes("slight left")) return "↖";
//     if (s.includes("slight right")) return "↗";
//     if (s.includes("keep left")) return "↖";
//     if (s.includes("keep right")) return "↗";
//     if (s.includes("merge")) return "⤵";
//     return "↑";
// }

// // ─── Main Component ────────────────────────────────────────────────────────
// export default function DutyMapScreenWeb() {
//     const { id, hospitalName } = useLocalSearchParams<{ id: string; hospitalName: string }>();
//     const router = useRouter();

//     const mapRef = useRef<any>(null);
//     const userMarkerRef = useRef<any>(null);
//     const watchIdRef = useRef<number | null>(null);
//     const mapContainerRef = useRef<HTMLDivElement | null>(null);

//     const [screenState, setScreenState] = useState<ScreenState>("loading");
//     const [routeData, setRouteData] = useState<DutyRouteApiResponse | null>(null);
//     const [stepIndex, setStepIndex] = useState(0);
//     const [errorMsg, setErrorMsg] = useState("");
//     const [navigationStarted, setNavigationStarted] = useState(false);


//     // ─── Safe back — works whether there's a history stack or not ─────────────
//     const handleBack = () => {
//         stopNavigation();
//         try {
//             if (router.canGoBack()) {
//                 router.back();
//             } else {
//                 // ← Change this to your actual dashboard path if needed
//                 router.replace("/medicalStaff/dashboard" as any);
//             }
//         } catch {
//             router.replace("/medicalStaff/dashboard" as any);
//         }
//     };

//     // ─── Mount ────────────────────────────────────────────────────────────────
//     useEffect(() => {
//         injectLeafletCSS();
//         init();
//         return () => {
//             stopNavigation();
//             if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
//         };
//     }, []);

//     // ─── Get location → fetch route ───────────────────────────────────────────
//     const init = async () => {
//         setScreenState("loading");
//         if (!navigator.geolocation) {
//             setErrorMsg("Geolocation is not supported by your browser.");
//             setScreenState("error");
//             return;
//         }
//         navigator.geolocation.getCurrentPosition(
//             async (pos) => {
//                 const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//                 await loadRoute(loc);
//             },
//             (err) => {
//                 if (err.code === err.PERMISSION_DENIED) setScreenState("permission_denied");
//                 else { setErrorMsg(err.message); setScreenState("error"); }
//             },
//             { enableHighAccuracy: true, timeout: 15000 }
//         );
//     };

//     // ─── Call backend API ─────────────────────────────────────────────────────
//     const loadRoute = async (loc: { latitude: number; longitude: number }) => {
//         try {
//             const data = await fetchDutyRoute(id, loc);
//             setRouteData(data);
//             setScreenState("navigating");
//             setTimeout(() => initLeafletMap(data, loc), 150);
//         } catch (err: any) {
//             setErrorMsg(err.message ?? "Failed to load route");
//             setScreenState("error");
//         }
//     };

//     // ─── Build Leaflet map ────────────────────────────────────────────────────
//     const initLeafletMap = async (
//         data: DutyRouteApiResponse,
//         loc: { latitude: number; longitude: number }
//     ) => {
//         if (!mapContainerRef.current) return;
//         const L = await import("leaflet" as any);
//         if (mapRef.current) { mapRef.current.remove(); }

//         const map = L.map(mapContainerRef.current, {
//             center: [loc.latitude, loc.longitude],
//             zoom: 13, zoomControl: true,
//         });
//         mapRef.current = map;

//         // Free OpenStreetMap tiles
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//             attribution: "© OpenStreetMap contributors", maxZoom: 19,
//         }).addTo(map);

//         // Blue route polyline - use step polylines for better road accuracy
//         const allCoords = data.route.stepPolylines.flatMap(stepPolyline => {
//         try {
//             return decodePolyline(stepPolyline);
//         } catch (error) {
//             console.warn("Failed to decode step polyline:", error);
//             return [];
//         }
//         });
//         const coords = allCoords;
//         if (coords.length === 0) {
//             console.warn("No valid polyline data available for route display");
//             return;
//         }
//         const latLngs = coords.map((c) => [c.latitude, c.longitude]);
//         const poly = L.polyline(latLngs, {
//             color: "#2563EB", weight: 5, opacity: 0.92, lineCap: "round", lineJoin: "round",
//         }).addTo(map);
//         map.fitBounds(poly.getBounds(), { padding: [80, 80] });

//         // Pulsing blue user dot
//         const userIcon = L.divIcon({
//             html: '<div class="user-location-pulse"></div>',
//             iconSize: [20, 20], iconAnchor: [10, 10], className: "",
//         });
//         userMarkerRef.current = L.marker([loc.latitude, loc.longitude], { icon: userIcon }).addTo(map);

//         // Red hospital pin
//         const hospitalIcon = L.divIcon({
//             html: '<div class="hospital-pin"><div class="hospital-pin-inner">🏥</div></div>',
//             iconSize: [40, 40], iconAnchor: [20, 40], className: "",
//         });
//         L.marker(
//             [data.hospital.location.latitude, data.hospital.location.longitude],
//             { icon: hospitalIcon }
//         ).addTo(map)
//             .bindPopup(`<b>${data.hospital.name}</b><br/><small>${data.hospital.address}</small>`);

//         // Green start dot
//         const startIcon = L.divIcon({
//             html: '<div style="width:14px;height:14px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(34,197,94,0.45)"></div>',
//             iconSize: [14, 14], iconAnchor: [7, 7], className: "",
//         });
//         L.marker([loc.latitude, loc.longitude], { icon: startIcon }).addTo(map);
//     };

//     // ─── Navigation controls ──────────────────────────────────────────────────
//     const startNavigation = () => {
//         setNavigationStarted(true);
//         watchIdRef.current = navigator.geolocation.watchPosition(
//             (pos) => handleLocationUpdate({
//                 latitude: pos.coords.latitude,
//                 longitude: pos.coords.longitude,
//             }),
//             (err) => {
//                 if (err.code === err.POSITION_UNAVAILABLE) {
//                     alert("Location services turned off. Navigation stopped.");
//                     stopNavigation();
//                 }
//             },
//             { enableHighAccuracy: true, maximumAge: 2000 }
//         );
//     };

//     const stopNavigation = () => {
//         if (watchIdRef.current !== null) {
//             navigator.geolocation.clearWatch(watchIdRef.current);
//             watchIdRef.current = null;
//         }
//         setNavigationStarted(false);
//     };

//     // ─── Location update handler ──────────────────────────────────────────────
//     const handleLocationUpdate = useCallback(
//         (loc: { latitude: number; longitude: number }) => {
//             userMarkerRef.current?.setLatLng([loc.latitude, loc.longitude]);
//             mapRef.current?.panTo([loc.latitude, loc.longitude], { animate: true, duration: 1 });

//             if (routeData) {
//                 // Advance step
//                 setStepIndex((prev) => {
//                     const steps = routeData.route.steps;
//                     for (let i = prev; i < steps.length; i++) {
//                         const d = haversineMeters(loc, {
//                             latitude: steps[i].endLocation.lat,
//                             longitude: steps[i].endLocation.lng,
//                         });
//                         if (d < 50) return Math.min(i + 1, steps.length - 1);
//                     }
//                     return prev;
//                 });

//                 // Arrival check
//                 const dist = haversineMeters(loc, routeData.hospital.location);
//                 if (dist < (routeData.tracking.arrivalThreshold ?? 100)) {
//                     stopNavigation();
//                     alert(`🏥 You have arrived at ${routeData.hospital.name}!`);
//                     handleBack();
//                 }
//             }
//         },
//         [routeData]
//     );

//     const currentStep = routeData?.route.steps[stepIndex] ?? null;

//     // ─── Render: Loading ───────────────────────────────────────────────────────
//     if (screenState === "loading") {
//         return (
//             <View style={styles.centered}>
//                 <ActivityIndicator size="large" color="#2563EB" />
//                 <Text style={styles.loadingText}>Getting your location…</Text>
//             </View>
//         );
//     }

//     // ─── Render: Permission Denied ─────────────────────────────────────────────
//     if (screenState === "permission_denied") {
//         return (
//             <View style={styles.centered}>
//                 <Text style={styles.bigEmoji}>📍</Text>
//                 <Text style={styles.stateTitle}>Location Required</Text>
//                 <Text style={styles.stateSubtitle}>
//                     Please allow location access in your browser to view navigation.
//                 </Text>
//                 <TouchableOpacity style={styles.primaryBtn} onPress={init}>
//                     <Text style={styles.primaryBtnText}>Try Again</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}>
//                     <Text style={styles.ghostBtnText}>Go Back</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     }

//     // ─── Render: Error ─────────────────────────────────────────────────────────
//     if (screenState === "error") {
//         return (
//             <View style={styles.centered}>
//                 <Text style={styles.bigEmoji}>⚠️</Text>
//                 <Text style={styles.stateTitle}>Something went wrong</Text>
//                 <Text style={styles.stateSubtitle}>{errorMsg}</Text>
//                 <TouchableOpacity
//                     style={styles.primaryBtn}
//                     onPress={() => { setScreenState("loading"); init(); }}
//                 >
//                     <Text style={styles.primaryBtnText}>Retry</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}>
//                     <Text style={styles.ghostBtnText}>Go Back</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     }

//     // ─── Render: Map ───────────────────────────────────────────────────────────
//     return (
//         <View style={styles.container}>

//             {/* ── TOP HEADER — everything in ONE row ── */}
//             <View style={styles.topBar}>

//                 {/* Back button */}
//                 <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
//                     <Text style={styles.backBtnText}>←</Text>
//                 </TouchableOpacity>

//                 {/* Title */}
//                 <Text style={styles.topBarTitle}>Active Duty Route</Text>

//                 {/* Distance · Duration */}
//                 {routeData && (
//                     <Text style={styles.topBarSub} numberOfLines={1}>
//                         · {routeData.route.distanceText} · {routeData.route.durationText}
//                     </Text>
//                 )}

//                 {/* Pushes On Call badge to right */}
//                 <View style={{ flex: 1 }} />

//                 {/* On Call badge */}
//                 <View style={styles.onCallBadge}>
//                     <View style={styles.onCallDot} />
//                     <Text style={styles.onCallText}>On Call</Text>
//                 </View>

//             </View>

//             {/* ── STEP BANNER ── */}
//             {currentStep && (
//                 <View style={styles.stepBanner}>
//                     <Text style={styles.stepArrowText}>{stepArrow(currentStep.instruction)}</Text>
//                     <Text style={styles.stepInstruction} numberOfLines={1}>
//                         {cleanInstruction(currentStep.instruction)}
//                     </Text>
//                     <Text style={styles.stepDist}>
//                         {currentStep.distance < 1
//                             ? `· in ${Math.round(currentStep.distance * 1000)} m`
//                             : `· in ${currentStep.distance.toFixed(1)} km`}
//                     </Text>
//                     <View style={{ flex: 1 }} />
//                     <Text style={styles.stepCount}>
//                         {stepIndex + 1}/{routeData?.route.steps.length}
//                     </Text>
//                 </View>
//             )}

//             {/* ── MAP WRAPPER ── */}
//             <View style={styles.mapWrapper}>

//                 {/* Leaflet fills entire wrapper */}
//                 <div
//                     ref={mapContainerRef}
//                     style={{ position: "absolute", inset: 0, zIndex: 0 }}
//                 />

//                 {/* ── FLOATING CARD — overlaid on map, single row ── */}
//                 {/* ── FLOATING CARD — 2 rows ── */}
//                 <View style={styles.floatingCard}>

//                     {/* Row 1: Hospital icon + name + address */}
//                     <View style={styles.cardRow1}>
//                         <View style={styles.hospitalIconBox}>
//                             <Text style={{ fontSize: 16 }}>🏥</Text>
//                         </View>
//                         <View style={styles.hospitalInfo}>
//                             <Text style={styles.hospitalName} numberOfLines={1}>
//                                 {routeData?.hospital.name ?? hospitalName}
//                             </Text>
//                             <Text style={styles.hospitalAddress} numberOfLines={1}>
//                                 {routeData?.hospital.address ?? ""}
//                             </Text>
//                         </View>
//                     </View>

//                     {/* Row 2: Stats + Buttons */}
//                     <View style={styles.cardRow2}>
//                         <View style={styles.statItem}>
//                             <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
//                             <Text style={styles.statValueGreen}>
//                                 {routeData?.route.durationText?.split(" ")[0] ?? "--"}
//                             </Text>
//                             <Text style={styles.statLabel}>
//                                 {routeData?.route.durationText?.split(" ").slice(1).join(" ") ?? "mins"}
//                             </Text>
//                         </View>
//                         <View style={styles.statItem}>
//                             <View style={[styles.statDot, { backgroundColor: "#64748B" }]} />
//                             <Text style={styles.statValue}>{routeData?.route.distanceText ?? "--"}</Text>
//                         </View>
//                         <View style={{ flex: 1 }} />
//                         <TouchableOpacity style={styles.exitBtn} onPress={handleBack}>
//                             <Text style={styles.exitBtnText}>Exit Map</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                             style={[styles.startBtn, navigationStarted && styles.startBtnActive]}
//                             onPress={navigationStarted ? stopNavigation : startNavigation}
//                         >
//                             <Text style={styles.startBtnText}>
//                                 {navigationStarted ? "⏹ Stop" : "▲ Start Navigation"}
//                             </Text>
//                         </TouchableOpacity>
//                     </View>

//                 </View>
//             </View>

//         </View>
//     );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//     container: {
//         flex: 1, flexDirection: "column",
//         backgroundColor: "#F1F5F9",
//         overflow: "hidden" as any,
//     },

//     // Loading / error
//     centered: {
//         flex: 1, alignItems: "center", justifyContent: "center",
//         backgroundColor: "#fff", padding: 28,
//     },
//     loadingText: { marginTop: 14, fontSize: 16, color: "#64748B" },
//     bigEmoji: { fontSize: 64, marginBottom: 16 },
//     stateTitle: { fontSize: 22, fontWeight: "700", color: "#0F172A", textAlign: "center" },
//     stateSubtitle: {
//         fontSize: 15, color: "#64748B", textAlign: "center",
//         marginTop: 8, marginBottom: 32, lineHeight: 22,
//     },
//     primaryBtn: {
//         backgroundColor: "#2563EB", borderRadius: 14,
//         paddingVertical: 14, paddingHorizontal: 32,
//         width: "100%", alignItems: "center", marginBottom: 12,
//     },
//     primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
//     ghostBtn: { paddingVertical: 12 },
//     ghostBtnText: { color: "#64748B", fontSize: 15 },

//     // Top bar — single row
//     topBar: {
//         flexDirection: "row",
//         alignItems: "center",
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//         backgroundColor: "#fff",
//         borderBottomWidth: 1,
//         borderBottomColor: "#F1F5F9",
//         zIndex: 20,
//         gap: 6,
//     },
//     backBtn: {
//         width: 30, height: 30, borderRadius: 15,
//         backgroundColor: "#F8FAFC",
//         alignItems: "center", justifyContent: "center",
//         flexShrink: 0,
//     },
//     backBtnText: { fontSize: 16, color: "#374151" },
//     topBarTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", flexShrink: 0 },
//     topBarSub: { fontSize: 13, color: "#64748B", flexShrink: 1 },
//     onCallBadge: {
//         flexDirection: "row", alignItems: "center",
//         backgroundColor: "#DCFCE7",
//         paddingHorizontal: 10, paddingVertical: 4,
//         borderRadius: 12, gap: 5, flexShrink: 0,
//     },
//     onCallDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#16A34A" },
//     onCallText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

//     // Step banner
//     stepBanner: {
//         flexDirection: "row",
//         alignItems: "center",          // all on one line
//         backgroundColor: "#1E3A8A",
//         paddingVertical: 8,            // slimmer
//         paddingHorizontal: 16,
//         zIndex: 20,
//         gap: 6,
//     },
//     stepArrowText: { fontSize: 18, color: "#fff", flexShrink: 0 },
//     stepInstruction: { fontSize: 13, fontWeight: "600", color: "#fff", flexShrink: 1 },
//     stepDist: { fontSize: 12, color: "#93C5FD", flexShrink: 0 },
//     stepCount: { fontSize: 11, color: "#93C5FD", flexShrink: 0 },

//     // Map wrapper
//     mapWrapper: {
//         flex: 1,
//         position: "relative" as any,
//         overflow: "hidden" as any,
//     },

//     // Floating card
//     floatingCard: {
//   position: "absolute" as any,
//   bottom: 16,
//   left: "20%" as any,   // ← reduced width, centered
//   right: "20%" as any,
//   zIndex: 100,
//   backgroundColor: "#fff",
//   borderRadius: 12,
//   paddingHorizontal: 14,
//   paddingVertical: 10,
//   boxShadow: "0px 4px 24px rgba(15, 23, 42, 0.14)" as any,
// },
// cardRow1: {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 8,
//   marginBottom: 8,
// },
// cardRow2: {
//   flexDirection: "row",
//   alignItems: "center",
//   gap: 8,
// },


//     // Hospital
//     hospitalIconBox: {
//         width: 32, height: 32, borderRadius: 8,
//         backgroundColor: "#EFF6FF",
//         alignItems: "center", justifyContent: "center",
//         flexShrink: 0,
//     },
//     hospitalInfo: {
//         flex: 1,
//         minWidth: 0,
//     },
//     hospitalName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
//     hospitalAddress: { fontSize: 11, color: "#64748B", marginTop: 1 },

//     // Stats
//     statItem: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
//     statDot: { width: 7, height: 7, borderRadius: 4 },
//     statValueGreen: { fontSize: 13, fontWeight: "700", color: "#22C55E" },
//     statValue: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
//     statLabel: { fontSize: 11, color: "#64748B" },

//     // Buttons
//     exitBtn: {
//         paddingVertical: 7, paddingHorizontal: 12,
//         borderRadius: 8, borderWidth: 1.5, borderColor: "#E2E8F0",
//         backgroundColor: "#fff",
//         alignItems: "center", justifyContent: "center",
//         flexShrink: 0,
//     },
//     exitBtnText: { fontSize: 12, fontWeight: "600", color: "#374151" },
//     startBtn: {
//         paddingVertical: 7, paddingHorizontal: 14,
//         borderRadius: 8, backgroundColor: "#2563EB",
//         alignItems: "center", justifyContent: "center",
//         flexShrink: 0,
//     },
//     startBtnActive: { backgroundColor: "#DC2626" },
//     startBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
// });
