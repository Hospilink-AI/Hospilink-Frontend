

// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Modal,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   useWindowDimensions,
//   View,
// } from "react-native";
// import { profileAPI } from "../../../../service/api";

// const ROLES: { label: string; value: string }[] = [
//   { label: "RMO (Resident Medical Officer)", value: "rmo" },
//   { label: "Duty Medical Officer (DMO)", value: "dmo" },
//   { label: "General Physician", value: "general_physician" },
//   { label: "Intensivist / ICU Doctor", value: "intensivist" },
//   { label: "Emergency Medicine Doctor", value: "emergency_doctor" },
//   { label: "Anesthetist", value: "anesthetist" },
//   { label: "Pediatrician (NICU/PICU)", value: "pediatrician" },
//   { label: "Gynecologist (On-call)", value: "gynecologist" },
//   { label: "Orthopedic Surgeon", value: "orthopedic_surgeon" },
//   { label: "General Surgeon", value: "general_surgeon" },
//   { label: "Radiologist", value: "radiologist" },
//   { label: "Pathologist", value: "pathologist" },
//   { label: "Staff Nurse (Ward)", value: "staff_nurse" },
//   { label: "ICU Nurse", value: "icu_nurse" },
//   { label: "Emergency Nurse", value: "emergency_nurse" },
//   { label: "OT Nurse", value: "ot_nurse" },
//   { label: "Dialysis Nurse", value: "dialysis_nurse" },
//   { label: "NICU / PICU Nurse", value: "nicu_nurse" },
//   { label: "Lab Technician", value: "lab_technician" },
//   { label: "Radiology Technician", value: "radiology_technician" },
//   { label: "OT Technician", value: "ot_technician" },
//   { label: "Dialysis Technician", value: "dialysis_technician" },
//   { label: "Cath Lab Technician", value: "cath_lab_technician" },
//   { label: "ICU Technician", value: "icu_technician" },
//   { label: "Ward Boy", value: "ward_boy" },
//   { label: "Ayah / Female Attendant", value: "ayah" },
//   { label: "OPD Attendant", value: "opd_attendant" },
//   { label: "Emergency Attendant", value: "emergency_attendant" },
//   { label: "Patient Care Taker", value: "patient_care_taker" },
//   { label: "Pharmacist", value: "pharmacist" },
//   { label: "Pharmacy Assistant", value: "pharmacy_assistant" },
//   { label: "Biomedical Engineer", value: "biomedical_engineer" },
//   { label: "Housekeeping Staff", value: "housekeeping_staff" },
//   { label: "Security Guard", value: "security_guard" },
//   { label: "Ambulance Driver", value: "ambulance_driver" },
//   { label: "Receptionist", value: "receptionist" },
//   { label: "Billing Executive", value: "billing_executive" },
//   { label: "Medical Records Staff", value: "medical_records_staff" },
//   { label: "HR & Accounts", value: "hr_accounts" },
// ];

// const INDIAN_STATES = [
//   'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
//   'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
//   'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
//   'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
//   'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
//   'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
//   'Andaman and Nicobar Islands', 'Chandigarh',
//   'Dadra and Nagar Haveli and Daman and Diu',
//   'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
// ];

// interface EducationEntry {
//   universityName: string;
//   speciality: string;
//   startYear: string;
//   endYear: string;
// }

// const EMPTY_EDU: EducationEntry = { universityName: "", speciality: "", startYear: "", endYear: "" };

// const getRoleLabel = (value: string) =>
//   ROLES.find((r) => r.value === value)?.label ?? value;

// const getRoleByLabel = (label: string) =>
//   ROLES.find((r) => r.label === label) ?? null;

// interface Props {
//   name: string;
//   role: string;
//   speciality?: string;
//   badges: string[];
//   onEdit: () => void;
//   isMobile?: boolean;
//   phone?: string | null;
//   email?: string | null;
//   isVerified?: boolean;
//   isComplete?: boolean;
//   profileCompletion?: number | null;
//   verificationStatus?: string | null;
//   jobRoleValue?: string | null;
//   city?: string | null;
//   area?: string | null;
//   // ── new address fields
//   currentAddress?: string | null;
//   state?: string | null;
//   pincode?: string | null;
//   profilePicture?: any;
//   profileSummary?: string | null;
//   education?: any[];
//   skills?: string[];
//   onProfileUpdated?: (updatedProfile: any) => void;
//   onOpenEditModal?: (open: () => void) => void;
// }

// export default function ProfileHeader({
//   name, role, badges, onEdit, isMobile, speciality,
//   phone, email, isVerified = false, isComplete = false,
//   profileCompletion, verificationStatus, jobRoleValue, city, area,
//   currentAddress, state, pincode,
//   profilePicture, profileSummary, education = [], skills = [],
//   onProfileUpdated, onOpenEditModal,
// }: Props) {
//   const { width } = useWindowDimensions();
//   const isDesktop = Platform.OS === "web" && width > 900;

//   const isProfileComplete = (profileCompletion ?? (isComplete ? 100 : 0)) >= 100;

//   // ── Image state
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [imageUri, setImageUri] = useState<string | null>(null);

//   // Resolve profilePicture — handles string URL or { s3Key, url } object
//   useEffect(() => {
//     if (!profilePicture) { setImageUri(null); return; }
//     if (typeof profilePicture === "string") { setImageUri(profilePicture); return; }
//     if (profilePicture?.url) { setImageUri(profilePicture.url); return; }
//     if (profilePicture?.s3Key) { setImageUri(profilePicture.s3Key); return; }
//     setImageUri(null);
//   }, [profilePicture]);

//   const [showImageMenu, setShowImageMenu] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Expose openEditModal to parent
//   useEffect(() => {
//     onOpenEditModal?.(() => setShowEditModal(true));
//   }, [onOpenEditModal]);

//   // ── Editable fields
//   const [editName, setEditName] = useState(name);
//   const [editRole, setEditRole] = useState<{ label: string; value: string } | null>(null);
//   const [editCity, setEditCity] = useState(city ?? "");
//   const [editCurrentAddress, setEditCurrentAddress] = useState(currentAddress ?? "");
//   const [editState, setEditState] = useState(state ?? "");
//   const [editPincode, setEditPincode] = useState(pincode ?? "");
//   const [editSummary, setEditSummary] = useState(profileSummary ?? "");
//   const [showStateDropdown, setShowStateDropdown] = useState(false);
//   const [stateSearch, setStateSearch] = useState("");

//   // ── Education — supports multiple entries
//   const buildEduList = (raw: any[]): EducationEntry[] => {
//     if (!raw || raw.length === 0) return [{ ...EMPTY_EDU }];
//     return raw.map((e) => ({
//       universityName: e.universityName ?? "",
//       speciality: e.speciality ?? "",
//       startYear: e.startYear ? String(e.startYear) : "",
//       endYear: e.endYear ? String(e.endYear) : "",
//     }));
//   };
//   const [editEduList, setEditEduList] = useState<EducationEntry[]>(buildEduList(education));

//   const updateEdu = (index: number, field: keyof EducationEntry, value: string) => {
//     setEditEduList((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
//   };
//   const addEduEntry = () => setEditEduList((prev) => [...prev, { ...EMPTY_EDU }]);
//   const removeEduEntry = (index: number) =>
//     setEditEduList((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

//   // Skills
//   const [skillInput, setSkillInput] = useState("");
//   const [editSkills, setEditSkills] = useState<string[]>(skills ?? []);

//   // Sync when modal opens
//   useEffect(() => {
//     if (!showEditModal) return;
//     setEditName(name);
//     setEditCity(city ?? "");
//     setEditCurrentAddress(currentAddress ?? "");
//     setEditState(state ?? "");
//     setEditPincode(pincode ?? "");
//     setEditSummary(profileSummary ?? "");
//     setEditSkills(skills ?? []);
//     setEditEduList(buildEduList(education));
//     if (jobRoleValue) {
//       setEditRole({ label: getRoleLabel(jobRoleValue), value: jobRoleValue });
//     } else {
//       setEditRole(getRoleByLabel(role));
//     }
//     setShowDropdown(false);
//     setShowStateDropdown(false);
//     setStateSearch("");
//   }, [showEditModal]);

//   // ── Skills helpers
//   const addSkill = () => {
//     const t = skillInput.trim();
//     if (!t) return;
//     if (editSkills.some((s) => s.toLowerCase() === t.toLowerCase())) { setSkillInput(""); return; }
//     setEditSkills([...editSkills, t]);
//     setSkillInput("");
//   };
//   const removeSkill = (i: number) => setEditSkills(editSkills.filter((_, idx) => idx !== i));

