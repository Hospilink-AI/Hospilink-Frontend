// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import * as Location from "expo-location";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Linking,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import MapView, {
//   LatLng,
//   Marker,
//   Polyline,
//   PROVIDER_GOOGLE,
// } from "react-native-maps";

// import { fetchDutyRoute } from "../../../../service/dutyService";
// import { DutyRouteApiResponse, RouteStep } from "../../../../types/duty";
// import {
//   calcBearing,
//   decodePolyline,
//   haversineMeters,
// } from "../../../../utils/polylineDecoder";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type ScreenState =
//   | "loading"
//   | "permission_denied"
//   | "error"
//   | "navigating"
//   | "arrived";

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function DutyMapScreen() {
//   const { id, hospitalName } = useLocalSearchParams<{
//     id: string;
//     hospitalName: string;
//   }>();
//   const router = useRouter();

//   const mapRef = useRef<MapView>(null);
//   const locationSub = useRef<Location.LocationSubscription | null>(null);
//   const bottomAnim = useRef(new Animated.Value(260)).current;
//   const bannerAnim = useRef(new Animated.Value(-100)).current;

//   const [screenState, setScreenState] = useState<ScreenState>("loading");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [routeData, setRouteData] = useState<DutyRouteApiResponse | null>(null);
//   const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [bearing, setBearing] = useState(0);
//   const [stepIndex, setStepIndex] = useState(0);
//   const [isFollowing, setIsFollowing] = useState(true);
//   const [navigationStarted, setNavigationStarted] = useState(false);

//   // ── TODO: Replace with auth context ────────────────────────────────────────
//   const authToken = "YOUR_TOKEN";

//   // ─── Init ──────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     init();
//     return () => locationSub.current?.remove();
//   }, []);

//   const init = async () => {
//     setScreenState("loading");

//     // 1. Check/request permission
//     const { status: existing } = await Location.getForegroundPermissionsAsync();
//     let finalStatus = existing;
//     if (existing !== "granted") {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== "granted") {
//       setScreenState("permission_denied");
//       return;
//     }

//     // 2. Get current position
//     try {
//       const pos = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });
//       const loc = {
//         latitude: pos.coords.latitude,
//         longitude: pos.coords.longitude,
//       };
//       setCurrentLocation(loc);
//       await loadRoute(loc);
//     } catch (err: any) {
//       setErrorMsg(err.message ?? "Could not get location");
//       setScreenState("error");
//     }
//   };

//   // ─── Load route from API ───────────────────────────────────────────────────
//   const loadRoute = async (loc: {
//     latitude: number;
//     longitude: number;
//   }) => {
//     try {
//       const data = await fetchDutyRoute(id, loc);
//       setRouteData(data);

//       const coords = decodePolyline(data.route.overviewPolyline);
//       setPolylineCoords(coords);

//       setScreenState("navigating");

//       // Animate in bottom panel + step banner
//       Animated.parallel([
//         Animated.spring(bottomAnim, {
//           toValue: 0,
//           useNativeDriver: true,
//           tension: 65,
//           friction: 11,
//         }),
//         Animated.spring(bannerAnim, {
//           toValue: 0,
//           useNativeDriver: true,
//           tension: 65,
//           friction: 11,
//           delay: 200,
//         }),
//       ]).start();

//       // Fit route on map
//       setTimeout(() => {
//         mapRef.current?.fitToCoordinates(coords, {
//           edgePadding: { top: 120, right: 40, bottom: 280, left: 40 },
//           animated: true,
//         });
//       }, 600);
//     } catch (err: any) {
//       setErrorMsg(err.message ?? "Failed to load route");
//       setScreenState("error");
//     }
//   };

//   // ─── Start live GPS tracking (on "Start Navigation" press) ────────────────
//   const startNavigation = async () => {
//     setNavigationStarted(true);
//     locationSub.current = await Location.watchPositionAsync(
//       {
//         accuracy: Location.Accuracy.BestForNavigation,
//         distanceInterval: 10,
//         timeInterval: 2000, // matches backend updateInterval
//       },
//       (pos) => {
//         onLocationUpdate({
//           latitude: pos.coords.latitude,
//           longitude: pos.coords.longitude,
//           heading: pos.coords.heading ?? 0,
//         });
//       }
//     );
//   };

//   // ─── Handle location updates ───────────────────────────────────────────────
//   const onLocationUpdate = useCallback(
//     (loc: { latitude: number; longitude: number; heading: number }) => {
//       setCurrentLocation(loc);

//       // Update bearing for marker rotation
//       if (polylineCoords.length > 1) {
//         const idx = closestIndex(loc, polylineCoords);
//         if (idx < polylineCoords.length - 1) {
//           setBearing(calcBearing(polylineCoords[idx], polylineCoords[idx + 1]));
//         }
//       }

//       // Follow camera
//       if (isFollowing) {
//         mapRef.current?.animateCamera(
//           {
//             center: loc,
//             heading: loc.heading || bearing,
//             pitch: 45,
//             zoom: 17,
//           },
//           { duration: 1000 }
//         );
//       }

//       // Advance step + check arrival
//       if (routeData) {
//         advanceStep(loc, routeData.route.steps);
//         checkArrival(loc, routeData);
//       }
//     },
//     [polylineCoords, isFollowing, bearing, routeData, stepIndex]
//   );

//   const closestIndex = (
//     loc: { latitude: number; longitude: number },
//     coords: LatLng[]
//   ): number => {
//     let min = Infinity,
//       idx = 0;
//     coords.forEach((c, i) => {
//       const d = haversineMeters(loc, c);
//       if (d < min) {
//         min = d;
//         idx = i;
//       }
//     });
//     return idx;
//   };

//   const advanceStep = (
//     loc: { latitude: number; longitude: number },
//     steps: RouteStep[]
//   ) => {
//     setStepIndex((prev) => {
//       for (let i = prev; i < steps.length; i++) {
//         const d = haversineMeters(loc, {
//           latitude: steps[i].endLocation.lat,
//           longitude: steps[i].endLocation.lng,
//         });
//         if (d < 50) return Math.min(i + 1, steps.length - 1);
//       }
//       return prev;
//     });
//   };

//   const checkArrival = (
//     loc: { latitude: number; longitude: number },
//     data: DutyRouteApiResponse
//   ) => {
//     const dist = haversineMeters(loc, data.hospital.location);
//     if (dist < (data.tracking.arrivalThreshold ?? 100)) {
//       locationSub.current?.remove();
//       setScreenState("arrived");
//       Alert.alert("🏥 Arrived!", `You have reached ${data.hospital.name}`, [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     }
//   };

//   // ─── Location disabled mid-session ────────────────────────────────────────
//   useEffect(() => {
//     if (screenState !== "navigating" || !navigationStarted) return;
//     const interval = setInterval(async () => {
//       const enabled = await Location.hasServicesEnabledAsync();
//       if (!enabled) {
//         locationSub.current?.remove();
//         Alert.alert(
//           "Location Disabled",
//           "Your GPS was turned off. Navigation stopped.",
//           [
//             { text: "Go Back", onPress: () => router.back() },
//             {
//               text: "Enable GPS",
//               onPress: () =>
//                 Platform.OS === "ios"
//                   ? Linking.openURL("app-settings:")
//                   : Linking.sendIntent(
//                       "android.settings.LOCATION_SOURCE_SETTINGS"
//                     ),
//             },
//           ]
//         );
//       }
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [screenState, navigationStarted]);

