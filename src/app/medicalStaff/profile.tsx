import AvailabilityCard from "@/component/cards/medicalStaff/Profile/AvailabilityCard";
import EducationCard from "@/component/cards/medicalStaff/Profile/EducationCard";
import LicensesCard from "@/component/cards/medicalStaff/Profile/LicensesCard";
import ProfessionalSummary from "@/component/cards/medicalStaff/Profile/ProfessionalSummary";
import ProfileHeader from "@/component/cards/medicalStaff/Profile/ProfileHeader";
import ProfileStatCard from "@/component/cards/medicalStaff/Profile/ProfileStatCard";
import SkillsCard from "@/component/cards/medicalStaff/Profile/SkillsCard";
import { COLORS } from "@/constant/colors";
import { profileData } from "@/data/profile";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { profileAPI } from "../../service/api";

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

const getRoleLabel = (value: string) =>
  ROLES.find((r) => r.value === value)?.label ?? value;

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export default function Profile() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const openEditModalRef = useRef<() => void>(() => {});

  // ── API state
  const [apiUser,    setApiUser]    = useState<any>(null);
  const [apiProfile, setApiProfile] = useState<any>(null);
  const [loading,    setLoading]    = useState(true);

  // ── Static fallbacks (only for licenses and stat card icons/labels/colors)
  const { stats: staticStats, licenses } = profileData;

  // ────────────────────────────────────────────────────────────
  // GET /api/profile/me
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        setApiUser(res.user);
        setApiProfile(res.profile);
        console.log("✅ Loaded profile:", res);
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Stats — override static card values with live API data
  const stats = staticStats.map((s) => {
    if (!apiProfile) return s;
    if (s.label === "Profile Completion")
      return {
        ...s,
        value: `${apiProfile.profileCompletion ?? 0}%`,
        progress: (apiProfile.profileCompletion ?? 0) / 100,
      };
    if (s.label === "Active Applications")
      return { ...s, value: String(apiProfile.activeApplications ?? 0) };
    if (s.label === "Verified Docs")
      return { ...s, value: String(apiProfile.verifiedDocs ?? 0) };
    if (s.label === "Total Experience")
      return { ...s, value: `${apiProfile.experience ?? 0}` };
    return s;
  });

  const statsRow1 = stats.slice(0, 2);
  const statsRow2 = stats.slice(2, 4);

  // ── Derived display values — always from API when available
  const displayName          = apiProfile?.fullName          ?? profileData.name;
  const displayRole          = apiProfile?.jobRole           ? getRoleLabel(apiProfile.jobRole) : profileData.role;
  const displayAvail         = apiProfile?.isAvailable       ?? profileData.availability;
  const displaySince         = apiProfile?.createdAt         ? formatDate(apiProfile.createdAt) : profileData.memberSince;
  const displayLocation      = apiProfile               ? `${apiProfile.currentAddress}, ${apiProfile.city}` : profileData.location;
  const displayPhone         = apiProfile?.phoneNumber       ?? null;
  const displayEmail         = apiUser?.email                ?? null;
  const isVerified           = apiUser?.isEmailVerified      ?? false;
  const isComplete           = apiProfile?.isProfileComplete ?? false;
  const displayCity          = apiProfile?.city              ?? "";
  const displayState = apiProfile?.state ?? "";
  const diaplayPincode = apiProfile?.pincode ?? "";
  const displaycurrentAddress          = apiProfile?.currentAddress    ?? "";
  const displayJobRoleValue  = apiProfile?.jobRole           ?? null;
  const displayProfilePicture = apiProfile?.profilePicture   ?? null;

  // ── FIX: profileSummary is a STRING not an array
  const displaySummary = apiProfile?.profileSummary ?? "";

  // ── FIX: education and skills - use API arrays, fall back to empty
  const displayEducation = Array.isArray(apiProfile?.education) ? apiProfile.education : [];
  const displaySpeciality = apiProfile?.education?.[0]?.speciality ?? "";
  const displaySkills    = Array.isArray(apiProfile?.skills)    ? apiProfile.skills    : [];

  // ── FIX: verificationStatus — derive from documents OR profile field
  // The API response has verificationStatus at profile level in some calls
  // For the GET /me response it might not be present — use "pending" as safe default
  const verificationStatus = apiProfile?.verificationStatus ?? "pending";

  // ── Loading screen
  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        name={displayName}
        role={displayRole}
        speciality={displaySpeciality}
        badges={profileData.badges}
        onEdit={() => {}}
        isMobile={isMobile}
        phone={displayPhone}
        email={displayEmail}
        isVerified={isVerified}
        isComplete={isComplete}
        profileCompletion={apiProfile?.profileCompletion ?? null}
        verificationStatus={verificationStatus}
        jobRoleValue={displayJobRoleValue}
        city={displayCity}
        currentAddress={displaycurrentAddress} 
        state={displayState}
        pincode={diaplayPincode}                 
        profilePicture={displayProfilePicture}
        // ── Pass live data to edit modal
        profileSummary={displaySummary}
        education={displayEducation}
        skills={displaySkills}
        experience={apiProfile?.experience ?? null}
        onProfileUpdated={(updated) => {
          setApiProfile((prev: any) => ({ ...(prev || {}), ...updated }));
        }}
        onOpenEditModal={(fn) => { openEditModalRef.current = fn; }}
      />

      {/* ── Stats: desktop = 1 row of 4 | mobile = 2 rows of 2 ── */}
      {isMobile ? (
        <View style={styles.statsMobileGrid}>
          <View style={styles.statsMobileRow}>
            {statsRow1.map((s) => (
              <ProfileStatCard
                key={s.id}
                icon={s.icon}
                iconBg={s.iconBg}
                iconColor={s.iconColor}
                value={s.value}
                label={s.label}
                progress={s.progress}
                isMobile
              />
            ))}
          </View>
          <View style={styles.statsMobileRow}>
            {statsRow2.map((s) => (
              <ProfileStatCard
                key={s.id}
                icon={s.icon}
                iconBg={s.iconBg}
                iconColor={s.iconColor}
                value={s.value}
                label={s.label}
                progress={s.progress}
                isMobile
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <ProfileStatCard
              key={s.id}
              icon={s.icon}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              value={s.value}
              label={s.label}
              progress={s.progress}
            />
          ))}
        </View>
      )}

      {/* ── Two Column Layout ── */}
      <View style={[styles.mainRow, isMobile && styles.mainRowMobile]}>
        <View style={styles.leftCol}>
          {/* FIX: pass string not array to ProfessionalSummary */}
          <ProfessionalSummary summary={displaySummary} onEdit={() => {}} />
          {/* FIX: pass live education array */}
          <EducationCard items={displayEducation} onAdd={() => {}} />
          <LicensesCard items={licenses} onManage={() => {}} />
        </View>
        <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
          <AvailabilityCard
            available={displayAvail}
            memberSince={displaySince}
            location={displayLocation}
          />
          {/* FIX: pass live skills array */}
          <SkillsCard skills={displaySkills} />
        </View>
      </View>

      {/* ── Bottom Action Cards ── */}
      <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
        <ProfileActionCard
          icon="pencil-outline"
          iconBg="#EEF2FF"
          iconColor={COLORS.primary}
          label="Edit Profile"
          onPress={() => openEditModalRef.current()}
        />
        <ProfileActionCard
          icon="shield-checkmark-outline"
          iconBg="#D1FAE5"
          iconColor="#059669"
          label="Account Secured"
        />
        <ProfileActionCard
          icon="person-add-outline"
          iconBg="#FEF3C7"
          iconColor="#D97706"
          label="Manage Documents"
          onPress={() => router.push("/medicalStaff/document-manager")}
        />
      </View>
    </ScrollView>
  );
}

function ProfileActionCard({ icon, iconBg, iconColor, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loaderScreen:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  container:       { flex: 1, backgroundColor: COLORS.background },
  content:         { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile:   { padding: 16, gap: 14 },
  statsRow:        { flexDirection: "row", gap: 14 },
  statsMobileGrid: { gap: 12 },
  statsMobileRow:  { flexDirection: "row", gap: 12 },
  mainRow:         { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  mainRowMobile:   { flexDirection: "column" },
  leftCol:         { flex: 1, gap: 16 },
  rightCol:        { width: 260, gap: 16, flexShrink: 0 },
  rightColMobile:  { width: "100%" },
  actionsRow:      { flexDirection: "row", gap: 14 },
  actionsRowMobile:{ flexWrap: "wrap" },
  actionCard:      {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconWrap:  { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  actionLabel:     { fontSize: 14, fontWeight: "700", color: COLORS.text, textAlign: "center" },
});