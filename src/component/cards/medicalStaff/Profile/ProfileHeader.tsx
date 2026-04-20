import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { profileAPI } from "../../../../service/api";

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
  { label: "NICU / PICU Nurse",                value: "nicu_nurse" },
  { label: "Lab Technician",                   value: "lab_technician" },
  { label: "Radiology Technician",             value: "radiology_technician" },
  { label: "OT Technician",                    value: "ot_technician" },
  { label: "Dialysis Technician",              value: "dialysis_technician" },
  { label: "Cath Lab Technician",              value: "cath_lab_technician" },
  { label: "ICU Technician",                   value: "icu_technician" },
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
  { label: "HR & Accounts",                    value: "hr_accounts" },
];

interface EducationEntry {
  universityName: string;
  speciality: string;
  startYear: string;
  endYear: string;
}

const getRoleLabel = (value: string) =>
  ROLES.find((r) => r.value === value)?.label ?? value;

const getRoleByLabel = (label: string) =>
  ROLES.find((r) => r.label === label) ?? null;

interface Props {
  name:                string;
  role:                string;
  badges:              string[];
  onEdit:              () => void;
  isMobile?:           boolean;
  phone?:              string | null;
  email?:              string | null;
  isVerified?:         boolean;
  isComplete?:         boolean;
  profileCompletion?:  number | null;
  verificationStatus?: string | null;
  jobRoleValue?:       string | null;
  city?:               string | null;
  area?:               string | null;
  profilePicture?:     any;
  profileSummary?:     string | null;
  education?:          any[];
  skills?:             string[];
  onProfileUpdated?:   (updatedProfile: any) => void;
  onOpenEditModal?:    (open: () => void) => void;
}