//   // ─── Exit ──────────────────────────────────────────────────────────────────
//   const handleExit = () => {
//     Alert.alert("Exit Navigation", "Stop navigation and go back?", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Exit",
//         style: "destructive",
//         onPress: () => {
//           locationSub.current?.remove();
//           router.back();
//         },
//       },
//     ]);
//   };

//   const handleRecenter = () => {
//     setIsFollowing(true);
//     if (currentLocation) {
//       mapRef.current?.animateCamera(
//         { center: currentLocation, zoom: 17, pitch: 45, heading: bearing },
//         { duration: 800 }
//       );
//     }
//   };

//   // ─── Step instruction helpers ──────────────────────────────────────────────
//   const currentStep = routeData?.route.steps[stepIndex] ?? null;

//   const cleanInstruction = (raw: string) =>
//     raw.replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();

//   const stepArrow = (instruction: string): string => {
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
//   };

//   // ─── Screen: Loading ───────────────────────────────────────────────────────
//   if (screenState === "loading") {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text style={styles.loadingText}>Getting your location…</Text>
//       </View>
//     );
//   }

//   // ─── Screen: Permission Denied ─────────────────────────────────────────────
//   if (screenState === "permission_denied") {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.bigIcon}>📍</Text>
//         <Text style={styles.stateTitle}>Location Required</Text>
//         <Text style={styles.stateSubtitle}>
//           Location permission is required to show navigation directions to the
//           hospital.
//         </Text>
//         <TouchableOpacity style={styles.primaryBtn} onPress={init}>
//           <Text style={styles.primaryBtnText}>Grant Location Access</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
//           <Text style={styles.ghostBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // ─── Screen: Error ─────────────────────────────────────────────────────────
//   if (screenState === "error") {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.bigIcon}>⚠️</Text>
//         <Text style={styles.stateTitle}>Route Unavailable</Text>
//         <Text style={styles.stateSubtitle}>{errorMsg}</Text>
//         <TouchableOpacity
//           style={styles.primaryBtn}
//           onPress={() => {
//             setScreenState("loading");
//             init();
//           }}
//         >
//           <Text style={styles.primaryBtnText}>Retry</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
//           <Text style={styles.ghostBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // ─── Screen: Map ───────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" />

//       {/* ── MAP ── */}
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={StyleSheet.absoluteFill}
//         showsUserLocation={false}
//         showsMyLocationButton={false}
//         showsCompass={false}
//         showsTraffic={false}
//         onPanDrag={() => setIsFollowing(false)}
//         initialRegion={
//           currentLocation
//             ? {
//                 latitude: currentLocation.latitude,
//                 longitude: currentLocation.longitude,
//                 latitudeDelta: 0.08,
//                 longitudeDelta: 0.08,
//               }
//             : undefined
//         }
//       >
//         {/* Blue route polyline */}
//         {polylineCoords.length > 0 && (
//           <Polyline
//             coordinates={polylineCoords}
//             strokeColor="#2563EB"
//             strokeWidth={5}
//             lineCap="round"
//             lineJoin="round"
//           />
//         )}

//         {/* Current location marker */}
//         {currentLocation && (
//           <Marker
//             coordinate={currentLocation}
//             anchor={{ x: 0.5, y: 0.5 }}
//             rotation={bearing}
//             flat
//           >
//             <View style={styles.userDotRing}>
//               <View style={styles.userDotCore} />
//             </View>
//           </Marker>
//         )}

//         {/* Hospital destination marker */}
//         {routeData && (
//           <Marker
//             coordinate={routeData.hospital.location}
//             title={routeData.hospital.name}
//             description={routeData.hospital.address}
//           >
//             <View style={styles.hospitalPin}>
//               <View style={styles.hospitalPinInner}>
//                 <MaterialIcons name="local-hospital" size={18} color="#fff" />
//               </View>
//               <View style={styles.hospitalPinTip} />
//             </View>
//           </Marker>
//         )}
//       </MapView>

//       {/* ── TOP HEADER ── */}
//       <SafeAreaView style={styles.topBar}>
//         <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={20} color="#374151" />
//         </TouchableOpacity>

//         <View style={styles.topBarCenter}>
//           <Text style={styles.topBarTitle}>Active Duty Route</Text>
//         </View>

//         {/* On Call badge */}
//         <View style={styles.onCallBadge}>
//           <View style={styles.onCallDot} />
//           <Text style={styles.onCallText}>On Call</Text>
//         </View>

//         <TouchableOpacity style={styles.topBarIcon}>
//           <Ionicons name="notifications-outline" size={20} color="#374151" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.topBarIcon}>
//           <Ionicons name="help-circle-outline" size={20} color="#374151" />
//         </TouchableOpacity>
//       </SafeAreaView>

//       {/* ── SEARCH BAR (decorative, matches screenshot) ── */}
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={16} color="#94A3B8" />
//         <Text style={styles.searchText}>
//           {routeData?.hospital.name ?? hospitalName ?? "Search hospital..."}
//         </Text>
//         <Ionicons name="mic-outline" size={16} color="#94A3B8" />
//       </View>

