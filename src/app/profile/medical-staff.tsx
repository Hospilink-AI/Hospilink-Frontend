import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
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

// ── Indian States and Union Territories
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const ROLES: { label: string; value: string }[] = [
  { label: "RMO (Resident Medical Officer)", value: "rmo" },
  { label: "Duty Medical Officer (DMO)", value: "dmo" },
  { label: "General Physician", value: "general_physician" },
  { label: "Intensivist / ICU Doctor", value: "intensivist" },
  { label: "Emergency Medicine Doctor", value: "emergency_doctor" },
  { label: "Anesthetist", value: "anesthetist" },
  { label: "Pediatrician (NICU/PICU)", value: "pediatrician" },
  { label: "Gynecologist (On-call)", value: "gynecologist" },
  { label: "Orthopedic Surgeon", value: "orthopedic_surgeon" },
  { label: "General Surgeon", value: "general_surgeon" },
  { label: "Radiologist", value: "radiologist" },
  { label: "Pathologist", value: "pathologist" },
  { label: "Staff Nurse (Ward)", value: "staff_nurse" },
  { label: "ICU Nurse", value: "icu_nurse" },
  { label: "Emergency Nurse", value: "emergency_nurse" },
  { label: "OT Nurse", value: "ot_nurse" },
  { label: "Dialysis Nurse", value: "dialysis_nurse" },
  { label: "NICU / PICU Nurse", value: "nicu_nurse" },
  { label: "Lab Technician", value: "lab_technician" },
  { label: "Radiology Technician", value: "radiology_technician" },
  { label: "OT Technician", value: "ot_technician" },
  { label: "Dialysis Technician", value: "dialysis_technician" },
  { label: "Cath Lab Technician", value: "cath_lab_technician" },
  { label: "ICU Technician", value: "icu_technician" },
  { label: "Ward Boy", value: "ward_boy" },
  { label: "Ayah / Female Attendant", value: "ayah" },
  { label: "OPD Attendant", value: "opd_attendant" },
  { label: "Emergency Attendant", value: "emergency_attendant" },
  { label: "Patient Care Taker", value: "patient_care_taker" },
  { label: "Pharmacist", value: "pharmacist" },
  { label: "Pharmacy Assistant", value: "pharmacy_assistant" },
  { label: "Biomedical Engineer", value: "biomedical_engineer" },
  { label: "Housekeeping Staff", value: "housekeeping_staff" },
  { label: "Security Guard", value: "security_guard" },
  { label: "Ambulance Driver", value: "ambulance_driver" },
  { label: "Receptionist", value: "receptionist" },
  { label: "Billing Executive", value: "billing_executive" },
  { label: "Medical Records Staff", value: "medical_records_staff" },
  { label: "HR & Accounts", value: "hr_accounts" },
];

const EXPERIENCE_OPTIONS = [
  "0-1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10-15 years",
  "15-20 years",
  "20+ years",
];

// ── Education entry type
interface EducationEntry {
  universityName: string;
  speciality: string;
  startYear: string;
  endYear: string;
}

const BLANK_EDUCATION: EducationEntry = {
  universityName: "",
  speciality: "",
  startYear: "",
  endYear: "",
};

// ── Hidden location state type
interface CapturedLocation {
  latitude: number;
  longitude: number;
}