//   // ── Save profile — PUT /api/profile/me
//   const handleSaveProfile = async () => {
//     if (!editName.trim()) { alert("Full name is required."); return; }
//     if (!editRole) { alert("Please select a job role."); return; }
//     if (!editCity.trim()) { alert("City is required."); return; }

//     // Build education array — exclude empty entries
//     const educationArray = editEduList
//       .filter((e) => e.universityName.trim())
//       .map((e) => ({
//         universityName: e.universityName.trim(),
//         speciality: e.speciality.trim(),
//         startYear: e.startYear.trim() ? Number(e.startYear) : undefined,
//         endYear: e.endYear.trim() ? Number(e.endYear) : undefined,
//       }));

//     const payload: any = {
//       fullName: editName.trim(),
//       jobRole: editRole.value,
//       city: editCity.trim(),
//       currentAddress: editCurrentAddress.trim() || undefined,
//       state: editState.trim() || undefined,
//       pincode: editPincode.trim() || undefined,
//       profileSummary: editSummary.trim() || undefined,
//       education: educationArray.length > 0 ? educationArray : undefined,
//       skills: editSkills.length > 0 ? editSkills : undefined,
//     };

//     console.log("📤 Updating profile:", payload);
//     setSaving(true);
//     try {
//       const res = await profileAPI.updateMyProfile(payload);
//       console.log("✅ Profile updated:", res);
//       setShowEditModal(false);
//       onProfileUpdated?.(res.profile);
//     } catch (err: any) {
//       console.error("❌ Update error:", err?.response?.data);
//       alert(err?.response?.data?.message || err?.message || "Failed to update profile.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Upload image — pass URI directly, API handles FormData creation
//   const processImageUpload = async (uri: string) => {
//     try {
//       setUploadingImage(true);
//       setImageUri(uri); // optimistic UI

//       const res = await profileAPI.uploadProfilePicture(uri);
//       console.log("✅ Image uploaded:", res);

//       if (res?.success) {
//         const newUrl = res.profilePicture?.url ?? res.profilePicture ?? null;
//         setImageUri(newUrl);
//         onProfileUpdated?.({ profilePicture: res.profilePicture });
//       } else {
//         throw new Error(res?.message || "Upload failed");
//       }
//     } catch (error: any) {
//       console.error("❌ Upload failed:", error);
//       Alert.alert("Error", "Failed to upload profile picture.");
//       setImageUri(
//         typeof profilePicture === "string"
//           ? profilePicture
//           : profilePicture?.url ?? null
//       );
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleUpload = async () => {
//     setShowImageMenu(false);
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") { Alert.alert("Permission required", "Please allow access to your photo library."); return; }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true, aspect: [1, 1], quality: 0.8,
//     });
//     if (!result.canceled && result.assets[0]) {
//       await processImageUpload(result.assets[0].uri);
//     }
//   };

//   const handleCamera = async () => {
//     setShowImageMenu(false);
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") { Alert.alert("Permission required", "Please allow camera access."); return; }
//     const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
//     if (!result.canceled && result.assets[0]) {
//       await processImageUpload(result.assets[0].uri);
//     }
//   };

//   const handleRemove = async () => {
//     setShowImageMenu(false);
//     try {
//       setUploadingImage(true);
//       const res = await profileAPI.deleteProfilePicture();
//       if (res.success) {
//         setImageUri(null);
//         onProfileUpdated?.({ profilePicture: null });
//       }
//     } catch (error) {
//       console.error("Delete failed:", error);
//       Alert.alert("Error", "Failed to delete profile picture.");
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   // ── Reusable input component
//   const renderInput = (
//     icon: string,
//     value: string,
//     onChange: (v: string) => void,
//     placeholder: string,
//     extra?: any
//   ) => (
//     <View style={styles.editInputRow}>
//       <Ionicons name={icon as any} size={16} color="#94a3b8" style={{ marginRight: 8 }} />
//       <TextInput
//         value={value}
//         onChangeText={onChange}
//         placeholder={placeholder}
//         placeholderTextColor="#adb8c9"
//         style={styles.editInput}
//         {...extra}
//       />
//     </View>
//   );

//   // ── Read-only info row (for phone / email)
//   const renderReadOnly = (icon: string, value: string | null | undefined, fallback: string) => (
//     <View style={[styles.editInputRow, styles.readOnlyRow]}>
//       <Ionicons name={icon as any} size={16} color="#94a3b8" style={{ marginRight: 8 }} />
//       <Text style={styles.readOnlyText}>{value || fallback}</Text>
//       <View style={styles.readOnlyBadge}>
//         <Ionicons name="lock-closed-outline" size={10} color="#94a3b8" />
//         <Text style={styles.readOnlyBadgeText}>Not editable</Text>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.card}>
//       <View style={styles.row}>

//         {/* ── Avatar ── */}
//         <View style={styles.avatarWrap}>
//           {uploadingImage ? (
//             <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
//               <ActivityIndicator size="small" color={COLORS.primary} />
//             </View>
//           ) : imageUri ? (
//             <Image source={{ uri: imageUri }} style={styles.avatarImage} />
//           ) : (
//             <View style={styles.avatar}>
//               <Ionicons name="person" size={40} color="#94A3B8" />
//             </View>
//           )}
//           <View style={styles.onlineDot} />
//           <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowImageMenu(true)} activeOpacity={0.85}>
//             <Ionicons name="camera" size={13} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {/* ── Info ── */}
//         <View style={styles.info}>
//           <Text style={[styles.name, isMobile && styles.nameMobile]}>{name}</Text>
//           <Text style={styles.role}>{role}</Text>
//           <View style={styles.badgeCol}>

//             {/* Row 1: Speciality + Verification status */}
//             <View style={styles.badgeRow}>
//               {speciality && (
//                 <View style={styles.badge}>
//                   <Text style={styles.badgeText}>{speciality}</Text>
//                 </View>
//               )}
//               {verificationStatus === "verified" ? (
//                 <View style={[styles.pill, styles.pillGreen]}>
//                   <Ionicons name="checkmark-circle" size={12} color="#059669" />
//                   <Text style={[styles.pillText, { color: "#059669" }]}>Verified Profile</Text>
//                 </View>
//               ) : verificationStatus === "rejected" ? (
//                 <View style={[styles.pill, styles.pillRed]}>
//                   <Ionicons name="close-circle" size={12} color="#DC2626" />
//                   <Text style={[styles.pillText, { color: "#DC2626" }]}>Rejected</Text>
//                 </View>
//               ) : (
//                 <View style={[styles.pill, styles.pillAmber]}>
//                   <Ionicons name="time-outline" size={12} color="#A16207" />
//                   <Text style={[styles.pillText, { color: "#A16207" }]}>Verification Pending</Text>
//                 </View>
//               )}
//             </View>

//             {/* Row 2: Profile completion + phone */}
//             <View style={styles.badgeRow}>
//               {isProfileComplete ? (
//                 <View style={[styles.pill, styles.pillGreen]}>
//                   <Ionicons name="checkmark-done-circle" size={12} color="#059669" />
//                   <Text style={[styles.pillText, { color: "#059669" }]}>Profile Complete</Text>
//                 </View>
//               ) : (
//                 <View style={[styles.pill, styles.pillAmber]}>
//                   <Ionicons name="alert-circle-outline" size={12} color="#A16207" />
//                   <Text style={[styles.pillText, { color: "#A16207" }]}>
//                     {profileCompletion != null ? `${profileCompletion}% Complete` : "Profile Incomplete"}
//                   </Text>
//                 </View>
//               )}
//               {phone && (
//                 <View style={styles.chip}>
//                   <Ionicons name="call-outline" size={11} color="#64748b" />
//                   <Text style={styles.chipText}>{phone}</Text>
//                 </View>
//               )}
//             </View>

//             {/* Row 3: Email */}
//             {email && (
//               <View style={styles.badgeRow}>
//                 <View style={styles.chip}>
//                   <Ionicons name="mail-outline" size={11} color="#64748b" />
//                   <Text style={styles.chipText}>{email}</Text>
//                   {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />}
//                 </View>
//               </View>
//             )}

//           </View>
//           {/* <View style={styles.badgeRow}>

//             {speciality && (
//               <View style={styles.badge}>
//                 <Text style={styles.badgeText}>{speciality}</Text>
//               </View>
//             )}

//             {verificationStatus === "verified" ? (
//               <View style={[styles.pill, styles.pillGreen]}>
//                 <Ionicons name="checkmark-circle" size={12} color="#059669" />
//                 <Text style={[styles.pillText, { color: "#059669" }]}>Verified Profile</Text>
//               </View>
//             ) : verificationStatus === "rejected" ? (
//               <View style={[styles.pill, styles.pillRed]}>
//                 <Ionicons name="close-circle" size={12} color="#DC2626" />
//                 <Text style={[styles.pillText, { color: "#DC2626" }]}>Rejected</Text>
//               </View>
//             ) : (
//               <View style={[styles.pill, styles.pillAmber]}>
//                 <Ionicons name="time-outline" size={12} color="#A16207" />
//                 <Text style={[styles.pillText, { color: "#A16207" }]}>Verification Pending</Text>
//               </View>
//             )}

//             {isProfileComplete ? (
//               <View style={[styles.pill, styles.pillGreen]}>
//                 <Ionicons name="checkmark-done-circle" size={12} color="#059669" />
//                 <Text style={[styles.pillText, { color: "#059669" }]}>Profile Complete</Text>
//               </View>
//             ) : (
//               <View style={[styles.pill, styles.pillAmber]}>
//                 <Ionicons name="alert-circle-outline" size={12} color="#A16207" />
//                 <Text style={[styles.pillText, { color: "#A16207" }]}>
//                   {profileCompletion != null ? `${profileCompletion}% Complete` : "Profile Incomplete"}
//                 </Text>
//               </View>
//             )}

//             {phone && (
//               <View style={styles.chip}>
//                 <Ionicons name="call-outline" size={11} color="#64748b" />
//                 <Text style={styles.chipText}>{phone}</Text>
//               </View>
//             )}
//             {email && (
//               <View style={styles.chip}>
//                 <Ionicons name="mail-outline" size={11} color="#64748b" />
//                 <Text style={styles.chipText}>{email}</Text>
//                 {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />}
//               </View>
//             )}
//           </View> */}
//         </View>

//         {!isMobile && (
//           <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
//             <Ionicons name="pencil" size={14} color="#fff" />
//             <Text style={styles.editBtnText}>Edit Profile</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {isMobile && (
//         <TouchableOpacity style={styles.editBtnFull} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
//           <Ionicons name="pencil" size={14} color="#fff" />
//           <Text style={styles.editBtnText}>Edit Profile</Text>
//         </TouchableOpacity>
//       )}

//       {/* ════════════════════════════════════════
//           PHOTO MENU MODAL
//       ════════════════════════════════════════ */}
//       <Modal visible={showImageMenu} transparent animationType="fade" onRequestClose={() => setShowImageMenu(false)}>
//         <TouchableOpacity style={[styles.overlay, isDesktop && styles.overlayCentered]} activeOpacity={1} onPress={() => setShowImageMenu(false)}>
//           <TouchableOpacity activeOpacity={1} style={isDesktop ? styles.photoMenuDesktop : styles.photoMenuMobile} onPress={() => { }}>
//             <View style={styles.photoMenuHeader}>
//               <Text style={styles.menuTitle}>Profile Photo</Text>
//               {isDesktop && <TouchableOpacity onPress={() => setShowImageMenu(false)}><Ionicons name="close" size={20} color={COLORS.subText} /></TouchableOpacity>}
//             </View>
//             {isDesktop && (
//               <View style={styles.photoPreviewWrap}>
//                 {imageUri
//                   ? <Image source={{ uri: imageUri }} style={styles.photoPreview} />
//                   : <View style={styles.photoPreviewPlaceholder}><Ionicons name="person" size={48} color="#94A3B8" /></View>
//                 }
//               </View>
//             )}
//             <TouchableOpacity style={styles.menuItem} onPress={handleUpload} activeOpacity={0.75}>
//               <View style={[styles.menuIcon, { backgroundColor: "#EEF2FF" }]}><Ionicons name="image-outline" size={20} color={COLORS.primary} /></View>
//               <View><Text style={styles.menuLabel}>Upload from Library</Text><Text style={styles.menuSub}>Choose a photo from your gallery</Text></View>
//             </TouchableOpacity>
//             {Platform.OS !== "web" && (
//               <TouchableOpacity style={styles.menuItem} onPress={handleCamera} activeOpacity={0.75}>
//                 <View style={[styles.menuIcon, { backgroundColor: "#D1FAE5" }]}><Ionicons name="camera-outline" size={20} color="#059669" /></View>
//                 <View><Text style={styles.menuLabel}>Take a Photo</Text><Text style={styles.menuSub}>Use your camera</Text></View>
//               </TouchableOpacity>
//             )}
//             {imageUri && (
//               <TouchableOpacity style={styles.menuItem} onPress={handleRemove} activeOpacity={0.75}>
//                 <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}><Ionicons name="trash-outline" size={20} color="#DC2626" /></View>
//                 <View>
//                   <Text style={[styles.menuLabel, { color: "#DC2626" }]}>Remove Photo</Text>
//                   <Text style={styles.menuSub}>Revert to default avatar</Text>
//                 </View>
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity style={styles.menuCancel} onPress={() => setShowImageMenu(false)}>
//               <Text style={styles.menuCancelText}>Cancel</Text>
//             </TouchableOpacity>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </Modal>

//       {/* ════════════════════════════════════════
//           EDIT PROFILE MODAL — Two Column Layout
//       ════════════════════════════════════════ */}
//       <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
//         <View style={[styles.overlay, styles.overlayCentered]}>
//           <View style={[styles.editModal, !isDesktop && styles.editModalMobile]}>

//             <View style={styles.editModalHeader}>
//               <Text style={styles.editModalTitle}>Edit Profile</Text>
//               <TouchableOpacity onPress={() => setShowEditModal(false)}>
//                 <Ionicons name="close" size={22} color={COLORS.subText} />
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: isDesktop ? 560 : 480 }}>