//       {/* ── STEP INSTRUCTION BANNER ── */}
//       {currentStep && (
//         <Animated.View
//           style={[
//             styles.stepBanner,
//             { transform: [{ translateY: bannerAnim }] },
//           ]}
//         >
//           <Text style={styles.stepArrow}>
//             {stepArrow(currentStep.instruction)}
//           </Text>
//           <View style={styles.stepBody}>
//             <Text style={styles.stepInstruction} numberOfLines={2}>
//               {cleanInstruction(currentStep.instruction)}
//             </Text>
//             <Text style={styles.stepDist}>
//               {currentStep.distance < 1
//                 ? `in ${Math.round(currentStep.distance * 1000)} m`
//                 : `in ${currentStep.distance.toFixed(1)} km`}
//             </Text>
//           </View>
//           <Text style={styles.stepCount}>
//             {stepIndex + 1}/{routeData?.route.steps.length}
//           </Text>
//         </Animated.View>
//       )}

//       {/* ── RECENTER BUTTON ── */}
//       {!isFollowing && (
//         <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}>
//           <Ionicons name="locate" size={20} color="#2563EB" />
//         </TouchableOpacity>
//       )}

//       {/* ── ZOOM CONTROLS (matches screenshot) ── */}
//       <View style={styles.zoomControls}>
//         <TouchableOpacity
//           style={styles.zoomBtn}
//           onPress={() =>
//             mapRef.current?.getCamera().then((c) =>
//               mapRef.current?.animateCamera({ zoom: (c.zoom ?? 14) + 1 })
//             )
//           }
//         >
//           <Text style={styles.zoomBtnText}>+</Text>
//         </TouchableOpacity>
//         <View style={styles.zoomDivider} />
//         <TouchableOpacity
//           style={styles.zoomBtn}
//           onPress={() =>
//             mapRef.current?.getCamera().then((c) =>
//               mapRef.current?.animateCamera({ zoom: (c.zoom ?? 14) - 1 })
//             )
//           }
//         >
//           <Text style={styles.zoomBtnText}>−</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ── BOTTOM CARD ── */}
//       <Animated.View
//         style={[
//           styles.bottomCard,
//           { transform: [{ translateY: bottomAnim }] },
//         ]}
//       >
//         {/* Hospital info row */}
//         <View style={styles.hospitalRow}>
//           <View style={styles.hospitalIconBox}>
//             <MaterialIcons name="local-hospital" size={18} color="#2563EB" />
//           </View>
//           <View style={styles.hospitalInfo}>
//             <Text style={styles.hospitalName}>
//               {routeData?.hospital.name ?? hospitalName}
//             </Text>
//             <Text style={styles.hospitalAddress} numberOfLines={1}>
//               {routeData?.hospital.address}
//             </Text>
//           </View>
//         </View>

//         {/* Stats row: time · distance · traffic */}
//         <View style={styles.statsRow}>
//           <View style={styles.statItem}>
//             <View style={styles.statDot} />
//             <Text style={styles.statValue}>
//               {routeData?.route.durationText
//                 ? routeData.route.durationText.replace(" mins", "").replace(" hours", "h").replace(" hour", "h")
//                 : "--"}
//             </Text>
//             <Text style={styles.statLabel}>
//               {routeData?.route.durationText?.includes("mins") ? "mins" : ""}
//             </Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <View style={[styles.statDot, { backgroundColor: "#64748B" }]} />
//             <Text style={styles.statValue}>{routeData?.route.distanceText ?? "--"}</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
//             <Text style={styles.statValue}>Light</Text>
//             <Text style={styles.statLabel}> traffic</Text>
//           </View>
//         </View>

//         {/* Action buttons */}
//         <View style={styles.actionRow}>
//           <TouchableOpacity style={styles.exitMapBtn} onPress={handleExit}>
//             <Text style={styles.exitMapBtnText}>Exit Map</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.startNavBtn,
//               navigationStarted && styles.startNavBtnActive,
//             ]}
//             onPress={navigationStarted ? undefined : startNavigation}
//           >
//             <Ionicons
//               name={navigationStarted ? "navigate" : "navigate-outline"}
//               size={15}
//               color="#fff"
//               style={{ marginRight: 6 }}
//             />
//             <Text style={styles.startNavBtnText}>
//               {navigationStarted ? "Navigating…" : "Start Navigation"}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </Animated.View>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000" },

//   // Loading / error states
//   centered: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#fff",
//     padding: 28,
//   },
//   loadingText: { marginTop: 14, fontSize: 16, color: "#64748B" },
//   bigIcon: { fontSize: 64, marginBottom: 16 },
//   stateTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#0F172A",
//     textAlign: "center",
//   },
//   stateSubtitle: {
//     fontSize: 15,
//     color: "#64748B",
//     textAlign: "center",
//     marginTop: 8,
//     marginBottom: 32,
//     lineHeight: 22,
//   },
//   primaryBtn: {
//     backgroundColor: "#2563EB",
//     borderRadius: 14,
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//     width: "100%",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
//   ghostBtn: { paddingVertical: 12 },
//   ghostBtnText: { color: "#64748B", fontSize: 15 },

//   // Top header bar
//   topBar: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     backgroundColor: "rgba(255,255,255,0.97)",
//     borderBottomWidth: 1,
//     borderBottomColor: "#F1F5F9",
//   },
//   backBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#F8FAFC",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 8,
//   },
//   topBarCenter: { flex: 1 },
//   topBarTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#0F172A",
//     letterSpacing: -0.2,
//   },
//   onCallBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#DCFCE7",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 8,
//     gap: 4,
//   },
//   onCallDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
//   onCallText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
//   topBarIcon: {
//     width: 34,
//     height: 34,
//     alignItems: "center",
//     justifyContent: "center",
//     marginLeft: 2,
//   },

//   // Search bar
//   searchBar: {
//     position: "absolute",
//     top: 76,
//     left: 16,
//     right: 16,
//     height: 44,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 14,
//     gap: 10,
//     shadowColor: "#0F172A",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   searchText: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },

//   // Step banner
//   stepBanner: {
//     position: "absolute",
//     top: 132,
//     left: 16,
//     right: 16,
//     backgroundColor: "#1E3A8A",
//     borderRadius: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 14,
//     shadowColor: "#1E3A8A",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 8,
//   },
//   stepArrow: { fontSize: 24, color: "#fff", marginRight: 12 },
//   stepBody: { flex: 1 },
//   stepInstruction: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#fff",
//     lineHeight: 19,
//   },
//   stepDist: { fontSize: 12, color: "#93C5FD", marginTop: 2 },
//   stepCount: { fontSize: 11, color: "#93C5FD", marginLeft: 8 },

