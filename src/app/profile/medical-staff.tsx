// This is latest one ,,,,,,
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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


const ROLES: { label: string; value: string }[] = [
  { label: "RMO (Resident Medical Officer)",  value: "rmo" },
  { label: "Duty Medical Officer (DMO)",       value: "dmo" },
  { label: "General Physician",                value: "general_physician" },
  { label: "Intensivist / ICU Doctor",         value: "intensivist" },
  { label: "Emergency Medicine Doctor",        value: "emergency_doctor" },
  { label: "Anesthetist",                      value: "anesthetist" },
  { label: "Pediatrician (NICU/PICU)",         value: "pediatrician" },
  { label: "Gynecologist (On-call)",           value: "gynecologist" },
  { label: "Orthopedic Surgeon",               value: "orthopedic_surgeon" },
  { label: "General Surgeon",                  value: "general_surgeon" },
  { label: "Radiologist",                      value: "radiologist" },
  { label: "Pathologist",                      value: "pathologist" },
  { label: "Staff Nurse (Ward)",               value: "staff_nurse" },
  { label: "ICU Nurse",                        value: "icu_nurse" },
  { label: "Emergency Nurse",                  value: "emergency_nurse" },
  { label: "OT Nurse",                         value: "ot_nurse" },
  { label: "Dialysis Nurse",                   value: "dialysis_nurse" },
  { label: "NICU / PICU Nurse",               value: "nicu_nurse" },
  { label: "Lab Technician",                   value: "lab_technician" },
  { label: "Radiology Technician",             value: "radiology_technician" },
  { label: "OT Technician",                   value: "ot_technician" },
  { label: "Dialysis Technician",              value: "dialysis_technician" },
  { label: "Cath Lab Technician",              value: "cath_lab_technician" },
  { label: "ICU Technician",                  value: "icu_technician" },
  { label: "Ward Boy",                         value: "ward_boy" },
  { label: "Ayah / Female Attendant",          value: "ayah" },
  { label: "OPD Attendant",                    value: "opd_attendant" },
  { label: "Emergency Attendant",              value: "emergency_attendant" },
  { label: "Patient Care Taker",               value: "patient_care_taker" },
  { label: "Pharmacist",                       value: "pharmacist" },
  { label: "Pharmacy Assistant",               value: "pharmacy_assistant" },
  { label: "Biomedical Engineer",              value: "biomedical_engineer" },
  { label: "Housekeeping Staff",               value: "housekeeping_staff" },
  { label: "Security Guard",                   value: "security_guard" },
  { label: "Ambulance Driver",                 value: "ambulance_driver" },
  { label: "Receptionist",                     value: "receptionist" },
  { label: "Billing Executive",                value: "billing_executive" },
  { label: "Medical Records Staff",            value: "medical_records_staff" },
  { label: "HR & Accounts",                   value: "hr_accounts" },
];

// ── Hidden location state type
interface CapturedLocation {
  latitude: number;
  longitude: number;
}