//               {/* ── Avatar row ── */}
//               <View style={styles.editAvatarRow}>
//                 {imageUri
//                   ? <Image source={{ uri: imageUri }} style={styles.editAvatar} />
//                   : <View style={[styles.editAvatar, { backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }]}>
//                     <Ionicons name="person" size={36} color="#94A3B8" />
//                   </View>
//                 }
//                 <TouchableOpacity style={styles.changePhotoBtn} onPress={() => { setShowEditModal(false); setTimeout(() => setShowImageMenu(true), 300); }}>
//                   <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
//                   <Text style={styles.changePhotoText}>Change Photo</Text>
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.editDivider} />

//               {/* ══════════════════════════════════════
//                   TWO COLUMN LAYOUT
//               ══════════════════════════════════════ */}
//               <View style={[styles.twoCol, !isDesktop && styles.twoColMobile]}>

//                 {/* ── LEFT COLUMN — Basic Info ── */}
//                 <View style={styles.colLeft}>
//                   <Text style={styles.colSectionTitle}>
//                     <Ionicons name="person-outline" size={13} color={COLORS.primary} /> Basic Info
//                   </Text>

//                   <Text style={styles.editLabel}>Full Name</Text>
//                   {renderInput("person-outline", editName, setEditName, "Dr. Rahul", { autoCapitalize: "words" })}

//                   <Text style={styles.editLabel}>Job Role</Text>
//                   <TouchableOpacity style={styles.editInputRow} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
//                     <Ionicons name="briefcase-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
//                     <Text style={[styles.editInput, { color: editRole ? COLORS.text : "#adb8c9" }]}>
//                       {editRole ? editRole.label : "Select your role"}
//                     </Text>
//                     <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
//                   </TouchableOpacity>
//                   {showDropdown && (
//                     <View style={styles.dropdownList}>
//                       <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} showsVerticalScrollIndicator>
//                         {ROLES.map((item) => (
//                           <TouchableOpacity
//                             key={item.value}
//                             style={[styles.dropdownItem, editRole?.value === item.value && styles.dropdownItemActive]}
//                             onPress={() => { setEditRole(item); setShowDropdown(false); }}
//                           >
//                             <Text style={[styles.dropdownItemText, editRole?.value === item.value && styles.dropdownItemTextActive]}>
//                               {item.label}
//                             </Text>
//                             {editRole?.value === item.value && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
//                           </TouchableOpacity>
//                         ))}
//                       </ScrollView>
//                     </View>
//                   )}

//                   {/* ── Phone & Email — read-only ── */}
//                   <Text style={styles.editLabel}>Phone Number</Text>
//                   {renderReadOnly("call-outline", phone, "Not provided")}

