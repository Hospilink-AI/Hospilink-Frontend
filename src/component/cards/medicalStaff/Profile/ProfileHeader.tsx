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

// find label from value
const getRoleLabel = (value: string) =>
  ROLES.find((r) => r.value === value)?.label ?? value;

// find role object from label (for pre-filling dropdown)
const getRoleByLabel = (label: string) =>
  ROLES.find((r) => r.label === label) ?? null;

interface Props {
  name:        string;
  role:        string;   // display label e.g. "General Surgeon"
  badges:      string[];
  onEdit:      () => void;
  isMobile?:   boolean;
  phone?:      string | null;
  email?:      string | null;
  isVerified?: boolean;
  isComplete?: boolean;
  // raw jobRole value for PUT e.g. "general_surgeon"
  jobRoleValue?: string | null;
  city?:       string | null;
  area?:       string | null;
  profilePicture?: string | null;
  // callback to refresh parent after save
  onProfileUpdated?: (updatedProfile: any) => void;
}

export default function ProfileHeader({
  name, role, badges, onEdit, isMobile,
  phone, email, isVerified = false, isComplete = false,
  jobRoleValue, city, area, onProfileUpdated,profilePicture
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 900;

  
  const [uploadingImage, setUploadingImage] = useState(false); // New loading state for images
  const [imageUri,      setImageUri]      = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);

  // ── Editable fields — pre-filled from props
  const [editName,     setEditName]     = useState(name);
  const [editRole,     setEditRole]     = useState<{ label: string; value: string } | null>(null);
  const [editPhone,    setEditPhone]    = useState((phone ?? "").replace(/^\+91/, ""));
  const [editCity,     setEditCity]     = useState(city ?? "");
  const [editArea,     setEditArea]     = useState(area ?? "");

  // ── Sync fields when modal opens (always show latest)
  useEffect(() => {
    if (showEditModal) {
      setEditName(name);
      setEditPhone((phone ?? "").replace(/^\+91/, ""));
      setEditCity(city ?? "");
      setEditArea(area ?? "");
      // Pre-select role from raw value
      if (jobRoleValue) {
        setEditRole({ label: getRoleLabel(jobRoleValue), value: jobRoleValue });
      } else {
        setEditRole(getRoleByLabel(role));
      }
      setShowDropdown(false);
    }
  }, [showEditModal]);

  // ── Format phone
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  // ────────────────────────────────────────────────────────────
  // PUT /api/profile/me
  // ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) { alert("Full name is required."); return; }
    if (!editRole)        { alert("Please select a job role."); return; }
    if (!editCity.trim()) { alert("City is required."); return; }
    if (!editArea.trim()) { alert("Area is required."); return; }
    if (editPhone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const payload: any = {
      fullName:    editName.trim(),
      jobRole:     editRole.value,           // snake_case e.g. "general_surgeon"
      city:        editCity.trim(),
      area:        editArea.trim(),
      phoneNumber: formatPhone(editPhone),   // "+91XXXXXXXXXX"
    };

    console.log("📤 Updating profile:", payload);
    setSaving(true);

    try {
      const res = await profileAPI.updateMyProfile(payload);
      // res = { success, profile, message }
      console.log("✅ Profile updated:", res);
      setShowEditModal(false);
      // Notify parent to refresh displayed values
      onProfileUpdated?.(res.profile);
    } catch (err: any) {
      console.error("❌ Update error:", err?.response?.data);
      alert(err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Generic function to handle the API call for uploading
  const processImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      // Immediately set it locally for a snappy UI feel
      setImageUri(uri); 

      // Hit your backend
      const res = await profileAPI.uploadProfilePicture(uri);
      
      if (res.success) {
        // Update with the official S3 URL from your backend
        setImageUri(res.profilePicture); 
        onProfileUpdated?.({ profilePicture: res.profilePicture }); // Optional: update parent state
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload profile picture.");
      // Revert the image if upload failed
      setImageUri(profilePicture ?? null);
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
        onProfileUpdated?.({ profilePicture: null }); // Optional: update parent state
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>

        {/* ── Avatar ── */}
        <View style={styles.avatarWrap}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            : <View style={styles.avatar}><Ionicons name="person" size={40} color="#94A3B8" /></View>
          }
          <View style={styles.onlineDot} />
          <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowImageMenu(true)} activeOpacity={0.85}>
            <Ionicons name="camera" size={13} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Info ── */}
        <View style={styles.info}>
          <Text style={[styles.name, isMobile && styles.nameMobile]}>{name}</Text>
          <Text style={styles.role}>{role}</Text>

          {/* ── Single row: static badges + dynamic chips ── */}
          <View style={styles.badgeChipRow}>
            {badges.map((badge, i) => (
              <View key={i} style={[styles.badge, i === 1 && styles.verifiedBadge]}>
                {i === 1 && <Ionicons name="checkmark-circle" size={12} color="#059669" style={{ marginRight: 4 }} />}
                <Text style={[styles.badgeText, i === 1 && styles.verifiedText]}>{badge}</Text>
              </View>
            ))}

            {phone && (
              <View style={styles.chip}>
                <Ionicons name="call-outline" size={12} color="#64748b" />
                <Text style={styles.chipText}>{phone}</Text>
              </View>
            )}

            {email && (
              <View style={styles.chip}>
                <Ionicons name="mail-outline" size={12} color="#64748b" />
                <Text style={styles.chipText}>{email}</Text>
                {isVerified && <Ionicons name="checkmark-circle" size={12} color="#22c55e" />}
              </View>
            )}

            {(phone || email) && (
              <View style={[styles.chip, isComplete ? styles.chipGreen : styles.chipAmber]}>
                <Ionicons
                  name={isComplete ? "checkmark-done-circle-outline" : "ellipse-outline"}
                  size={12}
                  color={isComplete ? "#15803d" : "#b45309"}
                />
                <Text style={[styles.chipText, { color: isComplete ? "#15803d" : "#b45309" }]}>
                  {isComplete ? "Profile Complete" : "Profile Incomplete"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Edit button — desktop */}
        {!isMobile && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Edit button — mobile */}
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
                <View><Text style={[styles.menuLabel, { color: "#DC2626" }]}>Remove Photo</Text><Text style={styles.menuSub}>Revert to default avatar</Text></View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowImageMenu(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════
          EDIT PROFILE MODAL — PUT /api/profile/me
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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: isDesktop ? 420 : 460 }}>

              {/* Avatar row */}
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

              {/* ── Full Name ── */}
              <Text style={styles.editLabel}>Full Name</Text>
              <View style={styles.editInputRow}>
                <Ionicons name="person-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Dr. Rahul"
                  placeholderTextColor="#adb8c9"
                  style={styles.editInput}
                  autoCapitalize="words"
                />
              </View>

              {/* ── Job Role Dropdown ── */}
              <Text style={styles.editLabel}>Job Role</Text>
              <TouchableOpacity
                style={styles.editInputRow}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.8}
              >
                <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={[styles.editInput, { color: editRole ? COLORS.text : "#adb8c9" }]}>
                  {editRole ? editRole.label : "Select your role"}
                </Text>
                <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator>
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

              {/* ── City + Area ── */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editLabel}>City</Text>
                  <View style={styles.editInputRow}>
                    <Ionicons name="business-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={editCity}
                      onChangeText={setEditCity}
                      placeholder="e.g. Pune"
                      placeholderTextColor="#adb8c9"
                      style={styles.editInput}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editLabel}>Area</Text>
                  <View style={styles.editInputRow}>
                    <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={editArea}
                      onChangeText={setEditArea}
                      placeholder="e.g. Wagholi"
                      placeholderTextColor="#adb8c9"
                      style={styles.editInput}
                    />
                  </View>
                </View>
              </View>

              {/* ── Phone ── */}
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
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  row:        { flexDirection: "row", alignItems: "center", gap: 18 },
  avatarWrap: { position: "relative" },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
  avatarImage:{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.border },
  onlineDot:  { position: "absolute", bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: "#22C55E", borderWidth: 2, borderColor: COLORS.white },
  cameraBtn:  { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white, zIndex: 10 },
  info:       { flex: 1 },
  name:       { fontSize: 22, fontWeight: "700", color: COLORS.text, letterSpacing: -0.4 },
  nameMobile: { fontSize: 18 },
  role:       { fontSize: 13, color: COLORS.subText, marginTop: 4, marginBottom: 10 },
  badgeChipRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  badge:         { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText:     { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  verifiedBadge: { backgroundColor: "#F0FDF4", flexDirection: "row", alignItems: "center" },
  verifiedText:  { color: "#059669" },
  chip:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8fafc", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  chipGreen:  { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  chipAmber:  { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  chipText:   { fontSize: 11, color: "#475569", fontWeight: "500" },
  editBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, flexShrink: 0 },
  editBtnFull: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  overlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  overlayCentered: { justifyContent: "center", alignItems: "center" },
  photoMenuDesktop: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: 360, ...Platform.select({ web: { boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }, default: { elevation: 20 } }) },
  photoMenuMobile:  { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, width: "100%" },
  photoMenuHeader:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  menuTitle:               { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center", flex: 1 },
  photoPreviewWrap:        { alignItems: "center", marginBottom: 20 },
  photoPreview:            { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.border },
  photoPreviewPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
  menuItem:       { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel:      { fontSize: 15, fontWeight: "600", color: COLORS.text },
  menuSub:        { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  menuCancel:     { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  menuCancelText: { fontSize: 15, fontWeight: "600", color: COLORS.subText },
  editModal:       { backgroundColor: COLORS.white, borderRadius: 18, padding: 22, width: 440, maxWidth: "95%", ...Platform.select({ web: { boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }, default: { elevation: 24 } }) },
  editModalMobile: { width: "96%", padding: 18 },
  editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  editModalTitle:  { fontSize: 18, fontWeight: "800", color: COLORS.text },
  editAvatarRow:   { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  editAvatar:      { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.border },
  changePhotoBtn:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  changePhotoText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  editDivider:     { height: 1, backgroundColor: "#f1f5f9", marginBottom: 4 },
  editLabel:       { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 12 },
  editInputRow:    { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, height: 44 },
  editInput:       { flex: 1, fontSize: 14, color: COLORS.text },
  phonePrefix:     { color: "#475569", fontSize: 14, fontWeight: "600", marginRight: 8 },
  phoneDivider:    { width: 1, height: 20, backgroundColor: "#e2e8f0", marginRight: 10 },
  dropdownList:    { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }, default: { elevation: 8 } }) },
  dropdownItem:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownItemActive:   { backgroundColor: "#eff6ff" },
  dropdownItemText:     { fontSize: 13, color: "#64748b" },
  dropdownItemTextActive:{ color: COLORS.primary, fontWeight: "600" },
  editActions:   { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.white },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
  saveBtn:       { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary },
  saveBtnText:   { fontSize: 14, fontWeight: "700", color: "#fff" },
});