export default function MedicalStaffProfile() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const router = useRouter();

  // ── Read params passed from verify-otp (pre-fill fullName + email)
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

  // ── Form state — name & email are READ-ONLY, pre-filled from signup
  // const [fullName] = useState(signupName ?? "");
  const [fullName] = useState(prefillName || signupName || "");
  // const [email] = useState(signupEmail ?? "");
  const [email] = useState(prefillEmail || signupEmail || "");

  const [role, setRole] = useState<{ label: string; value: string } | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // ── Address fields (in order: currentAddress → city → state → pincode)
  const [currentAddress, setCurrentAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [pincode, setPincode] = useState("");

  const [phone, setPhone] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // ── Profile Summary
  const [profileSummary, setProfileSummary] = useState("");

  // ── Education — multiple entries
  const [educationList, setEducationList] = useState<EducationEntry[]>([{ ...BLANK_EDUCATION }]);

  // ── Skills
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);

  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<any[]>([]);

  const [loading, setLoading] = useState(false);

  // ── Location state (invisible to user)
  const [capturedLocation, setCapturedLocation] = useState<CapturedLocation | null>(null);
  const [locationChecked, setLocationChecked] = useState(false);

  const [experience, setExperience] = useState("");
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);

  // ── Filtered states for search
  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // ────────────────────────────────────────────────────────────
  // STEP 1 — Request GPS silently on mount
  // ────────────────────────────────────────────────────────────


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

  // ── Skills helpers
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setSkillsList([...skillsList, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== index));
  };

  // ── Education helpers
  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setEducationList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEducationEntry = () => {
    setEducationList((prev) => [...prev, { ...BLANK_EDUCATION }]);
  };

  const removeEducationEntry = (index: number) => {
    if (educationList.length === 1) return; // keep at least one
    setEducationList((prev) => prev.filter((_, i) => i !== index));
  };

  // ────────────────────────────────────────────────────────────
  // STEP 2 — Submit profile
  // ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {

    if (!fullName.trim()) {
      showAlert("Missing Field", "Full name is required.");
      return;
    }
    if (!role) {
      showAlert("Missing Field", "Please select your job role.");
      return;
    }
    if (!currentAddress.trim()) {
      showAlert("Missing Field", "Please enter your current address.");
      return;
    }
    if (!city.trim()) {
      showAlert("Missing Field", "Please enter your city.");
      return;
    }
    if (!state) {
      showAlert("Missing Field", "Please select your state.");
      return;
    }
    if (!pincode.trim() || pincode.replace(/\D/g, "").length < 6) {
      showAlert("Invalid Pincode", "Please enter a valid 6-digit pincode.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      showAlert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    if (!phoneVerified) {
      showAlert("Phone Not Verified", "Please verify your phone number with the OTP first.");
      return;
    }

    setLoading(true);

    try {
      // ── Build education array — filter entries with at least a university name
      const educationArray = educationList
        .filter((e) => e.universityName.trim())
        .map((e) => ({
          universityName: e.universityName.trim(),
          speciality: e.speciality.trim(),
          startYear: e.startYear.trim() ? Number(e.startYear.trim()) : undefined,
          endYear: e.endYear.trim() ? Number(e.endYear.trim()) : undefined,
        }));

      const basePayload = {
        fullName: fullName.trim(),
        jobRole: role.value,
        currentAddress: currentAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phoneNumber: formatPhone(phone),
        email: email.trim() || undefined,
        profileSummary: profileSummary.trim() || undefined,
        education: educationArray.length > 0 ? educationArray : undefined,
        skills: skillsList.length > 0 ? skillsList : undefined,
        experience: experience || undefined,
      };

      let response: any;

      // if (capturedLocation) {
      //   const payload = {
      //     ...basePayload,
      //     preCapturedLocation: {
      //       latitude: capturedLocation.latitude,
      //       longitude: capturedLocation.longitude,
      //     },
      //   };
      //   console.log("📤 Submitting with location:", payload);
      //   response = await profileAPI.createMedicalStaffProfileWithLocation(payload);
      // } else {
      console.log("📤 Submitting without location:", basePayload);
      response = await profileAPI.createMedicalStaffProfile(basePayload);


      console.log("✅ Profile created:", response);

      if (response?.success) {
        router.replace("/profile/document-upload");
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


  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      showAlert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }
    setOtpError("");
    setSendingOtp(true);
    try {
      const res = await profileAPI.sendPhoneOTP(formatPhone(phone));
      if (res?.success) {
        setShowOTP(true);
        setOtp(["", "", "", "", "", ""]);
        setResendCountdown(45);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setOtpError(res?.message || "Failed to send OTP.");
      }
    } catch (error: any) {
      setOtpError(
        error?.response?.data?.message ?? error?.message ?? "Failed to send OTP."
      );
    } finally {
      setSendingOtp(false);
    }
  };


  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    setOtpError("");
    setVerifyingOtp(true);
    try {
      const res = await profileAPI.verifyPhoneOTP(formatPhone(phone), code);
      if (res?.success) {
        setPhoneVerified(true);
        setShowOTP(false);
      } else {
        setOtpError(res?.message || "Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      setOtpError(
        error?.response?.data?.message ?? error?.message ?? "Verification failed."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // ── Progress calculation
  let filledCount = 0;
  if (fullName.trim()) filledCount++;
  if (role) filledCount++;
  if (currentAddress.trim()) filledCount++;
  if (city.trim()) filledCount++;
  if (state) filledCount++;
  if (pincode.replace(/\D/g, "").length === 6) filledCount++;
  if (phone.replace(/\D/g, "").length >= 10) filledCount++;
  if (profileSummary.trim()) filledCount++;
  if (educationList.some((e) => e.universityName.trim())) filledCount++;
  if (skillsList.length > 0) filledCount++;

  const totalFields = 10;
  const progressPercentage = Math.round((filledCount / totalFields) * 100);

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
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>

        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Help us personalize your experience as a medical professional.
        </Text>

        {/* ── TWO COLUMN LAYOUT ── */}
        <View style={[styles.formColumns, isMobile && styles.formColumnsMobile]}>

          {/* ══════════════════════════════════════
              LEFT COLUMN
          ══════════════════════════════════════ */}
          <View style={styles.col}>

            {/* ── Full Name (READ-ONLY) ── */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputRow, styles.readOnlyRow]}>
              <Ionicons name="person-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{fullName || "—"}</Text>
              <Ionicons name="lock-closed-outline" size={13} color="#cbd5e1" />
            </View>

            {/* ── Job Role dropdown ── */}
            <Text style={styles.label}>Job Role</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => { setShowRoleDropdown(!showRoleDropdown); setShowStateDropdown(false); }}
              activeOpacity={0.8}
            >
              <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <Text style={[styles.dropdownText, role ? styles.dropdownSelected : null]}>
                {role ? role.label : "Select your role"}
              </Text>
              <Ionicons
                name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#94a3b8"
              />
            </TouchableOpacity>

            {showRoleDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {ROLES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.dropdownItem,
                        role?.value === item.value && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setRole(item);
                        setShowRoleDropdown(false);
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
                </ScrollView>
              </View>
            )}

            {/* ── Current Address ── */}
            <Text style={styles.label}>Current Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="home-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="e.g. 42, MG Road, Near Railway Station"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={currentAddress}
                onChangeText={setCurrentAddress}
              />
            </View>

            {/* ── City + State row ── */}
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
                <Text style={styles.label}>State</Text>
                <TouchableOpacity
                  style={styles.inputRow}
                  onPress={() => { setShowStateDropdown(!showStateDropdown); setShowRoleDropdown(false); setStateSearch(""); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <Text style={[styles.dropdownText, state ? styles.dropdownSelected : null, { fontSize: 13 }]}>
                    {state || "Select state"}
                  </Text>
                  <Ionicons
                    name={showStateDropdown ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* State dropdown panel (full width below city/state row) */}
            {showStateDropdown && (
              <View style={styles.dropdownList}>
                {/* Search inside state dropdown */}
                <View style={styles.stateSearchRow}>
                  <Ionicons name="search-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                  <TextInput
                    placeholder="Search state..."
                    placeholderTextColor="#b0bec5"
                    style={styles.stateSearchInput}
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    autoFocus
                  />
                </View>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {filteredStates.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.dropdownItem,
                        state === s && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setState(s);
                        setShowStateDropdown(false);
                        setStateSearch("");
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        state === s && styles.dropdownItemTextActive,
                      ]}>
                        {s}
                      </Text>
                      {state === s && (
                        <Ionicons name="checkmark" size={14} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredStates.length === 0 && (
                    <Text style={styles.noResultText}>No states found</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* ── Pincode ── */}
            <Text style={styles.label}>Pincode</Text>
            <View style={styles.inputRow}>
              <Ionicons name="pin-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="e.g. 411035"
                placeholderTextColor="#b0bec5"
                style={styles.inputInner}
                value={pincode}
                onChangeText={(v) => setPincode(v.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* ── Phone Number ── */}
            <Text style={styles.label}>Phone Number</Text>
            {/* <View style={styles.phoneRow}>
              <View style={[styles.inputRow, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="call-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.phonePrefix}>+91</Text>
                <View style={styles.phoneDivider} />
                <TextInput
                  placeholder="000-000-0000"
                  placeholderTextColor="#b0bec5"
                  style={styles.inputInner}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setShowOTP(false); setOtp(["", "", "", "", "", ""]); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View> */}
            <View style={styles.phoneRow}>
              <View style={[styles.inputRow, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="call-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.phonePrefix}>+91</Text>
                <View style={styles.phoneDivider} />
                <TextInput
                  placeholder="000-000-0000"
                  placeholderTextColor="#b0bec5"
                  style={styles.inputInner}
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    setShowOTP(false);
                    setPhoneVerified(false);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!phoneVerified}
                />
                {phoneVerified && (
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                )}
              </View>

              {!phoneVerified && (
                <TouchableOpacity
                  style={styles.verifyBtnOutline}
                  onPress={handleSendOtp}
                  disabled={sendingOtp || (showOTP && resendCountdown > 0)}
                  activeOpacity={0.85}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={styles.verifyBtnOutlineText}>
                      {showOTP
                        ? resendCountdown > 0
                          ? `Resend ${resendCountdown}s`
                          : "Resend"
                        : "Send OTP"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ── OTP Section ── */}
            {/* {showOTP && (
              <View style={styles.otpSection}>
                <Text style={styles.otpHint}>Enter the code sent to your phone number.</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r as any; }}
                      style={[styles.otpBox, digit !== "" && styles.otpBoxFilled]}
                      value={digit}
                      onChangeText={(v) => {
                        const val = v.replace(/\D/g, "").slice(-1);
                        const updated = [...otp];
                        updated[i] = val;
                        setOtp(updated);
                        if (val && i < 5) otpRefs.current[i + 1]?.focus();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={() => Alert.alert("OTP", `Entered: ${otp.join("")}`)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.verifyOtpBtnText}>Verify OTP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )} */}
            {showOTP && !phoneVerified && (
              <View style={styles.otpSection}>
                <Text style={styles.otpHint}>Enter the code sent to your phone number.</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r as any; }}
                      style={[styles.otpBox, digit !== "" && styles.otpBoxFilled]}
                      value={digit}
                      onChangeText={(v) => {
                        const val = v.replace(/\D/g, "").slice(-1);
                        const updated = [...otp];
                        updated[i] = val;
                        setOtp(updated);
                        if (val && i < 5) otpRefs.current[i + 1]?.focus();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={handleVerifyOtp}
                    disabled={verifyingOtp}
                    activeOpacity={0.85}
                  >
                    {verifyingOtp ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.verifyOtpBtnText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
              </View>
            )}

            {/* ── Email (READ-ONLY) ── */}
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputRow, styles.readOnlyRow]}>
              <Ionicons name="mail-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{email || "—"}</Text>
              <Ionicons name="lock-closed-outline" size={13} color="#cbd5e1" />
            </View>

            {/* ── Profile Summary ── */}
            <Text style={styles.label}>
              Profile Summary <Text style={styles.optionalTag}>(optional)</Text>
            </Text>
            <View style={[styles.inputRow, styles.textAreaRow]}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#94a3b8"
                style={[styles.inputIcon, { alignSelf: "flex-start", marginTop: 12 }]}
              />
              <TextInput
                placeholder="e.g. Experienced general surgeon with 5+ years of practice..."
                placeholderTextColor="#b0bec5"
                style={[styles.inputInner, styles.textAreaInner]}
                value={profileSummary}
                onChangeText={setProfileSummary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ══════════════════════════════════════
              RIGHT COLUMN
          ══════════════════════════════════════ */}
          <View style={styles.col}>

            {/* ── Education Section ── */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <Ionicons name="school-outline" size={15} color="#2563eb" />
                <Text style={styles.sectionTitle}>
                  Education <Text style={styles.optionalTag}>(optional)</Text>
                </Text>
              </View>
              {/* Add another education entry */}
              <TouchableOpacity style={styles.addEntryBtn} onPress={addEducationEntry} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
                <Text style={styles.addEntryText}>Add</Text>
              </TouchableOpacity>
            </View>

            {educationList.map((edu, index) => (
              <View key={index} style={styles.educationCard}>
                {/* Entry header with index and remove button */}
                <View style={styles.educationCardHeader}>
                  <Text style={styles.educationCardIndex}>
                    {index === 0 ? "Primary Degree" : `Degree ${index + 1}`}
                  </Text>
                  {educationList.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeEducationEntry(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>University / College Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="library-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g. Government Medical College, Nagpur"
                    placeholderTextColor="#b0bec5"
                    style={styles.inputInner}
                    value={edu.universityName}
                    onChangeText={(v) => updateEducation(index, "universityName", v)}
                  />
                </View>

                <Text style={styles.label}>Speciality / Degree</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="ribbon-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g. MBBS, MS Surgery, MD"
                    placeholderTextColor="#b0bec5"
                    style={styles.inputInner}
                    value={edu.speciality}
                    onChangeText={(v) => updateEducation(index, "speciality", v)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Start Year</Text>
                    <View style={styles.inputRow}>
                      <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        placeholder="2018"
                        placeholderTextColor="#b0bec5"
                        style={styles.inputInner}
                        value={edu.startYear}
                        onChangeText={(v) => updateEducation(index, "startYear", v.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  </View>

                  <View style={[styles.rowItem, { marginLeft: 10 }]}>
                    <Text style={styles.label}>End Year</Text>
                    <View style={styles.inputRow}>
                      <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                      <TextInput
                        placeholder="2024"
                        placeholderTextColor="#b0bec5"
                        style={styles.inputInner}
                        value={edu.endYear}
                        onChangeText={(v) => updateEducation(index, "endYear", v.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Add another education button (bottom shortcut) */}
            <TouchableOpacity style={styles.addEducationRow} onPress={addEducationEntry} activeOpacity={0.8}>
              <Ionicons name="add-circle" size={18} color="#2563eb" />
              <Text style={styles.addEducationText}>Add another degree / qualification</Text>
            </TouchableOpacity>

            {/* ── Experience Section ── */}
            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <Ionicons name="briefcase-outline" size={15} color="#2563eb" />
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>

            <Text style={styles.label}>Years of Experience</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => {
                setShowExperienceDropdown(!showExperienceDropdown);
                setShowRoleDropdown(false);
                setShowStateDropdown(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <Text style={[styles.dropdownText, experience ? styles.dropdownSelected : null]}>
                {experience || "Select experience"}
              </Text>
              <Ionicons
                name={showExperienceDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#94a3b8"
              />
            </TouchableOpacity>

            {showExperienceDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        experience === option && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setExperience(option);
                        setShowExperienceDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        experience === option && styles.dropdownItemTextActive,
                      ]}>
                        {option}
                      </Text>
                      {experience === option && (
                        <Ionicons name="checkmark" size={14} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Skills ── */}
            <View style={[styles.sectionHeader, { marginTop: 18 }]}>
              <Ionicons name="flash-outline" size={15} color="#2563eb" />
              <Text style={styles.sectionTitle}>
                Skills <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
            </View>

            <Text style={styles.label}>Add Skills</Text>
            <View style={styles.skillInputRow}>
              <View style={[styles.inputRow, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="add-circle-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. surgery, emergency medicine"
                  placeholderTextColor="#b0bec5"
                  style={styles.inputInner}
                  value={skillInput}
                  onChangeText={setSkillInput}
                  onSubmitEditing={addSkill}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
              </View>
              <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill} activeOpacity={0.8}>
                <Text style={styles.addSkillBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {skillsList.length > 0 && (
              <View style={styles.chipsWrap}>
                {skillsList.map((skill, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                    <TouchableOpacity
                      onPress={() => removeSkill(index)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close-circle" size={15} color="#2563eb" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

          </View>
        </View>

        {/* ── Submit Button ── */}
        <View style={styles.submitWrap}>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Upload Documents</Text>
            )}
          </TouchableOpacity>
        </View>

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
  scrollWrapper: { flex: 1, backgroundColor: "#eef2f7" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: "100%",
  },
  otpErrorText: { fontSize: 12, color: "#ef4444", marginTop: 8, fontWeight: "500" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 36, height: 36,
    backgroundColor: "#2563eb",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: { color: "#0f172a", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },

  card: {
    width: "100%",
    maxWidth: 780,
    backgroundColor: "#ffffff",
    paddingVertical: 30,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      web: { boxShadow: "0 20px 50px rgba(100,140,200,0.14)" } as any,
      default: {
        shadowColor: "#90a8cc",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },

  progressBarWrapper: {
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    marginBottom: 22,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 10 },

  title: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6, letterSpacing: 0.2 },
  subtitle: { color: "#64748b", fontSize: 13, lineHeight: 20, marginBottom: 20 },

  formColumns: { flexDirection: "row", gap: 30 },
  formColumnsMobile: { flexDirection: "column", gap: 0 },
  col: { flex: 1 },

  label: { color: "#475569", fontSize: 12, fontWeight: "500", marginBottom: 7, marginTop: 14 },
  optionalTag: { color: "#94a3b8", fontSize: 11, fontWeight: "400" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: { marginRight: 8 },
  inputInner: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
    backgroundColor: "transparent",
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  // ── Read-only fields
  readOnlyRow: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  readOnlyText: {
    flex: 1,
    color: "#64748b",
    fontSize: 14,
    fontStyle: "italic",
  },

  // ── TextArea
  textAreaRow: { height: "auto", minHeight: 80, alignItems: "flex-start", paddingVertical: 10 },
  textAreaInner: { minHeight: 60, paddingTop: 0 },

  // ── Dropdown
  dropdownText: { flex: 1, color: "#b0bec5", fontSize: 14 },
  dropdownSelected: { color: "#0f172a" },
  dropdownList: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 9,
    marginTop: 4,
    overflow: "hidden",
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(100,140,200,0.14)" } as any,
      default: { elevation: 8 },
    }),
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemActive: { backgroundColor: "#eff6ff" },
  dropdownItemText: { color: "#64748b", fontSize: 14 },
  dropdownItemTextActive: { color: "#1d4ed8", fontWeight: "600" },

  // ── State search inside dropdown
  stateSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  stateSearchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 13,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },
  noResultText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    paddingVertical: 16,
  },

  row: { flexDirection: "row" },
  rowItem: { flex: 1 },

  phonePrefix: { color: "#475569", fontSize: 14, fontWeight: "600", marginRight: 8 },
  phoneDivider: { width: 1, height: 20, backgroundColor: "#e2e8f0", marginRight: 10 },

  // ── Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 2, gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1e40af" },

  // ── Add entry button (top right of education section)
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#eff6ff",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  addEntryText: { color: "#2563eb", fontSize: 12, fontWeight: "600" },

  // ── Education card
  educationCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginTop: 10,
  },
  educationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  educationCardIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Add education (bottom link)
  addEducationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addEducationText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Skills
  skillInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addSkillBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 9,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  addSkillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipText: { color: "#1d4ed8", fontSize: 13, fontWeight: "500" },

  // ── Phone / OTP
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  verifyBtnOutline: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyBtnOutlineText: { color: "#2563eb", fontSize: 13, fontWeight: "700" },
  otpSection: { marginTop: 10 },
  otpHint: { fontSize: 12, color: "#64748b", marginBottom: 10 },
  otpRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  otpBox: {
    flex: 1, 
    width: 40, 
    minWidth: 0,  
    height: 44,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  otpBoxFilled: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  verifyOtpBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    flexShrink: 0,
  },
  verifyOtpBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Submit
  submitWrap: { alignItems: "center", marginTop: 30, marginBottom: 10 },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 200,
    borderRadius: 9,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(37,99,235,0.30)" } as any,
      default: {
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },

  // ── Footer
  secureRow: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 10 },
  secureText: { color: "#94a3b8", fontSize: 11, letterSpacing: 1.2 },
});