//                   <Text style={styles.editLabel}>Email</Text>
//                   {renderReadOnly("mail-outline", email, "Not provided")}

//                   {/* ── Address fields ── */}
//                   <Text style={styles.editLabel}>Current Address <Text style={styles.optionalTag}>(optional)</Text></Text>
//                   {renderInput("home-outline", editCurrentAddress, setEditCurrentAddress, "e.g. Akrudi Railway Station")}

//                   <View style={{ flexDirection: "row", gap: 8 }}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.editLabel}>City</Text>
//                       {renderInput("business-outline", editCity, setEditCity, "e.g. Pune")}
//                     </View>

//                   </View>

//                   <View style={{ flexDirection: "row", gap: 8, zIndex: 20 }}>
//                     <View style={{ flex: 1, zIndex: 20 }}>
//                       {/* <Text style={styles.editLabel}>State <Text style={styles.optionalTag}>(optional)</Text></Text>
//                       {renderInput("map-outline", editState, setEditState, "e.g. Maharashtra")} */}

//                       <Text style={styles.editLabel}>
//                         State <Text style={styles.optionalTag}>(optional)</Text>
//                       </Text>

//                       {/* Trigger button */}
//                       <TouchableOpacity
//                         style={styles.editInputRow}
//                         onPress={() => { setShowStateDropdown((v) => !v); setStateSearch(""); }}
//                         activeOpacity={0.8}
//                       >
//                         <Ionicons name="map-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
//                         <Text style={[styles.editInput, { color: editState ? COLORS.text : "#adb8c9" }]}>
//                           {editState || "Select state"}
//                         </Text>
//                         {editState ? (
//                           <TouchableOpacity
//                             onPress={(e) => { e.stopPropagation(); setEditState(""); setShowStateDropdown(false); }}
//                             hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                           >
//                             <Ionicons name="close-circle" size={15} color="#94a3b8" />
//                           </TouchableOpacity>
//                         ) : (
//                           <Ionicons name={showStateDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
//                         )}
//                       </TouchableOpacity>

//                       {/* Dropdown panel */}
//                       {showStateDropdown && (
//                         <View style={styles.stateDropdown}>
//                           {/* Search box */}
//                           <View style={styles.stateSearchRow}>
//                             {/* <Ionicons name="search-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} /> */}
//                             <TextInput
//                               value={stateSearch}
//                               onChangeText={setStateSearch}
//                               placeholder="Search state..."
//                               placeholderTextColor="#adb8c9"
//                               style={styles.stateSearchInput}
//                               autoFocus
//                             />
//                             {stateSearch.length > 0 && (
//                               <TouchableOpacity onPress={() => setStateSearch("")}>
//                                 <Ionicons name="close" size={14} color="#94a3b8" />
//                               </TouchableOpacity>
//                             )}
//                           </View>

//                           <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
//                             {INDIAN_STATES
//                               .filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
//                               .map((s) => (
//                                 <TouchableOpacity
//                                   key={s}
//                                   style={[styles.stateItem, editState === s && styles.stateItemActive]}
//                                   onPress={() => { setEditState(s); setShowStateDropdown(false); setStateSearch(""); }}
//                                 >
//                                   <Text style={[styles.stateItemText, editState === s && styles.stateItemTextActive]}>
//                                     {s}
//                                   </Text>
//                                   {editState === s && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
//                                 </TouchableOpacity>
//                               ))
//                             }
//                             {INDIAN_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
//                               <View style={styles.stateNoResult}>
//                                 <Text style={styles.stateNoResultText}>No state found</Text>
//                               </View>
//                             )}
//                           </ScrollView>
//                         </View>
//                       )}
//                     </View>
//                     <View style={{ flex: 1, zIndex: 20 }}>
//                       <Text style={styles.editLabel}>Pincode <Text style={styles.optionalTag}>(optional)</Text></Text>
//                       {renderInput("pin-outline", editPincode, setEditPincode, "e.g. 411035", { keyboardType: "number-pad", maxLength: 6 })}
//                     </View>
//                   </View>

//                   <Text style={styles.editLabel}>
//                     Profile Summary <Text style={styles.optionalTag}>(optional)</Text>
//                   </Text>
//                   <View style={[styles.editInputRow, styles.textAreaRow]}>
//                     <Ionicons name="document-text-outline" size={16} color="#94a3b8" style={{ marginRight: 8, alignSelf: "flex-start", marginTop: 2 }} />
//                     <TextInput
//                       value={editSummary}
//                       onChangeText={setEditSummary}
//                       placeholder="e.g. Experienced general surgeon with 5+ years..."
//                       placeholderTextColor="#adb8c9"
//                       style={[styles.editInput, styles.textAreaInput]}
//                       multiline
//                       numberOfLines={3}
//                       textAlignVertical="top"
//                     />
//                   </View>
//                 </View>

//                 {/* ── RIGHT COLUMN — Education & Skills ── */}
//                 <View style={styles.colRight}>

//                   {/* ── Education — multiple entries ── */}
//                   <View style={styles.sectionTitleRow}>
//                     <Text style={styles.colSectionTitle}>
//                       <Ionicons name="school-outline" size={13} color={COLORS.primary} /> Education
//                       <Text style={styles.optionalTag}> (optional)</Text>
//                     </Text>
//                     <TouchableOpacity style={styles.addEduBtn} onPress={addEduEntry} activeOpacity={0.8}>
//                       <Ionicons name="add" size={14} color={COLORS.primary} />
//                       <Text style={styles.addEduBtnText}>Add</Text>
//                     </TouchableOpacity>
//                   </View>

//                   {editEduList.map((edu, index) => (
//                     <View key={index} style={styles.eduCard}>
//                       {/* Header row with index + remove button */}
//                       <View style={styles.eduCardHeader}>
//                         <Text style={styles.eduCardIndex}>#{index + 1}</Text>
//                         {editEduList.length > 1 && (
//                           <TouchableOpacity onPress={() => removeEduEntry(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//                             <Ionicons name="trash-outline" size={15} color="#DC2626" />
//                           </TouchableOpacity>
//                         )}
//                       </View>

//                       <Text style={styles.editLabel}>University / College</Text>
//                       {renderInput(
//                         "library-outline",
//                         edu.universityName,
//                         (v) => updateEdu(index, "universityName", v),
//                         "e.g. GMC Nagpur"
//                       )}

//                       <Text style={styles.editLabel}>Degree / Speciality</Text>
//                       {renderInput(
//                         "ribbon-outline",
//                         edu.speciality,
//                         (v) => updateEdu(index, "speciality", v),
//                         "e.g. MBBS, MS Surgery"
//                       )}

//                       <View style={{ flexDirection: "row", gap: 8 }}>
//                         <View style={{ flex: 1 }}>
//                           <Text style={styles.editLabel}>Start Year</Text>
//                           {renderInput(
//                             "calendar-outline",
//                             edu.startYear,
//                             (v) => updateEdu(index, "startYear", v.replace(/\D/g, "")),
//                             "2018",
//                             { keyboardType: "number-pad", maxLength: 4 }
//                           )}
//                         </View>
//                         <View style={{ flex: 1 }}>
//                           <Text style={styles.editLabel}>End Year</Text>
//                           {renderInput(
//                             "calendar-outline",
//                             edu.endYear,
//                             (v) => updateEdu(index, "endYear", v.replace(/\D/g, "")),
//                             "2024",
//                             { keyboardType: "number-pad", maxLength: 4 }
//                           )}
//                         </View>
//                       </View>
//                     </View>
//                   ))}

//                   {/* Divider */}
//                   <View style={[styles.editDivider, { marginTop: 16, marginBottom: 0 }]} />

//                   {/* Skills */}
//                   <Text style={[styles.colSectionTitle, { marginTop: 14 }]}>
//                     <Ionicons name="flash-outline" size={13} color={COLORS.primary} /> Skills
//                     <Text style={styles.optionalTag}> (optional)</Text>
//                   </Text>

//                   <Text style={styles.editLabel}>Add Skills</Text>
//                   <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
//                     <View style={[styles.editInputRow, { flex: 1, marginBottom: 0 }]}>
//                       <Ionicons name="add-circle-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
//                       <TextInput
//                         value={skillInput}
//                         onChangeText={setSkillInput}
//                         placeholder="e.g. surgery, ICU care"
//                         placeholderTextColor="#adb8c9"
//                         style={styles.editInput}
//                         onSubmitEditing={addSkill}
//                         returnKeyType="done"
//                         blurOnSubmit={false}
//                       />
//                     </View>
//                     <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill} activeOpacity={0.8}>
//                       <Text style={styles.addSkillBtnText}>Add</Text>
//                     </TouchableOpacity>
//                   </View>