export default function ProfileHeader({
  name, role, badges, onEdit, isMobile,
  phone, email, isVerified = false, isComplete = false,
  profileCompletion, verificationStatus, jobRoleValue, city, area,
  profilePicture, profileSummary, education = [], skills = [],
  onProfileUpdated, onOpenEditModal,
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 900;

  const isProfileComplete = (profileCompletion ?? (isComplete ? 100 : 0)) >= 100;

  // ── Image state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUri,       setImageUri]       = useState<string | null>(null);

  // Resolve profilePicture — handles string URL or { s3Key, url } object
  useEffect(() => {
    if (!profilePicture) { setImageUri(null); return; }
    if (typeof profilePicture === "string") { setImageUri(profilePicture); return; }
    if (profilePicture?.url)   { setImageUri(profilePicture.url);   return; }
    if (profilePicture?.s3Key) { setImageUri(profilePicture.s3Key); return; }
    setImageUri(null);
  }, [profilePicture]);

  const [showImageMenu,  setShowImageMenu]  = useState(false);
  const [showEditModal,  setShowEditModal]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);

  // Expose openEditModal to parent
  useEffect(() => {
    onOpenEditModal?.(() => setShowEditModal(true));
  }, [onOpenEditModal]);

  // ── Editable fields
  const [editName,     setEditName]     = useState(name);
  const [editRole,     setEditRole]     = useState<{ label: string; value: string } | null>(null);
  const [editPhone,    setEditPhone]    = useState((phone ?? "").replace(/^\+91/, ""));
  const [editCity,     setEditCity]     = useState(city ?? "");
  const [editArea,     setEditArea]     = useState(area ?? "");
  const [editSummary,  setEditSummary]  = useState(profileSummary ?? "");

  // Education (single entry)
  const [editEdu, setEditEdu] = useState<EducationEntry>({
    universityName: education[0]?.universityName ?? "",
    speciality:     education[0]?.speciality ?? "",
    startYear:      education[0]?.startYear ? String(education[0].startYear) : "",
    endYear:        education[0]?.endYear   ? String(education[0].endYear)   : "",
  });

  // Skills
  const [skillInput, setSkillInput] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>(skills ?? []);

  // Sync when modal opens
  useEffect(() => {
    if (!showEditModal) return;
    setEditName(name);
    setEditPhone((phone ?? "").replace(/^\+91/, ""));
    setEditCity(city ?? "");
    setEditArea(area ?? "");
    setEditSummary(profileSummary ?? "");
    setEditSkills(skills ?? []);
    setEditEdu({
      universityName: education[0]?.universityName ?? "",
      speciality:     education[0]?.speciality ?? "",
      startYear:      education[0]?.startYear ? String(education[0].startYear) : "",
      endYear:        education[0]?.endYear   ? String(education[0].endYear)   : "",
    });
    if (jobRoleValue) {
      setEditRole({ label: getRoleLabel(jobRoleValue), value: jobRoleValue });
    } else {
      setEditRole(getRoleByLabel(role));
    }
    setShowDropdown(false);
  }, [showEditModal]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  // ── Skills helpers
  const addSkill = () => {
    const t = skillInput.trim();
    if (!t) return;
    if (editSkills.some((s) => s.toLowerCase() === t.toLowerCase())) { setSkillInput(""); return; }
    setEditSkills([...editSkills, t]);
    setSkillInput("");
  };
  const removeSkill = (i: number) => setEditSkills(editSkills.filter((_, idx) => idx !== i));

  // ── Save profile — PUT /api/profile/me
  const handleSaveProfile = async () => {
    if (!editName.trim())                            { alert("Full name is required."); return; }
    if (!editRole)                                   { alert("Please select a job role."); return; }
    if (!editCity.trim())                            { alert("City is required."); return; }
    if (!editArea.trim())                            { alert("Area is required."); return; }
    if (editPhone.replace(/\D/g, "").length < 10)   { alert("Please enter a valid 10-digit phone number."); return; }

    const educationArray = editEdu.universityName.trim()
      ? [{
          universityName: editEdu.universityName.trim(),
          speciality:     editEdu.speciality.trim(),
          startYear:      editEdu.startYear.trim() ? Number(editEdu.startYear) : undefined,
          endYear:        editEdu.endYear.trim()   ? Number(editEdu.endYear)   : undefined,
        }]
      : [];

    const payload: any = {
      fullName:       editName.trim(),
      jobRole:        editRole.value,
      city:           editCity.trim(),
      area:           editArea.trim(),
      phoneNumber:    formatPhone(editPhone),
      profileSummary: editSummary.trim() || undefined,
      education:      educationArray.length > 0 ? educationArray : undefined,
      skills:         editSkills.length > 0 ? editSkills : undefined,
    };

    console.log("📤 Updating profile:", payload);
    setSaving(true);
    try {
      const res = await profileAPI.updateMyProfile(payload);
      console.log("✅ Profile updated:", res);
      setShowEditModal(false);
      onProfileUpdated?.(res.profile);
    } catch (err: any) {
      console.error("❌ Update error:", err?.response?.data);
      alert(err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Upload image — pass URI directly, API handles FormData creation
  const processImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      setImageUri(uri); // optimistic UI

      // ✅ Pass URI directly — API function handles FormData creation for both web and native
      const res = await profileAPI.uploadProfilePicture(uri);
      console.log("✅ Image uploaded:", res);

      if (res?.success) {
        const newUrl = res.profilePicture?.url ?? res.profilePicture ?? null;
        setImageUri(newUrl);
        onProfileUpdated?.({ profilePicture: res.profilePicture });
      } else {
        throw new Error(res?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      Alert.alert("Error", "Failed to upload profile picture.");
      setImageUri(
        typeof profilePicture === "string"
          ? profilePicture
          : profilePicture?.url ?? null
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpload = async () => {
    setShowImageMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Please allow access to your photo library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    setShowImageMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Please allow camera access."); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const handleRemove = async () => {
    setShowImageMenu(false);
    try {
      setUploadingImage(true);
      const res = await profileAPI.deleteProfilePicture();
      if (res.success) {
        setImageUri(null);
        onProfileUpdated?.({ profilePicture: null });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      Alert.alert("Error", "Failed to delete profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Reusable input component
  const renderInput = (
    icon: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    extra?: any
  ) => (
    <View style={styles.editInputRow}>
      <Ionicons name={icon as any} size={16} color="#94a3b8" style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#adb8c9"
        style={styles.editInput}
        {...extra}
      />
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>

        {/* ── Avatar ── */}
        <View style={styles.avatarWrap}>
          {uploadingImage ? (
            <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#94A3B8" />
            </View>
          )}
          <View style={styles.onlineDot} />
          <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowImageMenu(true)} activeOpacity={0.85}>
            <Ionicons name="camera" size={13} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Info ── */}
        <View style={styles.info}>
          <Text style={[styles.name, isMobile && styles.nameMobile]}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
          <View style={styles.badgeRow}>
            {badges.slice(0, 1).map((badge, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}

            {verificationStatus === "verified" ? (
              <View style={[styles.pill, styles.pillGreen]}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={[styles.pillText, { color: "#059669" }]}>Verified Profile</Text>
              </View>
            ) : verificationStatus === "rejected" ? (
              <View style={[styles.pill, styles.pillRed]}>
                <Ionicons name="close-circle" size={12} color="#DC2626" />
                <Text style={[styles.pillText, { color: "#DC2626" }]}>Rejected</Text>
              </View>
            ) : (
              <View style={[styles.pill, styles.pillAmber]}>
                <Ionicons name="time-outline" size={12} color="#A16207" />
                <Text style={[styles.pillText, { color: "#A16207" }]}>Verification Pending</Text>
              </View>
            )}

            {isProfileComplete ? (
              <View style={[styles.pill, styles.pillGreen]}>
                <Ionicons name="checkmark-done-circle" size={12} color="#059669" />
                <Text style={[styles.pillText, { color: "#059669" }]}>Profile Complete</Text>
              </View>
            ) : (
              <View style={[styles.pill, styles.pillAmber]}>
                <Ionicons name="alert-circle-outline" size={12} color="#A16207" />
                <Text style={[styles.pillText, { color: "#A16207" }]}>
                  {profileCompletion != null ? `${profileCompletion}% Complete` : "Profile Incomplete"}
                </Text>
              </View>
            )}

            {phone && (
              <View style={styles.chip}>
                <Ionicons name="call-outline" size={11} color="#64748b" />
                <Text style={styles.chipText}>{phone}</Text>
              </View>
            )}
            {email && (
              <View style={styles.chip}>
                <Ionicons name="mail-outline" size={11} color="#64748b" />
                <Text style={styles.chipText}>{email}</Text>
                {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />}
              </View>
            )}
          </View>
        </View>

        {!isMobile && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {isMobile && (
        <TouchableOpacity style={styles.editBtnFull} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
          <Ionicons name="pencil" size={14} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      {/* ════════════════════════════════════════
          PHOTO MENU MODAL
      ════════════════════════════════════════ */}
      <Modal visible={showImageMenu} transparent animationType="fade" onRequestClose={() => setShowImageMenu(false)}>
        <TouchableOpacity style={[styles.overlay, isDesktop && styles.overlayCentered]} activeOpacity={1} onPress={() => setShowImageMenu(false)}>
          <TouchableOpacity activeOpacity={1} style={isDesktop ? styles.photoMenuDesktop : styles.photoMenuMobile} onPress={() => {}}>
            <View style={styles.photoMenuHeader}>
              <Text style={styles.menuTitle}>Profile Photo</Text>
              {isDesktop && <TouchableOpacity onPress={() => setShowImageMenu(false)}><Ionicons name="close" size={20} color={COLORS.subText} /></TouchableOpacity>}
            </View>
            {isDesktop && (
              <View style={styles.photoPreviewWrap}>
                {imageUri
                  ? <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                  : <View style={styles.photoPreviewPlaceholder}><Ionicons name="person" size={48} color="#94A3B8" /></View>
                }
              </View>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleUpload} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: "#EEF2FF" }]}><Ionicons name="image-outline" size={20} color={COLORS.primary} /></View>
              <View><Text style={styles.menuLabel}>Upload from Library</Text><Text style={styles.menuSub}>Choose a photo from your gallery</Text></View>
            </TouchableOpacity>
            {Platform.OS !== "web" && (
              <TouchableOpacity style={styles.menuItem} onPress={handleCamera} activeOpacity={0.75}>
                <View style={[styles.menuIcon, { backgroundColor: "#D1FAE5" }]}><Ionicons name="camera-outline" size={20} color="#059669" /></View>
                <View><Text style={styles.menuLabel}>Take a Photo</Text><Text style={styles.menuSub}>Use your camera</Text></View>
              </TouchableOpacity>
            )}
            {imageUri && (
              <TouchableOpacity style={styles.menuItem} onPress={handleRemove} activeOpacity={0.75}>
                <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}><Ionicons name="trash-outline" size={20} color="#DC2626" /></View>
                <View>
                  <Text style={[styles.menuLabel, { color: "#DC2626" }]}>Remove Photo</Text>
                  <Text style={styles.menuSub}>Revert to default avatar</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowImageMenu(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════
          EDIT PROFILE MODAL — Two Column Layout
      ════════════════════════════════════════ */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={[styles.overlay, styles.overlayCentered]}>
          <View style={[styles.editModal, !isDesktop && styles.editModalMobile]}>

            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: isDesktop ? 560 : 480 }}>

              {/* ── Avatar row ── */}
              <View style={styles.editAvatarRow}>
                {imageUri
                  ? <Image source={{ uri: imageUri }} style={styles.editAvatar} />
                  : <View style={[styles.editAvatar, { backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }]}>
                      <Ionicons name="person" size={36} color="#94A3B8" />
                    </View>
                }
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => { setShowEditModal(false); setTimeout(() => setShowImageMenu(true), 300); }}>
                  <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editDivider} />

              {/* ══════════════════════════════════════
                  TWO COLUMN LAYOUT
              ══════════════════════════════════════ */}
              <View style={[styles.twoCol, !isDesktop && styles.twoColMobile]}>

                {/* ── LEFT COLUMN — Basic Info ── */}
                <View style={styles.colLeft}>
                  <Text style={styles.colSectionTitle}>
                    <Ionicons name="person-outline" size={13} color={COLORS.primary} /> Basic Info
                  </Text>

                  <Text style={styles.editLabel}>Full Name</Text>
                  {renderInput("person-outline", editName, setEditName, "Dr. Rahul", { autoCapitalize: "words" })}

                  <Text style={styles.editLabel}>Job Role</Text>
                  <TouchableOpacity style={styles.editInputRow} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
                    <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <Text style={[styles.editInput, { color: editRole ? COLORS.text : "#adb8c9" }]}>
                      {editRole ? editRole.label : "Select your role"}
                    </Text>
                    <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
                  </TouchableOpacity>
                  {showDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} showsVerticalScrollIndicator>
                        {ROLES.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.dropdownItem, editRole?.value === item.value && styles.dropdownItemActive]}
                            onPress={() => { setEditRole(item); setShowDropdown(false); }}
                          >
                            <Text style={[styles.dropdownItemText, editRole?.value === item.value && styles.dropdownItemTextActive]}>
                              {item.label}
                            </Text>
                            {editRole?.value === item.value && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>City</Text>
                      {renderInput("business-outline", editCity, setEditCity, "e.g. Pune")}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>Area</Text>
                      {renderInput("location-outline", editArea, setEditArea, "e.g. Wagholi")}
                    </View>
                  </View>

                  <Text style={styles.editLabel}>Phone Number</Text>
                  <View style={styles.editInputRow}>
                    <Ionicons name="call-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <Text style={styles.phonePrefix}>+91</Text>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="000-000-0000"
                      placeholderTextColor="#adb8c9"
                      style={styles.editInput}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <Text style={styles.editLabel}>
                    Profile Summary <Text style={styles.optionalTag}>(optional)</Text>
                  </Text>
                  <View style={[styles.editInputRow, styles.textAreaRow]}>
                    <Ionicons name="document-text-outline" size={16} color="#94a3b8" style={{ marginRight: 8, alignSelf: "flex-start", marginTop: 2 }} />
                    <TextInput
                      value={editSummary}
                      onChangeText={setEditSummary}
                      placeholder="e.g. Experienced general surgeon with 5+ years..."
                      placeholderTextColor="#adb8c9"
                      style={[styles.editInput, styles.textAreaInput]}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {/* ── RIGHT COLUMN — Education & Skills ── */}
                <View style={styles.colRight}>

                  {/* Education */}
                  <Text style={styles.colSectionTitle}>
                    <Ionicons name="school-outline" size={13} color={COLORS.primary} /> Education
                    <Text style={styles.optionalTag}> (optional)</Text>
                  </Text>

                  <Text style={styles.editLabel}>University / College</Text>
                  {renderInput(
                    "library-outline",
                    editEdu.universityName,
                    (v) => setEditEdu((p) => ({ ...p, universityName: v })),
                    "e.g. GMC Nagpur"
                  )}

                  <Text style={styles.editLabel}>Degree / Speciality</Text>
                  {renderInput(
                    "ribbon-outline",
                    editEdu.speciality,
                    (v) => setEditEdu((p) => ({ ...p, speciality: v })),
                    "e.g. MBBS, MS Surgery"
                  )}

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>Start Year</Text>
                      {renderInput(
                        "calendar-outline",
                        editEdu.startYear,
                        (v) => setEditEdu((p) => ({ ...p, startYear: v.replace(/\D/g, "") })),
                        "2018",
                        { keyboardType: "number-pad", maxLength: 4 }
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>End Year</Text>
                      {renderInput(
                        "calendar-outline",
                        editEdu.endYear,
                        (v) => setEditEdu((p) => ({ ...p, endYear: v.replace(/\D/g, "") })),
                        "2024",
                        { keyboardType: "number-pad", maxLength: 4 }
                      )}
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={[styles.editDivider, { marginTop: 16, marginBottom: 0 }]} />

                  {/* Skills */}
                  <Text style={[styles.colSectionTitle, { marginTop: 14 }]}>
                    <Ionicons name="flash-outline" size={13} color={COLORS.primary} /> Skills
                    <Text style={styles.optionalTag}> (optional)</Text>
                  </Text>

                  <Text style={styles.editLabel}>Add Skills</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <View style={[styles.editInputRow, { flex: 1, marginBottom: 0 }]}>
                      <Ionicons name="add-circle-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                      <TextInput
                        value={skillInput}
                        onChangeText={setSkillInput}
                        placeholder="e.g. surgery, ICU care"
                        placeholderTextColor="#adb8c9"
                        style={styles.editInput}
                        onSubmitEditing={addSkill}
                        returnKeyType="done"
                        blurOnSubmit={false}
                      />
                    </View>
                    <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill} activeOpacity={0.8}>
                      <Text style={styles.addSkillBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {editSkills.length > 0 && (
                    <View style={styles.chipsWrap}>
                      {editSkills.map((skill, i) => (
                        <View key={i} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{skill}</Text>
                          <TouchableOpacity onPress={() => removeSkill(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Ionicons name="close-circle" size={15} color={COLORS.primary} style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveProfile} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                }
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { backgroundColor: COLORS.white, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  row:         { flexDirection: "row", alignItems: "center", gap: 18 },
  avatarWrap:  { position: "relative" },
  avatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.border },
  onlineDot:   { position: "absolute", bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: "#22C55E", borderWidth: 2, borderColor: COLORS.white },
  cameraBtn:   { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white, zIndex: 10 },
  info:        { flex: 1, minWidth: 0 },
  name:        { fontSize: 22, fontWeight: "700", color: COLORS.text, letterSpacing: -0.4 },
  nameMobile:  { fontSize: 18 },
  role:        { fontSize: 13, color: COLORS.subText, marginTop: 4, marginBottom: 8 },
  badgeRow:    { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge:       { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF2FF", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE" },
  badgeText:   { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  pill:        { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  pillText:    { fontSize: 11, fontWeight: "600" },
  pillGreen:   { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  pillAmber:   { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  pillRed:     { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  chip:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  chipText:    { fontSize: 11, color: "#475569", fontWeight: "500" },
  editBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, flexShrink: 0 },
  editBtnFull: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Modals
  overlay:          { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  overlayCentered:  { justifyContent: "center", alignItems: "center" },

  // Photo menu
  photoMenuDesktop:        { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: 360, ...Platform.select({ web: { boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }, default: { elevation: 20 } }) },
  photoMenuMobile:         { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, width: "100%" },
  photoMenuHeader:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  menuTitle:               { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center", flex: 1 },
  photoPreviewWrap:        { alignItems: "center", marginBottom: 20 },
  photoPreview:            { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.border },
  photoPreviewPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
  menuItem:                { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuIcon:                { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel:               { fontSize: 15, fontWeight: "600", color: COLORS.text },
  menuSub:                 { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  menuCancel:              { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  menuCancelText:          { fontSize: 15, fontWeight: "600", color: COLORS.subText },

  // Edit modal
  editModal:       { backgroundColor: COLORS.white, borderRadius: 18, padding: 22, width: 760, maxWidth: "96%", ...Platform.select({ web: { boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }, default: { elevation: 24 } }) },
  editModalMobile: { width: "96%", padding: 18 },
  editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  editModalTitle:  { fontSize: 18, fontWeight: "800", color: COLORS.text },
  editAvatarRow:   { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  editAvatar:      { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.border },
  changePhotoBtn:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  changePhotoText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  editDivider:     { height: 1, backgroundColor: "#f1f5f9", marginBottom: 4 },

  // Two column
  twoCol:       { flexDirection: "row", gap: 20 },
  twoColMobile: { flexDirection: "column", gap: 0 },
  colLeft:      { flex: 1 },
  colRight:     { flex: 1 },
  colSectionTitle: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 4, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },

  // Form elements
  editLabel:    { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 10 },
  optionalTag:  { color: "#94a3b8", fontSize: 11, fontWeight: "400" },
  editInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, height: 44 },
  editInput:    { flex: 1, fontSize: 14, color: COLORS.text, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  textAreaRow:  { height: "auto", minHeight: 76, alignItems: "flex-start", paddingVertical: 10 },
  textAreaInput: { minHeight: 56, paddingTop: 0 },
  phonePrefix:  { color: "#475569", fontSize: 14, fontWeight: "600", marginRight: 8 },
  phoneDivider: { width: 1, height: 20, backgroundColor: "#e2e8f0", marginRight: 10 },

  // Dropdown
  dropdownList:          { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }, default: { elevation: 8 } }) },
  dropdownItem:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownItemActive:    { backgroundColor: "#eff6ff" },
  dropdownItemText:      { fontSize: 13, color: "#64748b" },
  dropdownItemTextActive:{ color: COLORS.primary, fontWeight: "600" },

  // Skills
  addSkillBtn:     { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, height: 44, justifyContent: "center", alignItems: "center" },
  addSkillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  chipsWrap:       { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  skillChip:       { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  skillChipText:   { color: "#1d4ed8", fontSize: 12, fontWeight: "500" },

  // Action buttons
  editActions:   { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.white },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
  saveBtn:       { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary },
  saveBtnText:   { fontSize: 14, fontWeight: "700", color: "#fff" },
});