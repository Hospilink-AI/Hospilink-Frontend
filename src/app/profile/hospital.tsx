import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { profileAPI } from "../../service/api";
import { useLocalSearchParams } from "expo-router";

// Lazy import so web build doesn't choke if not installed yet
let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (_) { }
}

// ─── Indian States ──────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ─── Leaflet HTML ──────────────────────────────────────────────────────────
const getMapHTML = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f0f4f8; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true })
               .setView([${lat}, ${lng}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    var icon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:#2563eb;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
      className: ''
    });

    var marker = L.marker([${lat}, ${lng}], { draggable: true, icon: icon }).addTo(map);
    marker.bindPopup('<b style="font-size:12px;color:#1d4ed8">📍 Hospital Location</b><br/><small style="color:#475569">Drag pin or tap map to reposition</small>').openPopup();

    function sendLocation(latlng) {
      var msg = JSON.stringify({ lat: latlng.lat, lng: latlng.lng });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      } else {
        window.parent.postMessage(msg, '*');
      }
    }

    marker.on('dragend', function(e) {
      sendLocation(e.target.getLatLng());
      marker.openPopup();
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendLocation(e.latlng);
      marker.openPopup();
    });

    window.updateMarker = function(lat, lng) {
      var ll = L.latLng(lat, lng);
      marker.setLatLng(ll);
      map.flyTo(ll, 14, { duration: 1.2 });
      setTimeout(function() { marker.openPopup(); }, 1300);
    };
  </script>