//                   {editSkills.length > 0 && (
//                     <View style={styles.chipsWrap}>
//                       {editSkills.map((skill, i) => (
//                         <View key={i} style={styles.skillChip}>
//                           <Text style={styles.skillChipText}>{skill}</Text>
//                           <TouchableOpacity onPress={() => removeSkill(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
//                             <Ionicons name="close-circle" size={15} color={COLORS.primary} style={{ marginLeft: 4 }} />
//                           </TouchableOpacity>
//                         </View>
//                       ))}
//                     </View>
//                   )}
//                 </View>

//               </View>
//             </ScrollView>

//             {/* Action buttons */}
//             <View style={styles.editActions}>
//               <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)} disabled={saving}>
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveProfile} disabled={saving}>
//                 {saving
//                   ? <ActivityIndicator color="#fff" size="small" />
//                   : <>
//                     <Ionicons name="checkmark" size={16} color="#fff" />
//                     <Text style={styles.saveBtnText}>Save Changes</Text>
//                   </>
//                 }
//               </TouchableOpacity>
//             </View>

//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
//   row: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
//   avatarWrap: { position: "relative" },
//   avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
//   avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.border },
//   onlineDot: { position: "absolute", bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: "#22C55E", borderWidth: 2, borderColor: COLORS.white },
//   cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white, zIndex: 10 },
//   info: { flex: 1, minWidth: 0 },
//   name: { fontSize: 22, fontWeight: "700", color: COLORS.text, letterSpacing: -0.4 },
//   nameMobile: { fontSize: 18 },
//   role: { fontSize: 13, color: COLORS.subText, marginTop: 4, marginBottom: 8 },
//   badgeCol: { gap: 6, marginTop: 6 },
// badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
//   // badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
//   badge: { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF2FF", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE" },
//   badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
//   pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
//   pillText: { fontSize: 11, fontWeight: "600" },
//   pillGreen: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
//   pillAmber: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
//   pillRed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
//   chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F8FAFC", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" },
//   chipText: { fontSize: 11, color: "#475569", fontWeight: "500" },
//   editBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, flexShrink: 0 },
//   editBtnFull: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
//   editBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

//   // Modals
//   overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
//   overlayCentered: { justifyContent: "center", alignItems: "center" },

//   // State searchable dropdown
//   stateDropdown: {
//     position: "absolute",
//     top: 80,          // sits just below the trigger button
//     left: 0,
//     right: 0,
//     zIndex: 999,
//     backgroundColor: COLORS.white,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     borderRadius: 8,
//     overflow: "hidden",
//     ...Platform.select({
//       web: { boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
//       default: { elevation: 16 }
//     })
//   },
//   stateSearchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#f8fafc" },
//   stateSearchInput: { flex: 1, fontSize: 13, color: COLORS.text, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
//   stateItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
//   stateItemActive: { backgroundColor: "#eff6ff" },
//   stateItemText: { fontSize: 13, color: "#64748b" },
//   stateItemTextActive: { color: COLORS.primary, fontWeight: "600" },
//   stateNoResult: { paddingVertical: 14, alignItems: "center" },
//   stateNoResultText: { fontSize: 13, color: "#94a3b8" },

//   // Photo menu
//   photoMenuDesktop: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: 360, ...Platform.select({ web: { boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }, default: { elevation: 20 } }) },
//   photoMenuMobile: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, width: "100%" },
//   photoMenuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
//   menuTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center", flex: 1 },
//   photoPreviewWrap: { alignItems: "center", marginBottom: 20 },
//   photoPreview: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.border },
//   photoPreviewPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
//   menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
//   menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
//   menuLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
//   menuSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
//   menuCancel: { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
//   menuCancelText: { fontSize: 15, fontWeight: "600", color: COLORS.subText },

//   // Edit modal
//   editModal: { backgroundColor: COLORS.white, borderRadius: 18, padding: 22, width: 760, maxWidth: "96%", ...Platform.select({ web: { boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }, default: { elevation: 24 } }) },
//   editModalMobile: { width: "96%", padding: 18 },
//   editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
//   editModalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
//   editAvatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
//   editAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.border },
//   changePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
//   changePhotoText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
//   editDivider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 4 },

//   // Two column
//   twoCol: { flexDirection: "row", gap: 20 },
//   twoColMobile: { flexDirection: "column", gap: 0 },
//   colLeft: { flex: 1 },
//   colRight: { flex: 1 },
//   colSectionTitle: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 4, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },

//   // Form elements
//   editLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 10 },
//   optionalTag: { color: "#94a3b8", fontSize: 11, fontWeight: "400" },
//   editInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, height: 44 },
//   editInput: { flex: 1, fontSize: 14, color: COLORS.text, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
//   textAreaRow: { height: "auto", minHeight: 76, alignItems: "flex-start", paddingVertical: 10 },
//   textAreaInput: { minHeight: 56, paddingTop: 0 },

//   // Read-only field styles
//   readOnlyRow: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
//   readOnlyText: { flex: 1, fontSize: 14, color: "#94a3b8" },
//   readOnlyBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
//   readOnlyBadgeText: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },

//   // Dropdown
//   dropdownList: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }, default: { elevation: 8 } }) },
//   dropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
//   dropdownItemActive: { backgroundColor: "#eff6ff" },
//   dropdownItemText: { fontSize: 13, color: "#64748b" },
//   dropdownItemTextActive: { color: COLORS.primary, fontWeight: "600" },

//   // Education card (multi-entry)
//   sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 4 },
//   addEduBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
//   addEduBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
//   eduCard: { backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", padding: 12, marginBottom: 10 },
//   eduCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
//   eduCardIndex: { fontSize: 11, fontWeight: "700", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.4 },

//   // Skills
//   addSkillBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, height: 44, justifyContent: "center", alignItems: "center" },
//   addSkillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
//   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
//   skillChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
//   skillChipText: { color: "#1d4ed8", fontSize: 12, fontWeight: "500" },

//   // Action buttons
//   editActions: { flexDirection: "row", gap: 10, marginTop: 16 },
//   cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.white },
//   cancelBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
//   saveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary },
//   saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
// });


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

const EXPERIENCE_OPTIONS = [
  '0-1 year',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10-15 years',
  '15-20 years',
  '20+ years',
];

interface EducationEntry {
  universityName: string;
  speciality: string;
  startYear: string;
  endYear: string;
}

const EMPTY_EDU: EducationEntry = { universityName: "", speciality: "", startYear: "", endYear: "" };

const getRoleLabel = (value: string) =>
  ROLES.find((r) => r.value === value)?.label ?? value;

const getRoleByLabel = (label: string) =>
  ROLES.find((r) => r.label === label) ?? null;

interface Props {
  name: string;
  role: string;
  speciality?: string;
  badges: string[];
  onEdit: () => void;
  isMobile?: boolean;
  phone?: string | null;
  email?: string | null;
  isVerified?: boolean;
  isComplete?: boolean;
  profileCompletion?: number | null;
  verificationStatus?: string | null;
  jobRoleValue?: string | null;
  city?: string | null;
  area?: string | null;
  currentAddress?: string | null;
  state?: string | null;
  pincode?: string | null;
  profilePicture?: any;
  profileSummary?: string | null;
  education?: any[];
  skills?: string[];
  experience?: string | null;
  onProfileUpdated?: (updatedProfile: any) => void;
  onOpenEditModal?: (open: () => void) => void;
}

