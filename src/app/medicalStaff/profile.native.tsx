import ProfileHeader from "@/component/cards/medicalStaff/Profile/ProfileHeader";
import ToggleSwitch from "@/component/common/ToggleSwitch";
import { COLORS } from "@/constant/colors";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { documentAPI, profileAPI } from "../../service/api";

// ── Toggle this off if you already render a global app header (Hospilink bar) ──
const SHOW_TOP_BAR = false;
const APP_VERSION = "1.0.0";

// ─── Role labels ──────────────────────────────────────────────────
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
const getRoleLabel = (value?: string | null) =>
  ROLES.find((r) => r.value === value)?.label ?? value ?? "—";

// ─── Document helpers ─────────────────────────────────────────────
const DOC_LABELS: Record<string, string> = {
  "aadhaar-card": "Aadhaar Card",
  "pan-card": "PAN Card",
  "mcim-certificate": "MCIM Certificate",
  "ncim-certificate": "NCIM Certificate",
  "license-permit": "License / Permit",
  "resume-experience": "Resume / Experience",
  "recommendation-letter": "Recommendation Letter",
};
const prettify = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type Tone = "green" | "amber" | "red";
const STATUS_TONE: Record<string, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "green" },
  "auto-verified": { label: "Verified", tone: "green" },
  "manual-pending-verification": { label: "In Review", tone: "amber" },
  pending: { label: "Pending", tone: "amber" },
  expired: { label: "Expired", tone: "red" },
  rejected: { label: "Rejected", tone: "red" },
};
const TONE_STYLES: Record<Tone, { bg: string; tx: string }> = {
  green: { bg: "#DCFCE7", tx: "#16A34A" },
  amber: { bg: "#FEF9C3", tx: "#CA8A04" },
  red: { bg: "#FEE2E2", tx: "#DC2626" },
};

interface DocRow {
  id: string;
  label: string;
  statusLabel: string;
  tone: Tone;
}

// ─── Misc helpers ─────────────────────────────────────────────────
const greetingForNow = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const initialsFrom = (name: string) => {
  const cleaned = name
    .split(" ")
    .filter((t) => t && !/^(dr|mr|mrs|ms|prof)\.?$/i.test(t));
  const parts = cleaned.length ? cleaned : name.split(" ").filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "U"
  );
};

const resolvePic = (pic: any): string | null => {
  if (!pic) return null;
  if (typeof pic === "string") return pic;
  if (pic.url) return pic.url;
  if (pic.s3Key) return pic.s3Key;
  return null;
};

const RADII = ["5 km", "10 km", "20 km", "50 km"];

// ─── Small UI building blocks ─────────────────────────────────────
function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Row({
  icon,
  label,
  onPress,
  right,
  isLast,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, !isLast && styles.rowDivider]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Ionicons name={icon} size={21} color={COLORS.text} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </Wrapper>
  );
}