//   // Zoom controls
//   zoomControls: {
//     position: "absolute",
//     right: 16,
//     bottom: 280,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     elevation: 4,
//     overflow: "hidden",
//   },
//   zoomBtn: {
//     width: 40,
//     height: 40,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   zoomBtnText: { fontSize: 22, color: "#374151", fontWeight: "300" },
//   zoomDivider: { height: 1, backgroundColor: "#E2E8F0" },

//   // Recenter
//   recenterBtn: {
//     position: "absolute",
//     right: 16,
//     bottom: 350,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     elevation: 4,
//   },

//   // User location marker
//   userDotRing: {
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     backgroundColor: "rgba(37,99,235,0.18)",
//     borderWidth: 2,
//     borderColor: "#2563EB",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   userDotCore: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: "#2563EB",
//   },

//   // Hospital pin marker
//   hospitalPin: { alignItems: "center" },
//   hospitalPinInner: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#DC2626",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#DC2626",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 6,
//     elevation: 6,
//   },
//   hospitalPinTip: {
//     width: 0,
//     height: 0,
//     borderLeftWidth: 6,
//     borderRightWidth: 6,
//     borderTopWidth: 10,
//     borderStyle: "solid",
//     borderLeftColor: "transparent",
//     borderRightColor: "transparent",
//     borderTopColor: "#DC2626",
//     marginTop: -1,
//   },

//   // Bottom card
//   bottomCard: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 22,
//     borderTopRightRadius: 22,
//     paddingHorizontal: 18,
//     paddingTop: 18,
//     paddingBottom: 34,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 12,
//   },

//   // Hospital info in card
//   hospitalRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 14,
//     gap: 10,
//   },
//   hospitalIconBox: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     backgroundColor: "#EFF6FF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   hospitalInfo: { flex: 1 },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#0F172A",
//     letterSpacing: -0.2,
//   },
//   hospitalAddress: {
//     fontSize: 12,
//     color: "#64748B",
//     marginTop: 1,
//   },

//   // Stats row
//   statsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//     paddingHorizontal: 4,
//   },
//   statItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//     gap: 4,
//   },
//   statDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#22C55E",
//   },
//   statValue: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
//   statLabel: { fontSize: 12, color: "#64748B" },
//   statDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },

//   // Action buttons
//   actionRow: {
//     flexDirection: "row",
//     gap: 10,
//   },
//   exitMapBtn: {
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: "#E2E8F0",
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   exitMapBtnText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//   },
//   startNavBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 13,
//     borderRadius: 12,
//     backgroundColor: "#2563EB",
//     shadowColor: "#2563EB",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   startNavBtnActive: {
//     backgroundColor: "#16A34A",
//   },
//   startNavBtnText: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#fff",
//   },
// });




/**
 * DutyMapScreen.tsx
 *
 * Works on BOTH Web and Android/iOS — no react-native-maps, no Google API key.
 *
 * Web    → <div> + Leaflet loaded via CDN script tag
 * Native → <WebView> + Leaflet CDN inside HTML + expo-location for GPS
 *
 * Install (if not already):
 *   npx expo install react-native-webview expo-location
 */

// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { fetchDutyRoute } from "../../../../service/dutyService";
// import { DutyRouteApiResponse, RouteStep } from "../../../../types/duty";
// import { decodePolyline, haversineMeters } from "../../../../utils/polylineDecoder";

// // ── Conditionally import native-only modules ───────────────────────────────────
// const ExpoLocation: any =
//   Platform.OS !== "web" ? require("expo-location") : null;
// const NativeWebView: any =
//   Platform.OS !== "web" ? require("react-native-webview").WebView : null;

// // ── Types ──────────────────────────────────────────────────────────────────────
// type ScreenState = "loading" | "permission_denied" | "error" | "navigating" | "arrived";
// type Coord = { latitude: number; longitude: number };

// // ── Step helpers ───────────────────────────────────────────────────────────────
// function cleanInstruction(raw: string): string {
//   return raw.replace(/Pass by.+/gi, "").replace(/Destination.+/gi, "").trim();
// }

// function stepArrow(instruction: string): string {
//   const s = instruction.toLowerCase();
//   if (s.includes("turn left"))    return "↰";
//   if (s.includes("turn right"))   return "↱";
//   if (s.includes("u-turn"))       return "↩";
//   if (s.includes("slight left"))  return "↖";
//   if (s.includes("slight right")) return "↗";
//   if (s.includes("keep left"))    return "↖";
//   if (s.includes("keep right"))   return "↗";
//   if (s.includes("merge"))        return "⤵";
//   return "↑";
// }

// // ── Build Leaflet HTML (shared by Web div-init & Native WebView) ───────────────
// function buildLeafletHTML(
//   routeCoords: Coord[],
//   hospitalCoord: Coord,
//   hospitalName: string,
//   hospitalAddress: string,
//   initialLoc: Coord,
// ): string {
//   const coordsJson   = JSON.stringify(routeCoords.map(c => [c.latitude, c.longitude]));
//   const hospitalJson = JSON.stringify([hospitalCoord.latitude, hospitalCoord.longitude]);

//   return `<!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//   <style>
//     * { margin:0; padding:0; box-sizing:border-box; }
//     html, body, #map { width:100%; height:100vh; overflow:hidden; }
//     .leaflet-control-zoom {
//       border:none !important;
//       box-shadow:0 2px 8px rgba(0,0,0,0.15) !important;
//       border-radius:10px !important;
//       overflow:hidden;
//     }
//     .leaflet-control-zoom a {
//       color:#374151 !important; font-weight:300 !important;
//       font-size:18px !important; width:36px !important;
//       height:36px !important; line-height:36px !important;
//     }
//     .user-pulse {
//       width:20px; height:20px; background:#2563EB;
//       border:3px solid #fff; border-radius:50%;
//       box-shadow:0 0 0 6px rgba(37,99,235,0.2);
//       animation:pulse 2s infinite;
//     }
//     @keyframes pulse {
//       0%   { box-shadow:0 0 0 0   rgba(37,99,235,0.4); }
//       70%  { box-shadow:0 0 0 10px rgba(37,99,235,0);  }
//       100% { box-shadow:0 0 0 0   rgba(37,99,235,0);  }
//     }
//   </style>
// </head>
// <body>
// <div id="map"></div>
// <script>
//   var map = L.map('map', { zoomControl: true })
//     .setView([${initialLoc.latitude}, ${initialLoc.longitude}], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution:'© OpenStreetMap contributors', maxZoom:19
//   }).addTo(map);