export default function MedicalStaffProfile() {
  const { width } = useWindowDimensions();
  const isMobile  = width <= 480;
  const router    = useRouter();

  // ── Form state
  const [fullName,     setFullName]     = useState("");
  const [role,         setRole]         = useState<{ label: string; value: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [city,         setCity]         = useState("");
  const [area,         setArea]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [loading,      setLoading]      = useState(false);

  // ── Location state (invisible to user)
  const [capturedLocation, setCapturedLocation] = useState<CapturedLocation | null>(null);
  const [locationChecked,  setLocationChecked]  = useState(false);

  // ────────────────────────────────────────────────────────────
  // STEP 1 — Request GPS silently on mount
  // Calls POST /api/profile/check-location-permission
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Ask OS for permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // Get coords
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;

          // Notify backend — permissionGranted: true
          // @ts-ignore
          const res = await profileAPI.checkLocationPermission(true, latitude, longitude);
          console.log("📍 Location check (granted):", res);

          // nextStep === "fill_profile_form" → store coords for submit
          if (res?.locationInfo?.latitude && res?.locationInfo?.longitude) {
            setCapturedLocation({
              latitude:  res.locationInfo.latitude,
              longitude: res.locationInfo.longitude,
            });
          } else {
            // Fallback to raw GPS coords if backend echoes differently
            setCapturedLocation({ latitude, longitude });
          }
        } else {
          // Notify backend — permissionGranted: false
          const res = await profileAPI.checkLocationPermission(false);
          console.log("📍 Location check (denied):", res);
          // nextStep === "fill_profile_form_with_address" → backend will geocode city/area
          setCapturedLocation(null);
        }
      } catch (err) {
        // Silent fail — backend will geocode from address
        console.warn("⚠️ Location request failed silently:", err);
        try {
          await profileAPI.checkLocationPermission(false);
        } catch (_) {}
        setCapturedLocation(null);
      } finally {
        setLocationChecked(true);
      }
    })();
  }, []);

  // ── Format phone → +91XXXXXXXXXX
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  // ── Alert helper (web + native)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ────────────────────────────────────────────────────────────
  // STEP 2 — Submit profile
  // • If we have GPS coords → POST with preCapturedLocation
  //   (backend uses browser_permission source)
  // • If no coords         → POST without location
  //   (backend geocodes from city + area → address_geocoded source)
  // ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // ── Validation
    if (!fullName.trim()) {
      showAlert("Missing Field", "Please enter your full name.");
      return;
    }
    if (!role) {
      showAlert("Missing Field", "Please select your job role.");
      return;
    }
    if (!city.trim()) {
      showAlert("Missing Field", "Please enter your city.");
      return;
    }
    if (!area.trim()) {
      showAlert("Missing Field", "Please enter your area.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      showAlert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      let response: any;

      if (capturedLocation) {
        // ── GPS coords available → include preCapturedLocation
        const payload = {
          fullName:            fullName.trim(),
          jobRole:             role.value,
          city:                city.trim(),
          area:                area.trim(),
          phoneNumber:         formatPhone(phone),
          preCapturedLocation: {
            latitude:  capturedLocation.latitude,
            longitude: capturedLocation.longitude,
          },
        };
        console.log("📤 Submitting with location:", payload);
        response = await profileAPI.createMedicalStaffProfileWithLocation(payload);
      } else {
        // ── No GPS → backend geocodes from city + area
        const payload = {
          fullName:    fullName.trim(),
          jobRole:     role.value,
          city:        city.trim(),
          area:        area.trim(),
          phoneNumber: formatPhone(phone),
        };
        console.log("📤 Submitting without location:", payload);
        response = await profileAPI.createMedicalStaffProfile(payload);
      }

      console.log("✅ Profile created:", response);

      // Both API responses return { success: true, profile: {...}, message: "..." }
      if (response?.success) {
        router.replace("/medicalStaff/dashboard");
      } else {
        showAlert("Error", response?.message || "Failed to save profile.");
      }
    } catch (error: any) {
      console.error("❌ Profile error:", error?.response?.data);
      showAlert(
        "Error",
        error?.response?.data?.message || error?.message || "Failed to save profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollWrapper}
      contentContainerStyle={[
        styles.scrollContent,
        isMobile && { padding: 16 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── TOP LOGO ── */}
      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <Ionicons name="pulse" size={18} color="#fff" />
        </View>
        <Text style={styles.logoText}>HospiLink</Text>
      </View>

      {/* ── CARD ── */}
      <View style={[
        styles.card,
        isMobile && { paddingVertical: 24, paddingHorizontal: 20 },
      ]}>

        {/* Progress bar */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Help us personalize your experience as a medical professional.
        </Text>

        {/* ── Full Name ── */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Dr. Rahul"
            placeholderTextColor="#b0bec5"
            style={styles.inputInner}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* ── Job Role dropdown ── */}
        <Text style={styles.label}>Job Role</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowDropdown(!showDropdown)}
          activeOpacity={0.8}
        >
          <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
          <Text style={[styles.dropdownText, role ? styles.dropdownSelected : null]}>
            {role ? role.label : "Select your role"}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={16}
            color="#94a3b8"
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownList}>
            {ROLES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.dropdownItem,
                  role?.value === item.value && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setRole(item);
                  setShowDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  role?.value === item.value && styles.dropdownItemTextActive,
                ]}>
                  {item.label}
                </Text>
                {role?.value === item.value && (
                  <Ionicons name="checkmark" size={14} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── City + Area row ── */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>City</Text>
            <View style={styles.inputRow}>
              <Ionicons name="business-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="e.g. Pune"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <View style={[styles.rowItem, { marginLeft: 10 }]}>
            <Text style={styles.label}>Area</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="e.g. Wagholi"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={area}
                onChangeText={setArea}
              />
            </View>
          </View>
        </View>

        {/* ── Phone Number ── */}
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputRow}>
          <Ionicons name="call-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
          <Text style={styles.phonePrefix}>+91</Text>
          <View style={styles.phoneDivider} />
          <TextInput
            placeholder="000-000-0000"
            placeholderTextColor="#b0bec5"
            style={styles.inputInner}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* ── Submit Button ── */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Secure footer ── */}
      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={11} color="#94a3b8" />
        <Text style={styles.secureText}>  SECURE HEALTH DATA ENVIRONMENT</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper:          { flex: 1, backgroundColor: "#eef2f7" },
  scrollContent:          { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, minHeight: "100%" },
  logoRow:                { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  logoBox:                { width: 36, height: 36, backgroundColor: "#2563eb", borderRadius: 9, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText:               { color: "#0f172a", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },
  card:                   { width: "100%", maxWidth: 420, backgroundColor: "#ffffff", paddingVertical: 30, paddingHorizontal: 28, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", ...Platform.select({ web: { boxShadow: "0 20px 50px rgba(100,140,200,0.14)" }, default: { shadowColor: "#90a8cc", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 10 } }) },
  progressBarWrapper:     { height: 5, backgroundColor: "#e2e8f0", borderRadius: 10, marginBottom: 22, overflow: "hidden" },
  progressFill:           { width: "50%", height: "100%", backgroundColor: "#2563eb", borderRadius: 10 },
  title:                  { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6, letterSpacing: 0.2 },
  subtitle:               { color: "#64748b", fontSize: 13, lineHeight: 20, marginBottom: 20 },
  label:                  { color: "#475569", fontSize: 12, fontWeight: "500", marginBottom: 7, marginTop: 14 },
  inputRow:               { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 9, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, height: 44 },
  inputIcon:              { marginRight: 8 },
  inputInner:             { flex: 1, color: "#0f172a", fontSize: 14, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  dropdownText:           { flex: 1, color: "#b0bec5", fontSize: 14 },
  dropdownSelected:       { color: "#0f172a" },
  dropdownList:           { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 9, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(100,140,200,0.14)" }, default: { elevation: 8 } }) },
  dropdownItem:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownItemActive:     { backgroundColor: "#eff6ff" },
  dropdownItemText:       { color: "#64748b", fontSize: 14 },
  dropdownItemTextActive: { color: "#1d4ed8", fontWeight: "600" },
  row:                    { flexDirection: "row" },
  rowItem:                { flex: 1 },
  phonePrefix:            { color: "#475569", fontSize: 14, fontWeight: "600", marginRight: 8 },
  phoneDivider:           { width: 1, height: 20, backgroundColor: "#e2e8f0", marginRight: 10 },
  button:                 { backgroundColor: "#2563eb", paddingVertical: 13, borderRadius: 9, alignItems: "center", marginTop: 22, marginBottom: 16, ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }, default: { shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 } }) },
  buttonText:             { color: "#ffffff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  secureRow:              { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 10 },
  secureText:             { color: "#94a3b8", fontSize: 11, letterSpacing: 1.2 },
});