const Chevron = () => (
  <Ionicons name="chevron-forward" size={18} color={COLORS.subText} />
);
const ValueText = ({ text }: { text: string }) => (
  <Text style={styles.valueText}>{text}</Text>
);
const StatusBadge = ({ label, tone }: { label: string; tone: Tone }) => (
  <View style={[styles.badge, { backgroundColor: TONE_STYLES[tone].bg }]}>
    <Text style={[styles.badgeText, { color: TONE_STYLES[tone].tx }]}>{label}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────
export default function Profile() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [apiUser, setApiUser] = useState<any>(null);
  const [apiProfile, setApiProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Availability
  const [available, setAvailable] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Documents
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // Local preferences (no backend in current code — local only for now)
  const [radiusIdx, setRadiusIdx] = useState(1); // "10 km"
  const [pushOn, setPushOn] = useState(true);

  // Edit modal trigger (lives inside the hidden ProfileHeader below)
  const openEditRef = useRef<() => void>(() => {});

  // ── Load profile ──
  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        setApiUser(res.user);
        setApiProfile(res.profile);
        setAvailable(!!res.profile?.isAvailable);
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load documents ──
  const fetchDocuments = useCallback(async () => {
    try {
      setDocsLoading(true);
      const data = await documentAPI.getDocuments();
      const list: any[] = Array.isArray(data?.documents) ? data.documents : [];
      setDocs(
        list.map((d) => {
          const meta = STATUS_TONE[d.verificationStatus] ?? {
            label: "Pending",
            tone: "amber" as Tone,
          };
          return {
            id: d.documentId ?? d._id ?? Math.random().toString(),
            label: DOC_LABELS[d.documentType] ?? prettify(d.documentType ?? "Document"),
            statusLabel: meta.label,
            tone: meta.tone,
          };
        })
      );
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── Availability toggle (same logic as AvailabilityCard) ──
  const handleToggleAvailability = async () => {
    const next = !available;
    setAvailable(next); // optimistic
    setToggling(true);
    try {
      await profileAPI.toggleMedicalStaffAvailability(next);
    } catch (err) {
      console.error("❌ Toggle failed:", err);
      setAvailable(!next); // revert
    } finally {
      setToggling(false);
    }
  };

  // ── Logout ──
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace({ pathname: "/auth/login", params: { tab: "signin" } });
        },
      },
    ]);
  };

  // ── Derived display values ──
  const displayName = apiProfile?.fullName ?? "Your Name";
  const roleLabel = getRoleLabel(apiProfile?.jobRole);
  const phone = apiProfile?.phoneNumber ?? null;
  const verificationStatus = apiProfile?.verificationStatus ?? "pending";
  const isVerified = verificationStatus === "verified";
  const avatarUri = resolvePic(apiProfile?.profilePicture);
  const initials = initialsFrom(displayName);
  const greeting = greetingForNow();

  const openEdit = () => openEditRef.current?.();

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Optional in-screen app bar (remove if you have a global one) ── */}
      {SHOW_TOP_BAR && (
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandLogo}>
              <Ionicons name="pulse" size={18} color="#fff" />
            </View>
            <Text style={styles.brandText}>Hospilink</Text>
          </View>
          <View style={styles.topBarRight}>
            <View style={styles.greetBlock}>
              <Text style={styles.greetSmall}>{greeting}</Text>
              <Text style={styles.greetName} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="sunny-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <View style={styles.topAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.topAvatarImg} />
              ) : (
                <Ionicons name="person" size={18} color="#94A3B8" />
              )}
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── Profile summary card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {roleLabel}
            </Text>
            {isVerified ? (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified Profile</Text>
              </View>
            ) : (
              <View style={styles.verifiedRow}>
                <Ionicons name="time-outline" size={15} color="#CA8A04" />
                <Text style={[styles.verifiedText, { color: "#CA8A04" }]}>
                  Verification Pending
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.editPencil} onPress={openEdit} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={20} color={COLORS.subText} />
          </TouchableOpacity>
        </View>

        {/* ── Availability card ── */}
        <View style={styles.availCard}>
          <View style={styles.availRing}>
            <View style={styles.availRingInner} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.availTitle}>
              {available ? "Available for Duties" : "Currently Offline"}
            </Text>
            <Text style={styles.availSub}>
              {available ? "Tap to go offline" : "Tap to go online"}
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <ToggleSwitch enabled={available} onToggle={handleToggleAvailability} />
          )}
        </View>

        {/* ── ACCOUNT SETTINGS ── */}
        <SectionTitle>ACCOUNT SETTINGS</SectionTitle>
        <View style={styles.group}>
          <Row icon="create-outline" label="Edit Profile" onPress={openEdit} right={<Chevron />} />
          <Row
            icon="call-outline"
            label="Phone Number"
            right={<ValueText text={phone ?? "Not added"} />}
          />
          <Row
            icon="medkit-outline"
            label="Specialty"
            right={<ValueText text={roleLabel} />}
            isLast
          />
        </View>

        {/* ── DOCUMENTS ── */}
        <SectionTitle>DOCUMENTS</SectionTitle>
        <View style={styles.group}>
          {docsLoading ? (
            <View style={styles.docLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            docs.map((d, i) => (
              <Row
                key={d.id}
                icon="document-text-outline"
                label={d.label}
                right={<StatusBadge label={d.statusLabel} tone={d.tone} />}
              />
            ))
          )}
          <Row
            icon="cloud-upload-outline"
            label="Upload New Document"
            onPress={() => router.push("/medicalStaff/document-manager")}
            right={<Chevron />}
            isLast
          />
        </View>

        {/* ── PREFERENCES ── */}
        <SectionTitle>PREFERENCES</SectionTitle>
        <View style={styles.group}>
          <Row
            icon="location-outline"
            label="Search Radius"
            onPress={() => setRadiusIdx((p) => (p + 1) % RADII.length)}
            right={<ValueText text={RADII[radiusIdx]} />}
          />
          <Row
            icon="notifications-outline"
            label="Push Notifications"
            right={<ToggleSwitch enabled={pushOn} onToggle={() => setPushOn((v) => !v)} />}
          />
          <Row
            icon="globe-outline"
            label="Language"
            right={<ValueText text="English" />}
            isLast
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionTitle>SUPPORT</SectionTitle>
        <View style={styles.group}>
          <Row
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => router.push("/auth/contact-us")}
            right={<Chevron />}
          />
          <Row
            icon="chatbubble-ellipses-outline"
            label="Contact Support"
            onPress={() => router.push("/auth/privacy-policy")}
            right={<Chevron />}
          />
          <Row
            icon="shield-checkmark-outline"
            label="Terms & Privacy"
            onPress={() => router.push("#")}
            right={<Chevron />}
            isLast
          />
        </View>

        {/* ── Log Out ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </ScrollView>

      {/* ──────────────────────────────────────────────────────────
          Hidden ProfileHeader — provides the working Edit Profile
          modal (name, role, address, education, skills, experience,
          photo upload). Height 0 hides its card; the modal still
          presents full-screen when triggered via openEditRef.
      ────────────────────────────────────────────────────────── */}
      <View style={styles.hiddenHost} pointerEvents="box-none">
        <ProfileHeader
          name={displayName}
          role={roleLabel}
          speciality={apiProfile?.education?.[0]?.speciality ?? ""}
          badges={[]}
          onEdit={() => {}}
          isMobile={isMobile}
          phone={phone}
          email={apiUser?.email ?? null}
          isVerified={apiUser?.isEmailVerified ?? false}
          isComplete={apiProfile?.isProfileComplete ?? false}
          profileCompletion={apiProfile?.profileCompletion ?? null}
          verificationStatus={verificationStatus}
          jobRoleValue={apiProfile?.jobRole ?? null}
          city={apiProfile?.city ?? ""}
          currentAddress={apiProfile?.currentAddress ?? ""}
          state={apiProfile?.state ?? ""}
          pincode={apiProfile?.pincode ?? ""}
          profilePicture={apiProfile?.profilePicture ?? null}
          profileSummary={apiProfile?.profileSummary ?? ""}
          education={Array.isArray(apiProfile?.education) ? apiProfile.education : []}
          skills={Array.isArray(apiProfile?.skills) ? apiProfile.skills : []}
          experience={apiProfile?.experience ?? null}
          onProfileUpdated={(updated: any) =>
            setApiProfile((prev: any) => ({ ...(prev || {}), ...updated }))
          }
          onOpenEditModal={(fn: () => void) => {
            openEditRef.current = fn;
          }}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },

  // Top app bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greetBlock: { alignItems: "flex-end", maxWidth: 130 },
  greetSmall: { fontSize: 10, color: COLORS.subText },
  greetName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  iconBtn: { padding: 4 },
  bellDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  topAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topAvatarImg: { width: 32, height: 32, borderRadius: 16 },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
    marginTop: 12,
    marginBottom: 16,
  },

  // Profile summary card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrap: { position: "relative", marginRight: 16 },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 22, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 19, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  profileRole: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  verifiedText: { fontSize: 13, fontWeight: "700", color: "#16A34A" },
  editPencil: { padding: 6 },

  // Availability card
  availCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  availRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  availRingInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#22C55E" },
  availTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  availSub: { fontSize: 13, color: COLORS.subText, marginTop: 2 },

  // Sections / groups
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.subText,
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 56,
    paddingVertical: 12,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon: { marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text },
  rowRight: { flexDirection: "row", alignItems: "center" },
  valueText: { fontSize: 14, color: COLORS.subText, fontWeight: "500" },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  docLoading: {
    paddingVertical: 22,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 16,
  },

  // Hidden host for the reused edit modal
  hiddenHost: { height: 0, overflow: "hidden" },
});