//   // ── Route polyline ──
//   var coords = ${coordsJson};
//   if (coords.length > 0) {
//     var poly = L.polyline(coords, {
//       color:'#2563EB', weight:5, opacity:0.92, lineCap:'round', lineJoin:'round'
//     }).addTo(map);
//     map.fitBounds(poly.getBounds(), { padding:[80,80] });
//   }

//   // ── Hospital marker ──
//   var hIcon = L.divIcon({
//     className: '',
//     html: '<div style="width:40px;height:40px;background:#DC2626;border:3px solid #fff;' +
//           'border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
//           'display:flex;align-items:center;justify-content:center;' +
//           'box-shadow:0 4px 14px rgba(220,38,38,0.45);">' +
//           '<span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>',
//     iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-44],
//   });
//   L.marker(${hospitalJson}, { icon: hIcon })
//     .addTo(map)
//     .bindPopup('<b>${hospitalName.replace(/'/g, "\\'")}</b><br/><small>${hospitalAddress.replace(/'/g, "\\'")}</small>');

//   // ── User location marker ──
//   var uIcon = L.divIcon({
//     html: '<div class="user-pulse"></div>',
//     iconSize:[20,20], iconAnchor:[10,10], className:'',
//   });
//   var userMarker = L.marker(
//     [${initialLoc.latitude}, ${initialLoc.longitude}],
//     { icon: uIcon, zIndexOffset: 1000 }
//   ).addTo(map);

//   // ── Message bridge (used by native WebView) ──
//   function sendToNative(data) {
//     if (window.ReactNativeWebView)
//       window.ReactNativeWebView.postMessage(JSON.stringify(data));
//   }

//   // ── Called via injectJavaScript from React Native ──
//   function updateUserLocation(lat, lng, follow) {
//     userMarker.setLatLng([lat, lng]);
//     if (follow) map.panTo([lat, lng], { animate:true, duration:1 });
//   }

//   // ── Handle messages from React Native ──
//   function handleIncoming(e) {
//     try {
//       var msg = JSON.parse(e.data);
//       if (msg.type === 'updateLocation') {
//         updateUserLocation(msg.lat, msg.lng, msg.follow);
//       }
//     } catch(_) {}
//   }
//   document.addEventListener('message', handleIncoming);
//   window.addEventListener('message', handleIncoming);
// </script>
// </body>
// </html>`;
// }

// // ─── Main Component ────────────────────────────────────────────────────────────
// export default function DutyMapScreen() {
//   const { id, hospitalName } = useLocalSearchParams<{ id: string; hospitalName: string }>();
//   const router = useRouter();

//   // ── State ──
//   const [screenState,        setScreenState]        = useState<ScreenState>("loading");
//   const [routeData,          setRouteData]          = useState<DutyRouteApiResponse | null>(null);
//   const [routeCoords,        setRouteCoords]        = useState<Coord[]>([]);
//   const [currentLocation,    setCurrentLocation]    = useState<Coord | null>(null);
//   const [stepIndex,          setStepIndex]          = useState(0);
//   const [isFollowing,        setIsFollowing]        = useState(true);
//   const [navigationStarted,  setNavigationStarted]  = useState(false);
//   const [errorMsg,           setErrorMsg]           = useState("");

//   // ── Refs ──
//   const webViewRef        = useRef<any>(null);   // native WebView
//   const mapDivRef         = useRef<any>(null);   // web <div>
//   const mapInstanceRef    = useRef<any>(null);   // web Leaflet map instance
//   const userMarkerWebRef  = useRef<any>(null);   // web user marker
//   const locationSubRef    = useRef<any>(null);   // expo-location subscription
//   const watchIdRef        = useRef<number | null>(null); // web watchPosition id

//   // ── Animations ──
//   const bottomAnim = useRef(new Animated.Value(260)).current;
//   const bannerAnim = useRef(new Animated.Value(-100)).current;

//   // ── Init on mount ──
//   useEffect(() => {
//     if (Platform.OS === "web") {
//       injectLeafletCSS();
//     }
//     init();
//     return () => cleanup();
//   }, []);

//   const cleanup = () => {
//     // Native
//     locationSubRef.current?.remove();
//     // Web
//     if (watchIdRef.current !== null) {
//       navigator.geolocation?.clearWatch(watchIdRef.current);
//     }
//     if (mapInstanceRef.current) {
//       mapInstanceRef.current.remove();
//       mapInstanceRef.current = null;
//     }
//   };

//   // ── Inject Leaflet CSS on web ──
//   const injectLeafletCSS = () => {
//     if (typeof document === "undefined") return;
//     if (document.getElementById("leaflet-css")) return;
//     const link = document.createElement("link");
//     link.id = "leaflet-css";
//     link.rel = "stylesheet";
//     link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//     document.head.appendChild(link);
//   };

//   // ── Get location ──
//   const init = async () => {
//     setScreenState("loading");

//     if (Platform.OS === "web") {
//       // Browser Geolocation API
//       if (!navigator.geolocation) {
//         setErrorMsg("Geolocation not supported by your browser.");
//         setScreenState("error");
//         return;
//       }
//       navigator.geolocation.getCurrentPosition(
//         async (pos) => {
//           const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//           setCurrentLocation(loc);
//           await loadRoute(loc);
//         },
//         (err) => {
//           if (err.code === err.PERMISSION_DENIED) setScreenState("permission_denied");
//           else { setErrorMsg(err.message); setScreenState("error"); }
//         },
//         { enableHighAccuracy: true, timeout: 15000 },
//       );
//     } else {
//       // expo-location on Android/iOS
//       const { status: existing } = await ExpoLocation.getForegroundPermissionsAsync();
//       let finalStatus = existing;
//       if (existing !== "granted") {
//         const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
//         finalStatus = status;
//       }
//       if (finalStatus !== "granted") {
//         setScreenState("permission_denied");
//         return;
//       }
//       try {
//         const pos = await ExpoLocation.getCurrentPositionAsync({
//           accuracy: ExpoLocation.Accuracy.High,
//         });
//         const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//         setCurrentLocation(loc);
//         await loadRoute(loc);
//       } catch (err: any) {
//         setErrorMsg(err.message ?? "Could not get location");
//         setScreenState("error");
//       }
//     }
//   };