</body>
</html>
`;

// ─── Constants ─────────────────────────────────────────────────────────────
const DEFAULT_LAT = 18.5642;
const DEFAULT_LNG = 73.9530;

const STAFF_OPTIONS = [
  { label: "2 - 10 employees", value: "2-10" },
  { label: "11 - 50 employees", value: "11-50" },
  { label: "51 - 100 employees", value: "51-100" },
  { label: "100+ employees", value: "100+" },
];

const ALL_SERVICES = [
  'Emergency Care', 'General Surgery', 'Cardiology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology', 'Internal Medicine',
  'Radiology', 'Laboratory Services', 'Pharmacy', 'Physical Therapy',
  'Mental Health', 'Oncology', 'Dermatology', 'Ophthalmology',
  'ENT (Ear, Nose, Throat)', 'Urology', 'Gastroenterology', 'Pulmonology',
];

function MapComponent({
  lat, lng, onLocationChange, webViewRef,
}: {
  lat: number; lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  webViewRef: React.MutableRefObject<any>;
}) {
  const htmlContent = getMapHTML(lat, lng);

  if (Platform.OS === "web") {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      if (Platform.OS !== "web") return;
      const handler = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.lat === "number" && typeof data.lng === "number") {
            onLocationChange(data.lat, data.lng);
          }
        } catch { }
      };
      window.addEventListener("message", handler);
      return () => { window.removeEventListener("message", handler); };
    }, [onLocationChange]);

    useEffect(() => {
      webViewRef.current = {
        injectJavaScript: (code: string) => {
          (iframeRef.current?.contentWindow as any)?.eval(code);
        },
      };
    }, []);

    return (
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        style={{ width: "100%", height: 200, border: "none", borderRadius: 10, display: "block" }}
        sandbox="allow-scripts allow-same-origin"
        title="Hospital Location Map"
      />
    );
  }

  if (!WebView) {
    return (
      <View style={styles.mapFallback}>
        <Ionicons name="map-outline" size={28} color="#cbd5e1" />
        <Text style={styles.mapFallbackText}>Run: npx expo install react-native-webview</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html: htmlContent }}
      style={{ height: 200, borderRadius: 10 }}
      originWhitelist={["*"]}
      onMessage={(e: any) => {
        try {
          const { lat: newLat, lng: newLng } = JSON.parse(e.nativeEvent.data);
          onLocationChange(newLat, newLng);
        } catch { }
      }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
    />
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function HospitalProfile() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;
  const router = useRouter();

  // const params = useLocalSearchParams();
  // const signupName = Array.isArray(params.signupName)
  //   ? params.signupName[0]
  //   : (params.signupName as string) ?? "";

  // // ── NEW: prefill email from signup params ──
  // const signupEmail = Array.isArray(params.email)
  //   ? params.email[0]
  //   : (params.email as string) ?? "";

  const params = useLocalSearchParams();
  const signupName = Array.isArray(params.signupName)
    ? params.signupName[0]
    : (params.signupName as string) ?? "";

  const prefillName = Array.isArray(params.prefillName)
    ? params.prefillName[0]
    : (params.prefillName as string) ?? "";

  const signupEmail = Array.isArray(params.email)
    ? params.email[0]
    : (params.email as string) ?? "";

  const prefillEmail = Array.isArray(params.prefillEmail)
    ? params.prefillEmail[0]
    : (params.prefillEmail as string) ?? "";

  // ── Form state
  // const [hospitalName, setHospitalName] = useState(signupName);
  const [hospitalName, setHospitalName] = useState(prefillName || signupName || "");
  // const [email] = useState(signupEmail);                // ← prefilled, non-editable (no setter exposed)
  const [email] = useState(prefillEmail || signupEmail || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [staffCount, setStaffCount] = useState(STAFF_OPTIONS[2]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  // ── Dynamic completion percentage ──
  // 9 tracked fields: email & staffCount always count (prefilled/defaulted)
  const completionPercent = Math.round(
    ([
      true,                              // email — always prefilled
      true,                              // staffCount — always has a default
      hospitalName.trim().length > 0,
      phoneNumber.trim().length > 0,
      address.trim().length > 0,
      city.trim().length > 0,
      pincode.trim().length === 6,
      state.trim().length > 0,
       description.trim().length > 0, 
      selectedServices.length > 0,
    ].filter(Boolean).length /
      9) *
    100
  );

  // ── Map state
  const [mapLat, setMapLat] = useState(DEFAULT_LAT);
  const [mapLng, setMapLng] = useState(DEFAULT_LNG);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState("Pune, Maharashtra");
  const webViewRef = useRef<any>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const geocode = useCallback(
    (addressVal: string, cityVal: string, stateVal: string) => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (!addressVal && !cityVal && !stateVal) return;
      geocodeTimer.current = setTimeout(async () => {
        const q = [addressVal, cityVal, stateVal].filter(Boolean).join(", ");
        setIsGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data?.[0]) {
            const newLat = parseFloat(data[0].lat);
            const newLng = parseFloat(data[0].lon);
            setMapLat(newLat);
            setMapLng(newLng);
            setPinnedLabel(data[0].display_name.split(",").slice(0, 2).join(",").trim());
            webViewRef.current?.injectJavaScript(
              `window.updateMarker(${newLat}, ${newLng}); true;`
            );
          }
        } catch (_) { }
        setIsGeocoding(false);
      }, 800);
    },
    []
  );

  const handleAddressChange = (val: string) => { setAddress(val); geocode(val, city, state); };
  const handleCityChange = (val: string) => { setCity(val); geocode(address, val, state); };
  const handleStateSelect = (val: string) => {
    setState(val);
    setShowStateDropdown(false);
    geocode(address, city, val);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.address) {
          const a = d.address;
          const street = [a.house_number, a.road].filter(Boolean).join(" ");
          const cityName = a.city || a.town || a.suburb || a.village || "";
          const stateName = a.state || "";
          if (street) setAddress(street);
          if (cityName) setCity(cityName);
          if (stateName) setState(stateName);
          setPinnedLabel([street || cityName, stateName].filter(Boolean).slice(0, 2).join(", "));
        }
      })
      .catch(() => { });
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleFinishSetup = async () => {
    if (!hospitalName.trim()) { showAlert("Missing Field", "Please enter the hospital legal name."); return; }
    if (!phoneNumber.trim()) { showAlert("Missing Field", "Please enter the phone number."); return; }
    if (!address.trim()) { showAlert("Missing Field", "Please enter the current address."); return; }
    if (!city.trim()) { showAlert("Missing Field", "Please enter the city."); return; }
    if (!state.trim()) { showAlert("Missing Field", "Please select a state."); return; }
    if (!pincode.trim()) { showAlert("Missing Field", "Please enter the pincode."); return; }
    if (selectedServices.length === 0) { showAlert("Missing Field", "Please select at least one service."); return; }

    const fullAddress = [address.trim(), city.trim(), state.trim()].filter(Boolean).join(", ");

    const payload = {
      hospitalLegalName: hospitalName.trim(),
      email: email.trim(),                  // ← added
      // phoneNumber: phoneNumber.trim(),       // ← added
      phoneNumber: `+91 ${phoneNumber}`,
      currentAddress: fullAddress,
      city: city.trim(),
      state: state,
      pincode: pincode.trim(),
      servicesAvailable: selectedServices,
      // location: city.trim(),
      staffCount: staffCount.value,
      description: description.trim(),
    };

    console.log("📤 Submitting hospital profile:", payload);
    setLoading(true);

    try {
      const response = await profileAPI.createHospitalProfile(payload);
      console.log("✅ Hospital profile saved:", response);
      // router.replace("/hospital/dashboard");
      router.replace("/profile/upload-document")
    } catch (error: any) {
      console.error("❌ Hospital profile error:", error?.response?.data);
      showAlert("Error", error?.response?.data?.message || error?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>

      {/* ── NAVBAR ── */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="pulse" size={18} color="#fff" />
          </View>
          <Text style={styles.logoText}>HospiLink</Text>
        </View>
        <View style={styles.navRight}>
          <Text style={styles.adminPortalText}>Admin Portal</Text>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={18} color="#94a3b8" />
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={[styles.scrollContent, isDesktop && { paddingHorizontal: 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── PROGRESS CARD ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.title}>Hospital Profile Setup</Text>
              <Text style={styles.subtitle}>
                Complete your facility's operational information to go live.
              </Text>
            </View>
            <View style={styles.percentBox}>
              <Text style={styles.percent}>{completionPercent}%</Text>
              <Text style={styles.percentLabel}>COMPLETION</Text>
            </View>
          </View>
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` as any }]} />
          </View>
          <View style={styles.noticeRow}>
            <Ionicons name="information-circle" size={16} color="#2563eb" />
            <Text style={styles.noticeText}>
              {"  "}Almost there! Just a few more details needed to verify your account.
            </Text>
          </View>
        </View>

        {/* ── TWO CARDS ROW ── */}
        <View style={[styles.cardsRow, !isDesktop && { flexDirection: "column" }]}>

          {/* ── LEFT CARD: Identity & Location ── */}
          <View style={[styles.card, !isDesktop && { marginBottom: 16 }]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="grid-outline" size={18} color="#3b82f6" />
              <Text style={styles.cardTitle}>  Identity & Location</Text>
            </View>
            <View style={styles.dividerLine} />

            {/* Hospital Legal Name */}
            <Text style={styles.label}>Hospital Legal Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="e.g. Hospital Name"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={hospitalName}
                onChangeText={setHospitalName}
              />
            </View>

            {/* ── NEW: Email (prefilled, non-editable) ── */}
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, styles.inputRowDisabled]}>
              {/* <Ionicons name="mail-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} /> */}
              <TextInput
                style={[styles.inputInner, styles.inputDisabled]}
                value={email}
                editable={false}
                selectTextOnFocus={false}
                placeholderTextColor="#b0bec5"
                placeholder="email@hospital.com"
              />
              <Ionicons name="lock-closed" size={13} color="#cbd5e1" />
            </View>

            {/* ── NEW: Phone Number ── */}
            <Text style={styles.label}>Phone Number</Text>
            {/* <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="+91 98765 43210"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={phoneNumber}
                onChangeText={(v) => setPhoneNumber(v.replace(/[^0-9+\-\s()]/g, '').slice(0, 15))}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View> */}

            <View style={styles.inputRow}>
              {/* <Ionicons name="call-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} /> */}
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                placeholder="98765 43210"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={phoneNumber}
                onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, "").slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* Current Address */}
            <Text style={styles.label}>Current Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="123 Medical Plaza, Suite 400"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={address}
                onChangeText={handleAddressChange}
              />
            </View>

            {/* City + Pincode row */}
            <View style={styles.twoColRow}>
              <View style={styles.twoColItem}>
                <Text style={styles.label}>City</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder="Nagpur"
                    placeholderTextColor="#b0bec5"
                    style={styles.inputInner}
                    value={city}
                    onChangeText={handleCityChange}
                  />
                </View>
              </View>
              <View style={[styles.twoColItem, { marginLeft: 12 }]}>
                <Text style={styles.label}>Pincode</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder="440015"
                    placeholderTextColor="#b0bec5"
                    style={styles.inputInner}
                    value={pincode}
                    onChangeText={(v) => setPincode(v.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            </View>

            {/* ── State Dropdown ── */}
            <Text style={styles.label}>State</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => {
                setShowStateDropdown(!showStateDropdown);
                setShowStaffDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, !state && { color: "#b0bec5" }]}>
                {state || "Select State"}
              </Text>
              <Ionicons
                name={showStateDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#64748b"
              />
            </TouchableOpacity>

            {showStateDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
                  {INDIAN_STATES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.dropdownItem, state === st && styles.dropdownItemActive]}
                      onPress={() => handleStateSelect(st)}
                    >
                      <Text style={[styles.dropdownItemText, state === st && styles.dropdownItemTextActive]}>
                        {st}
                      </Text>
                      {state === st && <Ionicons name="checkmark" size={14} color="#2563eb" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Hospital Description</Text>
          <View style={[styles.inputRow, { height: 'auto', alignItems: 'flex-start', paddingVertical: 10 }]}>
            <TextInput
              placeholder="e.g. A premier multispeciality hospital providing quality healthcare..."
              placeholderTextColor="#b0bec5"
              style={[styles.inputInner, { minHeight: 90, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
          </View>
          {/* ── Description ── */}
          

          {/* ── RIGHT CARD: Capacity & Services ── */}
          <View style={[styles.card, isDesktop && { marginLeft: 16 }]}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="people-outline" size={18} color="#3b82f6" />
              <Text style={styles.cardTitle}>  Capacity & Services</Text>
            </View>
            <View style={styles.dividerLine} />

            <Text style={styles.label}>Total Staff Count</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => {
                setShowStaffDropdown(!showStaffDropdown);
                setShowStateDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{staffCount.label}</Text>
              <Ionicons
                name={showStaffDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#64748b"
              />
            </TouchableOpacity>

            {showStaffDropdown && (
              <View style={styles.dropdownList}>
                {STAFF_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, staffCount.value === opt.value && styles.dropdownItemActive]}
                    onPress={() => { setStaffCount(opt); setShowStaffDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, staffCount.value === opt.value && styles.dropdownItemTextActive]}>
                      {opt.label}
                    </Text>
                    {staffCount.value === opt.value && <Ionicons name="checkmark" size={14} color="#2563eb" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Available Clinical Services</Text>
            <View style={styles.servicesBox}>
              <View style={styles.tagContainer}>
                {selectedServices.length === 0 && (
                  <Text style={styles.servicesEmptyHint}>No services selected yet.</Text>
                )}
                {selectedServices.map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={styles.tag}
                    onPress={() => toggleService(service)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tagText}>{service}</Text>
                    <Ionicons name="close" size={13} color="#fff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addServiceBtn}
                  onPress={() => setShowServiceDropdown(!showServiceDropdown)}
                >
                  <Ionicons name="add" size={14} color="#64748b" />
                  <Text style={styles.addServiceText}> Add Service</Text>
                </TouchableOpacity>
              </View>

              {showServiceDropdown && (
                <View style={styles.serviceDropdown}>
                  <View style={styles.serviceDropdownHeader}>
                    <Text style={styles.serviceDropdownTitle}>Select Services</Text>
                    <TouchableOpacity onPress={() => setShowServiceDropdown(false)}>
                      <Ionicons name="close" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.serviceDropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {ALL_SERVICES.map((service) => {
                      const active = selectedServices.includes(service);
                      return (
                        <TouchableOpacity
                          key={service}
                          style={[styles.serviceDropdownItem, active && styles.serviceDropdownItemActive]}
                          onPress={() => toggleService(service)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.serviceDropdownItemText, active && styles.serviceDropdownItemTextActive]}>
                            {service}
                          </Text>
                          {active
                            ? <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
                            : <Ionicons name="add-circle-outline" size={16} color="#cbd5e1" />
                          }
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.servicesHint}>
                Select all specialized departments active in your facility.
              </Text>
            </View>

            {/* ── MAP (moved here from left card) ── */}
            <View style={styles.mapContainer}>
              <MapComponent
                lat={mapLat}
                lng={mapLng}
                onLocationChange={handleLocationChange}
                webViewRef={webViewRef}
              />
              <View style={styles.mapInfoBar}>
                <Ionicons name="location" size={12} color="#2563eb" />
                <Text style={styles.mapInfoText} numberOfLines={1}>
                  {isGeocoding ? "Locating…" : pinnedLabel}
                </Text>
                <Text style={styles.mapCoords}>
                  {mapLat.toFixed(4)}, {mapLng.toFixed(4)}
                </Text>
              </View>
              <Text style={styles.mapHint}>Tap map or drag pin to adjust location</Text>
            </View>

            <View style={styles.verificationBox}>
              <View style={styles.verificationHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
                <Text style={styles.verificationTitle}>{"  "}Verification Pending</Text>
              </View>
              <Text style={styles.verificationText}>
                Once you finish setup, our compliance team will verify these credentials within 24 hours.
              </Text>
            </View>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.footerDivider} />

        {/* ── BOTTOM ROW ── */}
        <View style={[styles.bottomRow, !isDesktop && styles.bottomRowMobile]}>
          <TouchableOpacity>
            <Text style={styles.saveDraft}>Save Draft</Text>
          </TouchableOpacity>
          <View style={styles.bottomBtns}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleFinishSetup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Finish Setup  →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2024 HospiLink Medical Management Systems. Built for clinical excellence.
        </Text>
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f0f4f8" },
  phonePrefix: { paddingRight: 8 },
  phonePrefixText: { color: "#0f172a", fontSize: 14, fontWeight: "400" },
  phoneDivider: { width: 1, height: 20, backgroundColor: "#e2e8f0", marginRight: 10 },
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 28, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", backgroundColor: "#ffffff" },
  navLeft: { flexDirection: "row", alignItems: "center" },
  logoBox: { width: 32, height: 32, backgroundColor: "#2563eb", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText: { color: "#0f172a", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  adminPortalText: { color: "#64748b", fontSize: 14, fontWeight: "500" },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },

  scrollWrapper: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  progressCard: { backgroundColor: "#ffffff", padding: 24, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", ...Platform.select({ web: { boxShadow: "0 4px 20px rgba(100,140,200,0.10)" }, default: { elevation: 3 } }) },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 22, color: "#0f172a", fontWeight: "800", letterSpacing: 0.2, marginBottom: 6 },
  subtitle: { color: "#64748b", fontSize: 13, lineHeight: 20 },
  percentBox: { alignItems: "flex-end" },
  percent: { color: "#2563eb", fontWeight: "800", fontSize: 32, lineHeight: 36 },
  percentLabel: { color: "#2563eb", fontSize: 10, letterSpacing: 1.5, fontWeight: "600", opacity: 0.7 },
  progressBarWrapper: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 10, marginBottom: 14, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 10 },
  noticeRow: { flexDirection: "row", alignItems: "center" },
  noticeText: { color: "#2563eb", fontSize: 13, flex: 1 },

  cardsRow: { flexDirection: "row", marginBottom: 20 },
  card: { flex: 1, backgroundColor: "#ffffff", padding: 22, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", ...Platform.select({ web: { boxShadow: "0 4px 20px rgba(100,140,200,0.10)" }, default: { elevation: 3 } }) },
  cardTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  dividerLine: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 14 },

  label: { color: "#475569", fontSize: 12, fontWeight: "500", marginBottom: 7, marginTop: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 14, height: 44 },
  inputInner: { flex: 1, color: "#0f172a", fontSize: 14, ...Platform.select({ web: { outlineStyle: "none" } as any }) },

  // ── NEW: disabled/prefilled input styles ──
  inputRowDisabled: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  inputDisabled: { color: "#64748b" },

  twoColRow: { flexDirection: "row", marginTop: 0 },
  twoColItem: { flex: 1 },

  mapContainer: { marginTop: 14, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" },
  mapInfoBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e2e8f0", gap: 6 },
  mapInfoText: { flex: 1, color: "#0f172a", fontSize: 12, fontWeight: "500" },
  mapCoords: { color: "#94a3b8", fontSize: 10, fontFamily: Platform.OS === "web" ? "monospace" : undefined },
  mapHint: { textAlign: "center", color: "#94a3b8", fontSize: 11, paddingVertical: 5, backgroundColor: "#f8fafc", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  mapFallback: { height: 200, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", gap: 8 },
  mapFallbackText: { color: "#94a3b8", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },

  dropdownText: { flex: 1, color: "#0f172a", fontSize: 14 },
  dropdownList: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(100,140,200,0.15)" }, default: { elevation: 8 } }) },
  dropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownItemActive: { backgroundColor: "#eff6ff" },
  dropdownItemText: { color: "#64748b", fontSize: 13 },
  dropdownItemTextActive: { color: "#1d4ed8", fontWeight: "600" },

  servicesBox: { backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", padding: 14, marginTop: 0 },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: { flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  tagText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  addServiceBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff" },
  addServiceText: { color: "#64748b", fontSize: 12, fontWeight: "500" },
  servicesHint: { color: "#94a3b8", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  servicesEmptyHint: { color: "#94a3b8", fontSize: 12, fontStyle: "italic" },

  verificationBox: { backgroundColor: "#eff6ff", padding: 16, borderRadius: 10, marginTop: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  verificationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  verificationTitle: { color: "#1d4ed8", fontWeight: "700", fontSize: 14 },
  verificationText: { color: "#475569", fontSize: 12, lineHeight: 18 },

  footerDivider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  bottomRowMobile: { flexDirection: "column", gap: 16, alignItems: "stretch" },
  saveDraft: { color: "#64748b", fontSize: 14, fontWeight: "500" },
  bottomBtns: { flexDirection: "row", gap: 10 },
  backButton: { borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: "#ffffff" },
  backText: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
  primaryButton: { backgroundColor: "#2563eb", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, minWidth: 140, alignItems: "center", ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }, default: { elevation: 4 } }) },
  primaryText: { color: "#ffffff", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
  footer: { textAlign: "center", color: "#94a3b8", fontSize: 12, letterSpacing: 0.3 },

  serviceDropdown: { marginTop: 10, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff", overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 6px 20px rgba(100,140,200,0.12)" }, default: { elevation: 6 } }) },
  serviceDropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#f8fafc" },
  serviceDropdownTitle: { fontSize: 12, fontWeight: "700", color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" },
  serviceDropdownList: { maxHeight: 220 },
  serviceDropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  serviceDropdownItemActive: { backgroundColor: "#eff6ff" },
  serviceDropdownItemText: { fontSize: 13, color: "#64748b" },
  serviceDropdownItemTextActive: { color: "#1d4ed8", fontWeight: "600" },
});