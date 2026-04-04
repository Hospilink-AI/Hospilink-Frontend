import AvailabilityCard from "@/component/cards/medicalStaff/Profile/AvailabilityCard";
import EducationCard from "@/component/cards/medicalStaff/Profile/EducationCard";
import LicensesCard from "@/component/cards/medicalStaff/Profile/LicensesCard";
import ProfessionalSummary from "@/component/cards/medicalStaff/Profile/ProfessionalSummary";
import ProfileHeader from "@/component/cards/medicalStaff/Profile/ProfileHeader";
import ProfileStatCard from "@/component/cards/medicalStaff/Profile/ProfileStatCard";
import SkillsCard from "@/component/cards/medicalStaff/Profile/SkillsCard";
import { COLORS } from "@/constant/colors";
import { profileData } from "@/data/profile"; // ← still used for static fields
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

// ── Role lookup
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

// ────────────────────────────────────────────────────────────
export default function Profile() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // ── API state
  const [apiUser, setApiUser] = useState<any>(null);
  const [apiProfile, setApiProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 const { stats: staticStats, summary: staticSummary, education: staticEducation, licenses, skills: staticSkills } = profileData;

const summary = apiProfile?.profileSummary || [];
const education = apiProfile?.education?.length ? apiProfile.education : [];
const skills = apiProfile?.skills?.length ? apiProfile.skills : []; 

// Override stat values with live API data if available
const stats = staticStats.map((s) => {
  if (!apiProfile) return s;
  if (s.label === "Profile Completion")
    return { ...s, value: `${apiProfile.profileCompletion}%`, progress: apiProfile.profileCompletion / 100 };
  if (s.label === "Active Applications")
    return { ...s, value: String(apiProfile.activeApplications) };
  if (s.label === "Verified Docs")
    return { ...s, value: String(apiProfile.verifiedDocs) };
  if (s.label === "Total Experience")
    return { ...s, value: `${apiProfile.totalExperience} yrs` };
  return s;
});

const statsRow1 = stats.slice(0, 2);
const statsRow2 = stats.slice(2, 4);

  // ────────────────────────────────────────────────────────────
  // GET /api/profile/me
  // res = { success, user, profile, hasProfile }
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
        // Fall through — UI will render with static data
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived display values
  // If API loaded → use API data, else fall back to static profileData
  const displayName = apiProfile?.fullName ?? profileData.name;
  const displayRole = apiProfile?.jobRole
    ? getRoleLabel(apiProfile.jobRole)
    : profileData.role;
  const displayAvail = apiProfile?.isAvailable ?? profileData.availability;
  const displaySince = apiProfile?.createdAt
    ? formatDate(apiProfile.createdAt)
    : profileData.memberSince;
  const displayLocation = apiProfile
    ? `${apiProfile.area}, ${apiProfile.city}`
    : profileData.location;

  // ── Additional details from API not in static data
  const displayPhone = apiProfile?.phoneNumber ?? null;
  const displayEmail = apiUser?.email ?? null;
  const isVerified = apiUser?.isEmailVerified ?? false;
  const isComplete = apiProfile?.isProfileComplete ?? false;

  // ── ADD THESE THREE HERE ──
  const displayCity = apiProfile?.city ?? "";
  const displayArea = apiProfile?.area ?? "";
  const displayJobRoleValue = apiProfile?.jobRole ?? null;

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
      {/* ── Profile Header — dynamic name, role, badges ── */}
      {/* <ProfileHeader
        name={displayName}
        role={displayRole}
        badges={profileData.badges}        // static
        onEdit={() => {}}
        isMobile={isMobile}
      /> */}

      {/* <ProfileHeader
        name={displayName}
        role={displayRole}
        badges={profileData.badges}
        onEdit={() => { }}
        isMobile={isMobile}
        phone={displayPhone}          // ← new
        email={displayEmail}          // ← new
        isVerified={isVerified}       // ← new
        isComplete={isComplete}       // ← new
      /> */}



      {/*  ── Update ProfileHeader call */}
      <ProfileHeader
        name={displayName}
        role={displayRole}
        badges={profileData.badges}
        onEdit={() => { }}
        isMobile={isMobile}
        phone={displayPhone}
        email={displayEmail}
        isVerified={isVerified}
        isComplete={isComplete}
        jobRoleValue={displayJobRoleValue}   
        city={displayCity}                  
        area={displayArea}                   
        onProfileUpdated={(updated) => {     
          setApiProfile(updated);
        }}
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
          {/* static */}
          <ProfessionalSummary summary={summary} onEdit={() => { }} />
          <EducationCard items={education} onAdd={() => { }} />
          <LicensesCard items={licenses} onManage={() => { }} />
        </View>
        <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
          {/* dynamic — availability, memberSince, location from API */}
          <AvailabilityCard
            available={displayAvail}
            memberSince={displaySince}
            location={displayLocation}
          />
          {/* static */}
          <SkillsCard skills={skills} />
        </View>
      </View>

      {/* ── Bottom Action Cards — static ── */}
      <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
        <ProfileActionCard
          icon="pencil-outline"
          iconBg="#EEF2FF"
          iconColor={COLORS.primary}
          label="Edit Profile"
        />
        <ProfileActionCard
          icon="shield-checkmark-outline"
          iconBg="#D1FAE5"
          iconColor="#059669"
          label="Account Security"
        />
        <ProfileActionCard
          icon="person-add-outline"
          iconBg="#FEF3C7"
          iconColor="#D97706"
          label="Manage Documents"
        />
      </View>
    </ScrollView>
  );
}

function ProfileActionCard({ icon, iconBg, iconColor, label }: any) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loaderScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile: { padding: 16, gap: 14 },

  // Desktop stats
  statsRow: { flexDirection: "row", gap: 14 },

  // Mobile stats — 2 explicit rows of 2
  statsMobileGrid: { gap: 12 },
  statsMobileRow: { flexDirection: "row", gap: 12 },

  // Two column
  mainRow: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  mainRowMobile: { flexDirection: "column" },
  leftCol: { flex: 1, gap: 16 },
  rightCol: { width: 260, gap: 16, flexShrink: 0 },
  rightColMobile: { width: "100%" },

  // Action cards
  actionsRow: { flexDirection: "row", gap: 14 },
  actionsRowMobile: { flexWrap: "wrap" },
  actionCard: {
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
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: { fontSize: 14, fontWeight: "700", color: COLORS.text, textAlign: "center" },
});