//   // ── Fetch route from API ──
//   const loadRoute = async (loc: Coord) => {
//     try {
//       const data = await fetchDutyRoute(id, loc);
//       setRouteData(data);

//       // Decode all step polylines for better road accuracy
//       const allCoords: Coord[] = data.route.stepPolylines.flatMap((sp: string) => {
//         try { return decodePolyline(sp); } catch { return []; }
//       });
//       setRouteCoords(allCoords);

//       setScreenState("navigating");

//       // Animate bottom panel
//       Animated.parallel([
//         Animated.spring(bottomAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
//         Animated.spring(bannerAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11, delay: 200 }),
//       ]).start();

//       // Init web map after state settles
//       if (Platform.OS === "web") {
//         setTimeout(() => initWebMap(data, allCoords, loc), 200);
//       }
//     } catch (err: any) {
//       setErrorMsg(err.message ?? "Failed to load route");
//       setScreenState("error");
//     }
//   };

//   // ── Initialize Leaflet map on Web ──
//   const initWebMap = (data: DutyRouteApiResponse, coords: Coord[], loc: Coord) => {
//     if (!mapDivRef.current) return;

//     const loadLeaflet = () => {
//       const L = (window as any).L;
//       if (!L) return;

//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.remove();
//         mapInstanceRef.current = null;
//       }

//       const map = L.map(mapDivRef.current).setView([loc.latitude, loc.longitude], 13);
//       mapInstanceRef.current = map;

//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "© OpenStreetMap contributors", maxZoom: 19,
//       }).addTo(map);

//       // Route polyline
//       if (coords.length > 0) {
//         const latLngs = coords.map(c => [c.latitude, c.longitude]);
//         const poly = L.polyline(latLngs, {
//           color: "#2563EB", weight: 5, opacity: 0.92, lineCap: "round", lineJoin: "round",
//         }).addTo(map);
//         map.fitBounds(poly.getBounds(), { padding: [80, 80] });
//       }

//       // Hospital marker
//       const hIcon = L.divIcon({
//         className: "",
//         html: `<div style="width:40px;height:40px;background:#DC2626;border:3px solid #fff;
//           border-radius:50% 50% 50% 0;transform:rotate(-45deg);
//           display:flex;align-items:center;justify-content:center;
//           box-shadow:0 4px 14px rgba(220,38,38,0.45);">
//           <span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>`,
//         iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44],
//       });
//       L.marker([data.hospital.location.latitude, data.hospital.location.longitude], { icon: hIcon })
//         .addTo(map)
//         .bindPopup(`<b>${data.hospital.name}</b><br/><small>${data.hospital.address}</small>`);

//       // User location marker with pulse
//       const style = document.createElement("style");
//       style.innerHTML = `
//         .user-pulse{width:20px;height:20px;background:#2563EB;border:3px solid #fff;
//           border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.2);animation:pulse 2s infinite;}
//         @keyframes pulse{
//           0%{box-shadow:0 0 0 0 rgba(37,99,235,0.4);}
//           70%{box-shadow:0 0 0 10px rgba(37,99,235,0);}
//           100%{box-shadow:0 0 0 0 rgba(37,99,235,0);}
//         }`;
//       document.head.appendChild(style);

//       const uIcon = L.divIcon({
//         html: '<div class="user-pulse"></div>',
//         iconSize: [20, 20], iconAnchor: [10, 10], className: "",
//       });
//       userMarkerWebRef.current = L.marker([loc.latitude, loc.longitude], {
//         icon: uIcon, zIndexOffset: 1000,
//       }).addTo(map);
//     };

//     if (!(window as any).L) {
//       const script = document.createElement("script");
//       script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
//       script.onload = loadLeaflet;
//       document.head.appendChild(script);
//     } else {
//       loadLeaflet();
//     }
//   };

//   // ── Start Navigation ──
//   const startNavigation = async () => {
//     setNavigationStarted(true);

//     if (Platform.OS === "web") {
//       watchIdRef.current = navigator.geolocation.watchPosition(
//         (pos) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
//         (err) => { Alert.alert("Location error", err.message); stopNavigation(); },
//         { enableHighAccuracy: true, maximumAge: 2000 },
//       );
//     } else {
//       locationSubRef.current = await ExpoLocation.watchPositionAsync(
//         { accuracy: ExpoLocation.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 2000 },
//         (pos: any) => onLocationUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
//       );
//     }
//   };

//   const stopNavigation = () => {
//     if (Platform.OS === "web") {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }
//     } else {
//       locationSubRef.current?.remove();
//       locationSubRef.current = null;
//     }
//     setNavigationStarted(false);
//   };

//   // ── Handle location updates (shared logic) ──
//   const onLocationUpdate = useCallback((loc: Coord) => {
//     setCurrentLocation(loc);

//     if (Platform.OS === "web") {
//       // Update web map marker + pan
//       if (userMarkerWebRef.current) {
//         userMarkerWebRef.current.setLatLng([loc.latitude, loc.longitude]);
//       }
//       if (isFollowing && mapInstanceRef.current) {
//         mapInstanceRef.current.panTo([loc.latitude, loc.longitude], { animate: true, duration: 1 });
//       }
//     } else {
//       // Inject JS into WebView to update user marker
//       webViewRef.current?.injectJavaScript(
//         `updateUserLocation(${loc.latitude}, ${loc.longitude}, ${isFollowing});true;`
//       );
//     }

//     // Advance step
//     if (routeData) {
//       setStepIndex(prev => {
//         const steps = routeData.route.steps;
//         for (let i = prev; i < steps.length; i++) {
//           const d = haversineMeters(loc, {
//             latitude: steps[i].endLocation.lat,
//             longitude: steps[i].endLocation.lng,
//           });
//           if (d < 50) return Math.min(i + 1, steps.length - 1);
//         }
//         return prev;
//       });