export default function ProfileHeader({
  name, role, badges, onEdit, isMobile, speciality,
  phone, email, isVerified = false, isComplete = false,
  profileCompletion, verificationStatus, jobRoleValue, city, area,
  currentAddress, state, pincode,
  profilePicture, profileSummary, education = [], skills = [], experience,
  onProfileUpdated, onOpenEditModal,
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 900;

  const isProfileComplete = (profileCompletion ?? (isComplete ? 100 : 0)) >= 100;

  // ── Image state ──
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!profilePicture) { setImageUri(null); return; }
    if (typeof profilePicture === "string") { setImageUri(profilePicture); return; }
    if (profilePicture?.url) { setImageUri(profilePicture.url); return; }
    if (profilePicture?.s3Key) { setImageUri(profilePicture.s3Key); return; }
    setImageUri(null);
  }, [profilePicture]);

  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    onOpenEditModal?.(() => setShowEditModal(true));
  }, [onOpenEditModal]);

  // ── Editable fields ──
  const [editName, setEditName] = useState(name);
  const [editRole, setEditRole] = useState<{ label: string; value: string } | null>(null);
  const [editCity, setEditCity] = useState(city ?? "");
  const [editCurrentAddress, setEditCurrentAddress] = useState(currentAddress ?? "");
  const [editState, setEditState] = useState(state ?? "");
  const [editPincode, setEditPincode] = useState(pincode ?? "");
  const [editSummary, setEditSummary] = useState(profileSummary ?? "");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const [editExperience, setEditExperience] = useState<string>(experience ?? "");
  const [showExpDropdown, setShowExpDropdown] = useState(false);

  const buildEduList = (raw: any[]): EducationEntry[] => {
    if (!raw || raw.length === 0) return [{ ...EMPTY_EDU }];
    return raw.map((e) => ({
      universityName: e.universityName ?? "",
      speciality: e.speciality ?? "",
      startYear: e.startYear ? String(e.startYear) : "",
      endYear: e.endYear ? String(e.endYear) : "",
    }));
  };
  const [editEduList, setEditEduList] = useState<EducationEntry[]>(buildEduList(education));

  const updateEdu = (index: number, field: keyof EducationEntry, value: string) => {
    setEditEduList((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };
  const addEduEntry = () => setEditEduList((prev) => [...prev, { ...EMPTY_EDU }]);
  const removeEduEntry = (index: number) =>
    setEditEduList((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const [skillInput, setSkillInput] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>(skills ?? []);

  useEffect(() => {
    if (!showEditModal) return;
    setEditName(name);
    setEditCity(city ?? "");
    setEditCurrentAddress(currentAddress ?? "");
    setEditState(state ?? "");
    setEditPincode(pincode ?? "");
    setEditSummary(profileSummary ?? "");
    setEditSkills(skills ?? []);
    setEditEduList(buildEduList(education));
    if (jobRoleValue) {
      setEditRole({ label: getRoleLabel(jobRoleValue), value: jobRoleValue });
    } else {
      setEditRole(getRoleByLabel(role));
    }
    setShowDropdown(false);
    setShowStateDropdown(false);
    setStateSearch("");
    setEditExperience(experience ?? "");
    setShowExpDropdown(false);
  }, [showEditModal]);

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t) return;
    if (editSkills.some((s) => s.toLowerCase() === t.toLowerCase())) { setSkillInput(""); return; }
    setEditSkills([...editSkills, t]);
    setSkillInput("");
  };
  const removeSkill = (i: number) => setEditSkills(editSkills.filter((_, idx) => idx !== i));

  const handleSaveProfile = async () => {
    if (!editName.trim()) { alert("Full name is required."); return; }
    if (!editRole) { alert("Please select a job role."); return; }
    if (!editCity.trim()) { alert("City is required."); return; }

    const educationArray = editEduList
      .filter((e) => e.universityName.trim())
      .map((e) => ({
        universityName: e.universityName.trim(),
        speciality: e.speciality.trim(),
        startYear: e.startYear.trim() ? Number(e.startYear) : undefined,
        endYear: e.endYear.trim() ? Number(e.endYear) : undefined,
      }));

    const payload: any = {
      fullName: editName.trim(),
      jobRole: editRole.value,
      city: editCity.trim(),
      currentAddress: editCurrentAddress.trim() || undefined,
      state: editState.trim() || undefined,
      pincode: editPincode.trim() || undefined,
      profileSummary: editSummary.trim() || undefined,
      education: educationArray.length > 0 ? educationArray : undefined,
      skills: editSkills.length > 0 ? editSkills : undefined,
      experience: editExperience || undefined,
    };

    setSaving(true);
    try {
      const res = await profileAPI.updateMyProfile(payload);
      setShowEditModal(false);
      onProfileUpdated?.(res.profile);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const processImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      setImageUri(uri);
      const res = await profileAPI.uploadProfilePicture(uri);
      if (res?.success) {
        const newUrl = res.profilePicture?.url ?? res.profilePicture ?? null;
        setImageUri(newUrl);
        onProfileUpdated?.({ profilePicture: res.profilePicture });
      } else {
        throw new Error(res?.message || "Upload failed");
      }
    } catch (error: any) {
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
    if (!result.canceled && result.assets[0]) await processImageUpload(result.assets[0].uri);
  };

  const handleCamera = async () => {
    setShowImageMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Please allow camera access."); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) await processImageUpload(result.assets[0].uri);
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
      Alert.alert("Error", "Failed to delete profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

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

  const renderReadOnly = (icon: string, value: string | null | undefined, fallback: string) => (
    <View style={[styles.editInputRow, styles.readOnlyRow]}>
      <Ionicons name={icon as any} size={16} color="#94a3b8" style={{ marginRight: 8 }} />
      <Text style={styles.readOnlyText}>{value || fallback}</Text>
      <View style={styles.readOnlyBadge}>
        <Ionicons name="lock-closed-outline" size={10} color="#94a3b8" />
        {/* <Text style={styles.readOnlyBadgeText}>Not editable</Text> */}
      </View>
    </View>
  );

  // return (
  //   <View style={styles.card}>

  //     {/* ══════════════════════════════════════════════════════
  //         ROW 1 — Avatar + Name/Role  |  Edit Profile button
  //         Web  : flex-row, space-between
  //         Mobile: flex-column (edit btn drops below, full width)
  //     ══════════════════════════════════════════════════════ */}
  //     <View style={[
  //       styles.headerRow,
  //       // isMobile && { flexDirection: "column", alignItems: "flex-start" },
  //     ]}>

  //       {/* Left: Avatar + Name + Role */}
  //       <View style={styles.headerLeft}>
  //         {/* ── Avatar ── */}
  //         <View style={styles.avatarWrap}>
  //           {uploadingImage ? (
  //             <View style={[styles.avatar, { alignItems: "center", justifyContent: "center" }]}>
  //               <ActivityIndicator size="small" color={COLORS.primary} />
  //             </View>
  //           ) : imageUri ? (
  //             <Image source={{ uri: imageUri }} style={styles.avatarImage} />
  //           ) : (
  //             <View style={styles.avatar}>
  //               <Ionicons name="person" size={40} color="#94A3B8" />
  //             </View>
  //           )}
  //           <View style={styles.onlineDot} />
  //           <TouchableOpacity
  //             style={styles.cameraBtn}
  //             onPress={() => setShowImageMenu(true)}
  //             activeOpacity={0.85}
  //           >
  //             <Ionicons name="camera" size={13} color="#fff" />
  //           </TouchableOpacity>
  //         </View>

  //         {/* Name + Role */}
  //         <View style={styles.nameBlock}>
  //           <Text style={[styles.name, isMobile && styles.nameMobile]}>{name}</Text>
  //           <Text style={styles.role}>{role}</Text>
  //         </View>
  //       </View>

  //       {/* Edit Profile button — right end on web, full width below on mobile */}
  //       <TouchableOpacity
  //         style={[
  //           styles.editBtn,
  //           // isMobile && { alignSelf: "stretch", justifyContent: "center", marginTop: 12 },
  //         ]}
  //         onPress={() => setShowEditModal(true)}
  //         activeOpacity={0.85}
  //       >
  //         <Ionicons name="pencil" size={isMobile ? 15 : 14} color="#fff" />
  //         {!isMobile && <Text style={styles.editBtnText}>Edit Profile</Text>}
  //       </TouchableOpacity>
  //     </View>

  //     {/* ══════════════════════════════════════════════════════
  //         ROW 2 — All badges / pills / chips
  //         Always sits below Row 1 on both web and mobile
  //     ══════════════════════════════════════════════════════ */}
  //     <View style={styles.badgeCol}>

  //       {/* Row 2a: Speciality + Verification status */}
  //       <View style={styles.badgeRow}>
  //         {speciality && (
  //           <View style={styles.badge}>
  //             <Text style={styles.badgeText}>{speciality}</Text>
  //           </View>
  //         )}
  //         {verificationStatus === "verified" ? (
  //           <View style={[styles.pill, styles.pillGreen]}>
  //             <Ionicons name="checkmark-circle" size={12} color="#059669" />
  //             <Text style={[styles.pillText, { color: "#059669" }]}>Verified Profile</Text>
  //           </View>
  //         ) : verificationStatus === "rejected" ? (
  //           <View style={[styles.pill, styles.pillRed]}>
  //             <Ionicons name="close-circle" size={12} color="#DC2626" />
  //             <Text style={[styles.pillText, { color: "#DC2626" }]}>Rejected</Text>
  //           </View>
  //         ) : (
  //           <View style={[styles.pill, styles.pillAmber]}>
  //             <Ionicons name="time-outline" size={12} color="#A16207" />
  //             <Text style={[styles.pillText, { color: "#A16207" }]}>Verification Pending</Text>
  //           </View>
  //         )}
  //       </View>

  //       {/* Row 2b: Profile completion + Phone */}
  //       <View style={styles.badgeRow}>
  //         {isProfileComplete ? (
  //           <View style={[styles.pill, styles.pillGreen]}>
  //             <Ionicons name="checkmark-done-circle" size={12} color="#059669" />
  //             <Text style={[styles.pillText, { color: "#059669" }]}>Profile Complete</Text>
  //           </View>
  //         ) : (
  //           <View style={[styles.pill, styles.pillAmber]}>
  //             <Ionicons name="alert-circle-outline" size={12} color="#A16207" />
  //             <Text style={[styles.pillText, { color: "#A16207" }]}>
  //               {profileCompletion != null ? `${profileCompletion}% Complete` : "Profile Incomplete"}
  //             </Text>
  //           </View>
  //         )}
  //         {phone && (
  //           <View style={styles.chip}>
  //             <Ionicons name="call-outline" size={11} color="#64748b" />
  //             <Text style={styles.chipText}>{phone}</Text>
  //           </View>
  //         )}
  //       </View>

  //       {/* Row 2c: Email */}
  //       {email && (
  //         <View style={styles.badgeRow}>
  //           <View style={styles.chip}>
  //             <Ionicons name="mail-outline" size={11} color="#64748b" />
  //             <Text style={styles.chipText}>{email}</Text>
  //             {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />}
  //           </View>
  //         </View>
  //       )}

  //     </View>
  return (
  <View style={styles.card}>

    <View style={styles.headerRow}>

      {/* Left: Avatar + Name + Role + badges (web only) */}
      <View style={styles.headerLeft}>
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
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setShowImageMenu(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={13} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Name + Role + badges inline on web */}
        <View style={styles.nameBlock}>
          <Text style={[styles.name, isMobile && styles.nameMobile]}>{name}</Text>
          <Text style={styles.role}>{role}</Text>

          {/* ── Badges inline — web only ── */}
          {!isMobile && (
            <View style={[styles.badgeCol, { marginTop: 8 }]}>
              <View style={styles.badgeRow}>
                {speciality && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{speciality}</Text>
                  </View>
                )}
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
                    {/* {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />} */}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Edit Profile button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => setShowEditModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="pencil" size={isMobile ? 15 : 14} color="#fff" />
        {!isMobile && <Text style={styles.editBtnText}>Edit Profile</Text>}
      </TouchableOpacity>
    </View>

    {/* ── Badges below — mobile only ── */}
    {isMobile && (
      <View style={styles.badgeCol}>
        <View style={styles.badgeRow}>
          {speciality && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{speciality}</Text>
            </View>
          )}
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
        </View>
        <View style={styles.badgeRow}>
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
        </View>
        {email && (
          <View style={styles.badgeRow}>
            <View style={styles.chip}>
              <Ionicons name="mail-outline" size={11} color="#64748b" />
              <Text style={styles.chipText}>{email}</Text>
              {/* {isVerified && <Ionicons name="checkmark-circle" size={11} color="#22c55e" />} */}
            </View>
          </View>
        )}
      </View>
    )}

    {/* ... rest of modals unchanged ... */}

      {/* ════════════════════════════════════════
          PHOTO MENU MODAL
      ════════════════════════════════════════ */}
      <Modal visible={showImageMenu} transparent animationType="fade" onRequestClose={() => setShowImageMenu(false)}>
        <TouchableOpacity
          style={[styles.overlay, isDesktop && styles.overlayCentered]}
          activeOpacity={1}
          onPress={() => setShowImageMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={isDesktop ? styles.photoMenuDesktop : styles.photoMenuMobile}
            onPress={() => { }}
          >
            <View style={styles.photoMenuHeader}>
              <Text style={styles.menuTitle}>Profile Photo</Text>
              {isDesktop && (
                <TouchableOpacity onPress={() => setShowImageMenu(false)}>
                  <Ionicons name="close" size={20} color={COLORS.subText} />
                </TouchableOpacity>
              )}
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
              <View style={[styles.menuIcon, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Upload from Library</Text>
                <Text style={styles.menuSub}>Choose a photo from your gallery</Text>
              </View>
            </TouchableOpacity>
            {Platform.OS !== "web" && (
              <TouchableOpacity style={styles.menuItem} onPress={handleCamera} activeOpacity={0.75}>
                <View style={[styles.menuIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="camera-outline" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.menuLabel}>Take a Photo</Text>
                  <Text style={styles.menuSub}>Use your camera</Text>
                </View>
              </TouchableOpacity>
            )}
            {imageUri && (
              <TouchableOpacity style={styles.menuItem} onPress={handleRemove} activeOpacity={0.75}>
                <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </View>
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
          EDIT PROFILE MODAL
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
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={() => { setShowEditModal(false); setTimeout(() => setShowImageMenu(true), 300); }}
                >
                  <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editDivider} />

              {/* ── Two Column Layout ── */}
              <View style={[styles.twoCol, !isDesktop && styles.twoColMobile]}>

                {/* LEFT COLUMN */}
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

                  <Text style={styles.editLabel}>Phone Number</Text>
                  {renderReadOnly("call-outline", phone, "Not provided")}

                  <Text style={styles.editLabel}>Email</Text>
                  {renderReadOnly("mail-outline", email, "Not provided")}

                  <Text style={styles.editLabel}>Current Address <Text style={styles.optionalTag}>(optional)</Text></Text>
                  {renderInput("home-outline", editCurrentAddress, setEditCurrentAddress, "e.g. Akrudi Railway Station")}

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>City</Text>
                      {renderInput("business-outline", editCity, setEditCity, "e.g. Pune")}
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, zIndex: 20 }}>
                    <View style={{ flex: 1, zIndex: 20 }}>
                      <Text style={styles.editLabel}>
                        State <Text style={styles.optionalTag}>(optional)</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.editInputRow}
                        onPress={() => { setShowStateDropdown((v) => !v); setStateSearch(""); }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="map-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                        <Text style={[styles.editInput, { color: editState ? COLORS.text : "#adb8c9" }]}>
                          {editState || "Select state"}
                        </Text>
                        {editState ? (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); setEditState(""); setShowStateDropdown(false); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={15} color="#94a3b8" />
                          </TouchableOpacity>
                        ) : (
                          <Ionicons name={showStateDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
                        )}
                      </TouchableOpacity>
                      {showStateDropdown && (
                        <View style={styles.stateDropdown}>
                          <View style={styles.stateSearchRow}>
                            <TextInput
                              value={stateSearch}
                              onChangeText={setStateSearch}
                              placeholder="Search state..."
                              placeholderTextColor="#adb8c9"
                              style={styles.stateSearchInput}
                              autoFocus
                            />
                            {stateSearch.length > 0 && (
                              <TouchableOpacity onPress={() => setStateSearch("")}>
                                <Ionicons name="close" size={14} color="#94a3b8" />
                              </TouchableOpacity>
                            )}
                          </View>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                            {INDIAN_STATES
                              .filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
                              .map((s) => (
                                <TouchableOpacity
                                  key={s}
                                  style={[styles.stateItem, editState === s && styles.stateItemActive]}
                                  onPress={() => { setEditState(s); setShowStateDropdown(false); setStateSearch(""); }}
                                >
                                  <Text style={[styles.stateItemText, editState === s && styles.stateItemTextActive]}>{s}</Text>
                                  {editState === s && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
                                </TouchableOpacity>
                              ))
                            }
                            {INDIAN_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                              <View style={styles.stateNoResult}>
                                <Text style={styles.stateNoResultText}>No state found</Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.editLabel}>Pincode <Text style={styles.optionalTag}>(optional)</Text></Text>
                      {renderInput("pin-outline", editPincode, setEditPincode, "e.g. 411035", { keyboardType: "number-pad", maxLength: 6 })}
                    </View>
                  </View>

                  <Text style={styles.editLabel}>
                    Profile Summary <Text style={styles.optionalTag}>(optional)</Text>
                  </Text>
                  <View style={[styles.editInputRow, styles.textAreaRow]}>
                    {/* <Ionicons name="document-text-outline" size={16} color="#94a3b8" style={{ marginRight: 8, alignSelf: "flex-start", marginTop: 2 }} /> */}
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

                {/* RIGHT COLUMN */}
                <View style={styles.colRight}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.colSectionTitle}>
                      <Ionicons name="school-outline" size={13} color={COLORS.primary} /> Education
                      <Text style={styles.optionalTag}> (optional)</Text>
                    </Text>
                    <TouchableOpacity style={styles.addEduBtn} onPress={addEduEntry} activeOpacity={0.8}>
                      <Ionicons name="add" size={14} color={COLORS.primary} />
                      <Text style={styles.addEduBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {editEduList.map((edu, index) => (
                    <View key={index} style={styles.eduCard}>
                      <View style={styles.eduCardHeader}>
                        <Text style={styles.eduCardIndex}>#{index + 1}</Text>
                        {editEduList.length > 1 && (
                          <TouchableOpacity onPress={() => removeEduEntry(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="trash-outline" size={15} color="#DC2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.editLabel}>University / College</Text>
                      {renderInput("library-outline", edu.universityName, (v) => updateEdu(index, "universityName", v), "e.g. GMC Nagpur")}
                      <Text style={styles.editLabel}>Degree / Speciality</Text>
                      {renderInput("ribbon-outline", edu.speciality, (v) => updateEdu(index, "speciality", v), "e.g. MBBS, MS Surgery")}
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.editLabel}>Start Year</Text>
                          {renderInput("calendar-outline", edu.startYear, (v) => updateEdu(index, "startYear", v.replace(/\D/g, "")), "2018", { keyboardType: "number-pad", maxLength: 4 })}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.editLabel}>End Year</Text>
                          {renderInput("calendar-outline", edu.endYear, (v) => updateEdu(index, "endYear", v.replace(/\D/g, "")), "2024", { keyboardType: "number-pad", maxLength: 4 })}
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* ── Experience ── */}
                  <View style={[styles.editDivider, { marginTop: 16, marginBottom: 0 }]} />

                  <Text style={[styles.colSectionTitle, { marginTop: 14 }]}>
                    <Ionicons name="briefcase-outline" size={13} color={COLORS.primary} /> Experience
                  </Text>
                  <Text style={styles.editLabel}>Years of Experience</Text>
                  <TouchableOpacity
                    style={styles.editInputRow}
                    onPress={() => setShowExpDropdown((v) => !v)}
                    activeOpacity={0.8}
                  >
                    {/* <Ionicons name="time-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} /> */}
                    <Text style={[styles.editInput, { color: editExperience ? COLORS.text : "#adb8c9" }]}>
                      {editExperience || "Select experience"}
                    </Text>
                    {editExperience ? (
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); setEditExperience(""); setShowExpDropdown(false); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={15} color="#94a3b8" />
                      </TouchableOpacity>
                    ) : (
                      <Ionicons name={showExpDropdown ? "chevron-up" : "chevron-down"} size={15} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                  {showExpDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                        {EXPERIENCE_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[styles.dropdownItem, editExperience === option && styles.dropdownItemActive]}
                            onPress={() => { setEditExperience(option); setShowExpDropdown(false); }}
                          >
                            <Text style={[styles.dropdownItemText, editExperience === option && styles.dropdownItemTextActive]}>
                              {option}
                            </Text>
                            {editExperience === option && (
                              <Ionicons name="checkmark" size={13} color={COLORS.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={[styles.editDivider, { marginTop: 16, marginBottom: 0 }]} />

                  <Text style={[styles.colSectionTitle, { marginTop: 14 }]}>
                    <Ionicons name="flash-outline" size={13} color={COLORS.primary} /> Skills
                    <Text style={styles.optionalTag}> (optional)</Text>
                  </Text>
                  <Text style={styles.editLabel}>Add Skills</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <View style={[styles.editInputRow, { flex: 1, marginBottom: 0 }]}>
                      {/* <Ionicons name="add-circle-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} /> */}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },


  // ── ROW 1: static base (isMobile overrides applied inline) ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,   // space before badges row
  },

  // Avatar + NameBlock group (left side of row 1)
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    flex: 1,
  },

  // Name + role text block
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },

  // ── Avatar ──
  avatarWrap: { position: "relative" },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: COLORS.border,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.border },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#22C55E", borderWidth: 2, borderColor: COLORS.white,
  },
  cameraBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.white, zIndex: 10,
  },
  // 3. Add editBtnMobile to StyleSheet
  editBtnMobile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Name / Role ──
  name: { fontSize: 22, fontWeight: "700", color: COLORS.text, letterSpacing: -0.4 },
  nameMobile: { fontSize: 18 },
  role: { fontSize: 13, color: COLORS.subText, marginTop: 4 },

  // ── Edit button ──
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexShrink: 0,
  },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── ROW 2: Badges (always below row 1) ──
  badgeCol: { gap: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },

  badge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: "600" },
  pillGreen: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  pillAmber: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  pillRed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0",
  },
  chipText: { fontSize: 11, color: "#475569", fontWeight: "500" },

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  overlayCentered: { justifyContent: "center", alignItems: "center" },

  // State searchable dropdown
  stateDropdown: {
    position: "absolute", top: 80, left: 0, right: 0, zIndex: 999,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 8, overflow: "hidden",
    ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }, default: { elevation: 16 } }),
  },
  stateSearchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#f8fafc" },
  stateSearchInput: { flex: 1, fontSize: 13, color: COLORS.text, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  stateItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  stateItemActive: { backgroundColor: "#eff6ff" },
  stateItemText: { fontSize: 13, color: "#64748b" },
  stateItemTextActive: { color: COLORS.primary, fontWeight: "600" },
  stateNoResult: { paddingVertical: 14, alignItems: "center" },
  stateNoResultText: { fontSize: 13, color: "#94a3b8" },

  // Photo menu
  photoMenuDesktop: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: 360, ...Platform.select({ web: { boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }, default: { elevation: 20 } }) },
  photoMenuMobile: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, width: "100%" },
  photoMenuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center", flex: 1 },
  photoPreviewWrap: { alignItems: "center", marginBottom: 20 },
  photoPreview: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.border },
  photoPreviewPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.border },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  menuSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  menuCancel: { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  menuCancelText: { fontSize: 15, fontWeight: "600", color: COLORS.subText },

  // Edit modal
  editModal: { backgroundColor: COLORS.white, borderRadius: 18, padding: 22, width: 760, maxWidth: "96%", ...Platform.select({ web: { boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }, default: { elevation: 24 } }) },
  editModalMobile: { width: "96%", padding: 18 },
  editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  editModalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  editAvatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  editAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.border },
  changePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  changePhotoText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  editDivider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 4 },

  // Two column
  twoCol: { flexDirection: "row", gap: 20 },
  twoColMobile: { flexDirection: "column", gap: 0 },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },
  colSectionTitle: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 4, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },

  // Form elements
  editLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 10 },
  optionalTag: { color: "#94a3b8", fontSize: 11, fontWeight: "400" },
  editInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, height: 44 },
  editInput: { flex: 1, fontSize: 14, color: COLORS.text, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  textAreaRow: { height: "auto", minHeight: 76, alignItems: "flex-start", paddingVertical: 10 },
  textAreaInput: { minHeight: 56, paddingTop: 0 },

  // Read-only
  readOnlyRow: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  readOnlyText: { flex: 1, fontSize: 14, color: "#94a3b8" },
  readOnlyBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  readOnlyBadgeText: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },

  // Dropdown
  dropdownList: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginTop: 4, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }, default: { elevation: 8 } }) },
  dropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownItemActive: { backgroundColor: "#eff6ff" },
  dropdownItemText: { fontSize: 13, color: "#64748b" },
  dropdownItemTextActive: { color: COLORS.primary, fontWeight: "600" },

  // Education card
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 4 },
  addEduBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  addEduBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  eduCard: { backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", padding: 12, marginBottom: 10 },
  eduCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  eduCardIndex: { fontSize: 11, fontWeight: "700", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.4 },

  // Skills
  addSkillBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, height: 44, justifyContent: "center", alignItems: "center" },
  addSkillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  skillChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  skillChipText: { color: "#1d4ed8", fontSize: 12, fontWeight: "500" },

  // Action buttons
  editActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.white },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
  saveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.primary },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});