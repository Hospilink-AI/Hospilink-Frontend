import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  "0-1 year", "1-3 years", "3-5 years", "5-10 years",
  "10-15 years", "15-20 years", "20+ years",
];

interface EducationEntry {
  universityName: string;
  speciality: string;
  startYear: string;
  endYear: string;
}
const BLANK_EDUCATION: EducationEntry = { universityName: "", speciality: "", startYear: "", endYear: "" };

const isValidPhone = (v: string) => v.replace(/\D/g, "").length === 10;
const isValidPincode = (v: string) => /^\d{6}$/.test(v.trim());

const toOptions = (arr: string[]) => arr.map((s) => ({ label: s, value: s }));

export default function MedicalStaffProfile() {
  const router = useRouter();

  // ── Params from verify-otp / onboarding (prefill name + email) ──
  const params = useLocalSearchParams();
  const prefillName = (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
  const signupName = (Array.isArray(params.signupName) ? params.signupName[0] : params.signupName) ?? "";
  const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";
  const signupEmail = (Array.isArray(params.email) ? params.email[0] : params.email) ?? "";

  // name + email are not editable here; carried straight into the payload
  const fullName = prefillName || signupName || "";
  const email = prefillEmail || signupEmail || "";

  const [step, setStep] = useState(1); // 1..3
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // Step 1
  const [jobRole, setJobRole] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2
  const [educationList, setEducationList] = useState<EducationEntry[]>([{ ...BLANK_EDUCATION }]);

  // Step 3
  const [experience, setExperience] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [profileSummary, setProfileSummary] = useState("");

  const clearErr = (k: string) => {
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
    if (generalError) setGeneralError("");
  };

  const apiMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback;

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  // ── Skills ──
  const addSkill = () => {
    const t = skillInput.trim();
    if (!t) return;
    if (skillsList.some((s) => s.toLowerCase() === t.toLowerCase())) { setSkillInput(""); return; }
    setSkillsList([...skillsList, t]);
    setSkillInput("");
  };
  const removeSkill = (i: number) => setSkillsList(skillsList.filter((_, idx) => idx !== i));

  // ── Education ──
  const updateEducation = (i: number, field: keyof EducationEntry, value: string) =>
    setEducationList((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  const addEducationEntry = () => setEducationList((prev) => [...prev, { ...BLANK_EDUCATION }]);
  const removeEducationEntry = (i: number) =>
    setEducationList((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  // ── Step 1 validation (the only required step, same as your old handleSubmit) ──
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!jobRole) e.jobRole = "Please select your job role.";
    if (!currentAddress.trim()) e.currentAddress = "Current address is required.";
    if (!city.trim()) e.city = "City is required.";
    if (!stateVal) e.state = "State is required.";
    if (!pincode.trim() || !isValidPincode(pincode)) e.pincode = "Enter a valid 6-digit pincode.";
    if (!isValidPhone(phone)) e.phone = "Enter a valid 10-digit phone number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Final submit (step 3) — uses your real API + payload shape ──
  const handleSubmit = async () => {
    setGeneralError("");
    setLoading(true);
    try {
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
        jobRole,
        currentAddress: currentAddress.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pincode: pincode.trim(),
        phoneNumber: formatPhone(phone),
        email: email.trim() || undefined,
        profileSummary: profileSummary.trim() || undefined,
        education: educationArray.length > 0 ? educationArray : undefined,
        skills: skillsList.length > 0 ? skillsList : undefined,
        experience: experience || undefined,
      };

      console.log("📤 Submitting profile:", basePayload);
      const response: any = await profileAPI.createMedicalStaffProfile(basePayload);
      console.log("✅ Profile created:", response);

      if (response?.success) {
        router.replace("/profile/document-upload");
      } else {
        setGeneralError(response?.message || "Failed to save profile.");
      }
    } catch (error: any) {
      console.error("❌ Profile error:", error?.response?.data);
      setGeneralError(apiMessage(error, "Failed to save profile."));
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3); // education optional
    } else {
      handleSubmit();
    }
  };

  const buttonLabel = step === 3 ? "Upload Documents" : "Next";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Progress (3 steps) */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.progressSeg, s <= step && styles.progressSegActive]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {generalError ? (
            <View style={styles.generalError}>
              <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <Text style={styles.title}>Complete your profile</Text>
              <Text style={styles.subtitle}>Help us personalize your experience as a medical professional.</Text>

              <Dropdown
                placeholder="Job role"
                value={jobRole}
                options={ROLES}
                searchable
                onSelect={(v) => { setJobRole(v); clearErr("jobRole"); }}
                error={errors.jobRole}
              />

              <Field
                placeholder="Current Address"
                value={currentAddress}
                onChangeText={(v) => { setCurrentAddress(v); clearErr("currentAddress"); }}
                error={errors.currentAddress}
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Field
                    placeholder="City"
                    value={city}
                    onChangeText={(v) => { setCity(v); clearErr("city"); }}
                    error={errors.city}
                  />
                </View>
                <View style={styles.half}>
                  <Dropdown
                    placeholder="State"
                    value={stateVal}
                    options={toOptions(INDIAN_STATES)}
                    searchable
                    onSelect={(v) => { setStateVal(v); clearErr("state"); }}
                    error={errors.state}
                  />
                </View>
              </View>

              <Field
                placeholder="Pincode"
                value={pincode}
                onChangeText={(v) => { setPincode(v.replace(/\D/g, "")); clearErr("pincode"); }}
                error={errors.pincode}
                keyboardType="number-pad"
                maxLength={6}
              />

              {/* Phone with +91 prefix (OTP step intentionally skipped) */}
              <View style={styles.field}>
                <View style={[styles.underline, errors.phone ? styles.underlineError : null]}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                    placeholder="000 000 0000"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={(v) => { setPhone(v.replace(/\D/g, "")); clearErr("phone"); }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Add Your Education & Qualifications</Text>
              <Text style={styles.subtitle}>
                Share your academic background, medical degree, and specialization to match you with the right opportunities.
              </Text>

              {educationList.map((edu, i) => (
                <View key={i} style={i > 0 ? styles.qualBlock : undefined}>
                  {i > 0 && (
                    <TouchableOpacity style={styles.removeQual} onPress={() => removeEducationEntry(i)}>
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                  <Field
                    placeholder="University / College name"
                    value={edu.universityName}
                    onChangeText={(v) => updateEducation(i, "universityName", v)}
                  />
                  {/* Free text on purpose — medical degrees are too varied for a fixed list */}
                  <Field
                    placeholder="Specialty / Degree"
                    value={edu.speciality}
                    onChangeText={(v) => updateEducation(i, "speciality", v)}
                  />
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Field
                        placeholder="Start Year"
                        value={edu.startYear}
                        onChangeText={(v) => updateEducation(i, "startYear", v.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                    <View style={styles.half}>
                      <Field
                        placeholder="End Year"
                        value={edu.endYear}
                        onChangeText={(v) => updateEducation(i, "endYear", v.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addRow} onPress={addEducationEntry}>
                <Ionicons name="add-circle" size={18} color="#2563EB" />
                <Text style={styles.addText}>Add another Qualification</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <>
              <Text style={styles.title}>Experience</Text>
              <Text style={styles.subtitle}>
                Highlight your years of experience, skills, and professional summary to help hospitals understand your expertise.
              </Text>

              <Dropdown
                placeholder="Years of experience"
                value={experience}
                options={toOptions(EXPERIENCE_OPTIONS)}
                onSelect={(v) => setExperience(v)}
              />

              {/* Skills (chips) */}
              <Text style={styles.miniLabel}>Skills <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.skillRow}>
                <View style={[styles.underline, { flex: 1 }]}>
                  <TextInput
                    style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                    placeholder="e.g. surgery, emergency medicine"
                    placeholderTextColor="#9CA3AF"
                    value={skillInput}
                    onChangeText={setSkillInput}
                    onSubmitEditing={addSkill}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                </View>
                <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                  <Text style={styles.addSkillText}>Add</Text>
                </TouchableOpacity>
              </View>
              {skillsList.length > 0 && (
                <View style={styles.chipsWrap}>
                  {skillsList.map((skill, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{skill}</Text>
                      <TouchableOpacity onPress={() => removeSkill(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close-circle" size={15} color="#2563eb" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Profile summary */}
              <Text style={[styles.miniLabel, { marginTop: 22 }]}>Profile Summary <Text style={styles.optional}>(optional)</Text></Text>
              <View style={[styles.underline, styles.textArea]}>
                <TextInput
                  style={[styles.input, { minHeight: 64 }, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="e.g. Experienced general surgeon with 5+ years of practice..."
                  placeholderTextColor="#9CA3AF"
                  value={profileSummary}
                  onChangeText={setProfileSummary}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* Primary button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={primaryAction}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{buttonLabel}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Underline text field ── */
function Field({
  placeholder, value, onChangeText, error, keyboardType, maxLength,
}: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
  error?: string; keyboardType?: any; maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <View style={[styles.underline, error ? styles.underlineError : null]}>
        <TextInput
          style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={false}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ── Modal dropdown (Android-safe, optional search) ── */
function Dropdown({
  placeholder, value, options, onSelect, error, searchable,
}: {
  placeholder: string; value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void; error?: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = searchable && q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  const close = () => { setOpen(false); setQ(""); };

  return (
    <View style={styles.field}>
      <TouchableOpacity
        style={[styles.underline, error ? styles.underlineError : null]}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.input, !selected && { color: "#9CA3AF" }]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            {searchable && (
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={q}
                  onChangeText={setQ}
                  autoFocus
                />
              </View>
            )}
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {filtered.map((opt) => {
                const sel = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.sheetItem}
                    onPress={() => { onSelect(opt.value); close(); }}
                  >
                    <Text style={[styles.sheetItemText, sel && styles.sheetItemSelected]}>{opt.label}</Text>
                    {sel && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && <Text style={styles.noResult}>No results</Text>}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  progressRow: { flexDirection: "row", gap: 8, paddingHorizontal: 28, paddingTop: 16, marginBottom: 24 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  progressSegActive: { backgroundColor: BLUE },
  scroll: { paddingHorizontal: 28, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", lineHeight: 21, marginBottom: 28 },

  field: { marginBottom: 22 },
  row: { flexDirection: "row", gap: 16 },
  half: { flex: 1 },
  underline: {
    flexDirection: "row", alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: "#D1D5DB",
    paddingVertical: 8, minHeight: 38,
  },
  underlineError: { borderBottomColor: "#dc2626" },
  input: { flex: 1, fontSize: 15, color: "#1F2937", paddingVertical: 4 },
  prefix: { fontSize: 15, color: "#1F2937", marginRight: 8 },
  errorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", marginTop: 6 },
  miniLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 4 },
  optional: { fontSize: 12, color: "#9CA3AF", fontWeight: "400" },
  textArea: { alignItems: "flex-start", paddingVertical: 10 },

  generalError: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2",
    borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 10, marginBottom: 18,
  },
  generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },

  qualBlock: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 18, marginTop: 4, position: "relative" },
  removeQual: { position: "absolute", right: 0, top: 12, zIndex: 2 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  addText: { color: BLUE, fontSize: 14, fontWeight: "600" },

  skillRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  addSkillBtn: { backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 18, height: 40, justifyContent: "center", alignItems: "center" },
  addSkillText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  chipText: { color: "#1d4ed8", fontSize: 13, fontWeight: "500" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "center", paddingHorizontal: 28 },
  sheet: { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 8, maxHeight: 460 },
  sheetTitle: { fontSize: 14, fontWeight: "700", color: "#475569", paddingHorizontal: 18, paddingVertical: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 18, marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchInput: { flex: 1, fontSize: 14, color: "#1F2937", paddingVertical: 6 },
  sheetItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14 },
  sheetItemText: { fontSize: 15, color: "#1F2937", flex: 1 },
  sheetItemSelected: { color: BLUE, fontWeight: "700" },
  noResult: { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: 16 },

  bottomBar: { paddingHorizontal: 28, paddingBottom: 24, paddingTop: 8 },
  button: {
    backgroundColor: BLUE, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center",
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});