//       // Arrival check
//       const dist = haversineMeters(loc, routeData.hospital.location);
//       if (dist < (routeData.tracking.arrivalThreshold ?? 100)) {
//         stopNavigation();
//         setScreenState("arrived");
//         const msg = `You have arrived at ${routeData.hospital.name}!`;
//         if (Platform.OS === "web") {
//           alert(`🏥 ${msg}`);
//           router.back();
//         } else {
//           Alert.alert("🏥 Arrived!", msg, [{ text: "OK", onPress: () => router.back() }]);
//         }
//       }
//     }
//   }, [routeData, isFollowing]);

//   const handleBack = () => {
//     stopNavigation();
//     try {
//       if (router.canGoBack()) router.back();
//       else router.replace("/medicalStaff/dashboard" as any);
//     } catch {
//       router.replace("/medicalStaff/dashboard" as any);
//     }
//   };

//   const currentStep = routeData?.route.steps[stepIndex] ?? null;

//   // ─── Screen: Loading ───────────────────────────────────────────────────────
//   if (screenState === "loading") {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text style={styles.loadingText}>Getting your location…</Text>
//       </View>
//     );
//   }

//   // ─── Screen: Permission Denied ─────────────────────────────────────────────
//   if (screenState === "permission_denied") {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.bigEmoji}>📍</Text>
//         <Text style={styles.stateTitle}>Location Required</Text>
//         <Text style={styles.stateSubtitle}>
//           Please allow location access to view navigation directions.
//         </Text>
//         <TouchableOpacity style={styles.primaryBtn} onPress={init}>
//           <Text style={styles.primaryBtnText}>Grant Location Access</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}>
//           <Text style={styles.ghostBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // ─── Screen: Error ─────────────────────────────────────────────────────────
//   if (screenState === "error") {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.bigEmoji}>⚠️</Text>
//         <Text style={styles.stateTitle}>Route Unavailable</Text>
//         <Text style={styles.stateSubtitle}>{errorMsg}</Text>
//         <TouchableOpacity style={styles.primaryBtn} onPress={() => { setScreenState("loading"); init(); }}>
//           <Text style={styles.primaryBtnText}>Retry</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}>
//           <Text style={styles.ghostBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // ─── Screen: Map (navigating) ──────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       {Platform.OS !== "web" && <StatusBar barStyle="dark-content" />}

//       {/* ── MAP AREA ── */}
//       <View style={styles.mapArea}>
//         {Platform.OS === "web" ? (
//           // ── Web: plain div that Leaflet mounts into ──
//           React.createElement("div", {
//             ref: mapDivRef,
//             style: { position: "absolute", inset: 0, zIndex: 0 },
//           })
//         ) : (
//           // ── Android/iOS: WebView with Leaflet HTML ──
//           currentLocation && routeData && NativeWebView && (
//             <NativeWebView
//               ref={webViewRef}
//               source={{
//                 html: buildLeafletHTML(
//                   routeCoords,
//                   routeData.hospital.location,
//                   routeData.hospital.name,
//                   routeData.hospital.address,
//                   currentLocation,
//                 ),
//               }}
//               style={StyleSheet.absoluteFill}
//               originWhitelist={["*"]}
//               javaScriptEnabled
//               domStorageEnabled
//               startInLoadingState
//               mixedContentMode="always"
//               onTouchStart={() => setIsFollowing(false)}
//             />
//           )
//         )}
//       </View>

//       {/* ── TOP HEADER ── */}
//       <SafeAreaView style={styles.topBar}>
//         <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
//           <Ionicons name="arrow-back" size={20} color="#374151" />
//         </TouchableOpacity>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.topBarTitle}>Active Duty Route</Text>
//           {routeData && (
//             <Text style={styles.topBarSub} numberOfLines={1}>
//               {routeData.route.distanceText} · {routeData.route.durationText}
//             </Text>
//           )}
//         </View>
//         <View style={styles.onCallBadge}>
//           <View style={styles.onCallDot} />
//           <Text style={styles.onCallText}>On Call</Text>
//         </View>
//       </SafeAreaView>

//       {/* ── STEP BANNER ── */}
//       {currentStep && (
//         <Animated.View style={[styles.stepBanner, { transform: [{ translateY: bannerAnim }] }]}>
//           <Text style={styles.stepArrowText}>{stepArrow(currentStep.instruction)}</Text>
//           <View style={styles.stepBody}>
//             <Text style={styles.stepInstruction} numberOfLines={2}>
//               {cleanInstruction(currentStep.instruction)}
//             </Text>
//             <Text style={styles.stepDist}>
//               {currentStep.distance < 1
//                 ? `in ${Math.round(currentStep.distance * 1000)} m`
//                 : `in ${currentStep.distance.toFixed(1)} km`}
//             </Text>
//           </View>
//           <Text style={styles.stepCount}>
//             {stepIndex + 1}/{routeData?.route.steps.length}
//           </Text>
//         </Animated.View>
//       )}

//       {/* ── RECENTER BUTTON ── */}
//       {!isFollowing && (
//         <TouchableOpacity
//           style={styles.recenterBtn}
//           onPress={() => {
//             setIsFollowing(true);
//             if (currentLocation) {
//               if (Platform.OS === "web" && mapInstanceRef.current) {
//                 mapInstanceRef.current.setView(
//                   [currentLocation.latitude, currentLocation.longitude], 16, { animate: true },
//                 );
//               } else {
//                 webViewRef.current?.injectJavaScript(
//                   `map.setView([${currentLocation.latitude},${currentLocation.longitude}],16,{animate:true});true;`
//                 );
//               }
//             }
//           }}
//         >
//           <Ionicons name="locate" size={20} color="#2563EB" />
//         </TouchableOpacity>
//       )}

//       {/* ── BOTTOM CARD ── */}
//       <Animated.View style={[styles.bottomCard, { transform: [{ translateY: bottomAnim }] }]}>

//         {/* Hospital info */}
//         <View style={styles.hospitalRow}>
//           <View style={styles.hospitalIconBox}>
//             <Text style={{ fontSize: 18 }}>🏥</Text>
//           </View>
//           <View style={styles.hospitalInfo}>
//             <Text style={styles.hospitalName} numberOfLines={1}>
//               {routeData?.hospital.name ?? hospitalName}
//             </Text>
//             <Text style={styles.hospitalAddress} numberOfLines={1}>
//               {routeData?.hospital.address ?? ""}
//             </Text>
//           </View>
//         </View>

//         {/* Stats */}
//         <View style={styles.statsRow}>
//           <View style={styles.statItem}>
//             <View style={[styles.statDot, { backgroundColor: "#22C55E" }]} />
//             <Text style={styles.statValue} numberOfLines={1}>{routeData?.route.durationText ?? "--"}</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <View style={[styles.statDot, { backgroundColor: "#64748B" }]} />
//             <Text style={styles.statValue}>{routeData?.route.distanceText ?? "--"}</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <View style={[styles.statDot, { backgroundColor: "#3B82F6" }]} />
//             <Text style={styles.statValue}>Light traffic</Text>
//           </View>
//         </View>

//         {/* Action buttons */}
//         <View style={styles.actionRow}>
//           <TouchableOpacity style={styles.exitBtn} onPress={handleBack}>
//             <Text style={styles.exitBtnText}>Exit Map</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.startBtn, navigationStarted && styles.startBtnActive]}
//             onPress={navigationStarted ? stopNavigation : startNavigation}
//           >
//             <Ionicons
//               name={navigationStarted ? "navigate" : "navigate-outline"}
//               size={15}
//               color="#fff"
//               style={{ marginRight: 6 }}
//             />
//             <Text style={styles.startBtnText}>
//               {navigationStarted ? "Navigating…" : "Start Navigation"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//       </Animated.View>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F1F5F9" },

//   // Map fills entire screen under overlays
//   mapArea: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 0,
//   },

//   // Loading / error
//   centered: {
//     flex: 1, alignItems: "center", justifyContent: "center",
//     backgroundColor: "#fff", padding: 28,
//   },
//   loadingText: { marginTop: 14, fontSize: 16, color: "#64748B" },
//   bigEmoji:    { fontSize: 64, marginBottom: 16 },
//   stateTitle:  { fontSize: 22, fontWeight: "700", color: "#0F172A", textAlign: "center" },
//   stateSubtitle: {
//     fontSize: 15, color: "#64748B", textAlign: "center",
//     marginTop: 8, marginBottom: 32, lineHeight: 22,
//   },
//   primaryBtn: {
//     backgroundColor: "#2563EB", borderRadius: 14,
//     paddingVertical: 14, paddingHorizontal: 32,
//     width: "100%", alignItems: "center", marginBottom: 12,
//   },
//   primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
//   ghostBtn:     { paddingVertical: 12 },
//   ghostBtnText: { color: "#64748B", fontSize: 15 },

//   // Top bar
//   topBar: {
//     position: "absolute", top: 0, left: 0, right: 0,
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 12, paddingVertical: 10,
//     backgroundColor: "rgba(255,255,255,0.97)",
//     borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
//     zIndex: 20, gap: 10,
//   },
//   backBtn: {
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: "#F8FAFC",
//     alignItems: "center", justifyContent: "center",
//     flexShrink: 0,
//   },
//   topBarTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
//   topBarSub:   { fontSize: 12, color: "#64748B", marginTop: 1 },
//   onCallBadge: {
//     flexDirection: "row", alignItems: "center",
//     backgroundColor: "#DCFCE7",
//     paddingHorizontal: 8, paddingVertical: 4,
//     borderRadius: 12, gap: 4, flexShrink: 0,
//   },
//   onCallDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
//   onCallText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

//   // Step banner
//   stepBanner: {
//     position: "absolute", top: 72, left: 16, right: 16,
//     backgroundColor: "#1E3A8A", borderRadius: 14,
//     flexDirection: "row", alignItems: "center",
//     paddingVertical: 12, paddingHorizontal: 14,
//     zIndex: 20,
//     shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
//   },
//   stepArrowText:   { fontSize: 24, color: "#fff", marginRight: 12 },
//   stepBody:        { flex: 1 },
//   stepInstruction: { fontSize: 14, fontWeight: "600", color: "#fff", lineHeight: 19 },
//   stepDist:        { fontSize: 12, color: "#93C5FD", marginTop: 2 },
//   stepCount:       { fontSize: 11, color: "#93C5FD", marginLeft: 8 },

//   // Recenter button
//   recenterBtn: {
//     position: "absolute", right: 16, bottom: 280,
//     width: 44, height: 44, borderRadius: 22,
//     backgroundColor: "#fff",
//     alignItems: "center", justifyContent: "center",
//     zIndex: 20,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
//   },

//   // Bottom card
//   bottomCard: {
//     position: "absolute", bottom: 0, left: 0, right: 0,overflow: "visible",
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 22, borderTopRightRadius: 22,
//     paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34,
//     zIndex: 20,
//     shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
//   },
//   hospitalRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
//   hospitalIconBox: {
//     width: 40, height: 40, borderRadius: 10,
//     backgroundColor: "#EFF6FF",
//     alignItems: "center", justifyContent: "center",
//   },
//   hospitalInfo:   { flex: 1 },
//   hospitalName:   { fontSize: 16, fontWeight: "700", color: "#0F172A" },
//   hospitalAddress:{ fontSize: 12, color: "#64748B", marginTop: 1 },

//   statsRow: {
//     flexDirection: "row", alignItems: "center",
//     marginBottom: 16, paddingHorizontal: 4,
//   },
//   statItem:    { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center", gap: 4,minWidth: 0,overflow: "hidden", },
//   statDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
//   statValue:   { fontSize: 12, fontWeight: "700", color: "#0F172A", flexShrink: 1, },
//   statDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },

//   actionRow: { flexDirection: "row", gap: 10 },
//   exitBtn: {
//     paddingVertical: 12, paddingHorizontal: 20,
//     borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0",
//     backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
//   },
//   exitBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
//   startBtn: {
//     flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
//     paddingVertical: 13, borderRadius: 12,
//     backgroundColor: "#2563EB",
//     shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
//   },
//   startBtnActive: { backgroundColor: "#16A34A" },
//   startBtnText:   { fontSize: 14, fontWeight: "700", color: "#fff" ,flexShrink: 1, },
// });



/**
 * DutyMapScreen.tsx
 * UI matches screenshots exactly — floating card, proper mobile layout.
 * Works on Web + Android. No react-native-maps needed.
 */

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