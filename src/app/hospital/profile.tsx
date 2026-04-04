import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { profileAPI, documentAPI } from "../../service/api";
import { Image, Dimensions, useWindowDimensions } from "react-native";

// ─── Theme ────────────────────────────────────────────────────────────────────
const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_LIGHT = "#FFF7ED";
const ORANGE_BORDER = "#FDBA74";
const BLUE = "#3B82F6";
const BORDER = "#E5E7EB";
const BG = "#F8FAFC";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const WHITE = "#FFFFFF";
const RED_BG = "#FEE2E2";
const RED_TEXT = "#DC2626";

// ─── Types ────────────────────────────────────────────────────────────────────
type CredStatus = "Verified" | "Expiring Soon" | "Expired" | "Pending";

type Credential = {
  id: string;
  name: string;
  status: CredStatus;
  updated: string;
  fileName?: string;
  fileSize?: string;
  fileUri?: string;
  url?: string;
  documentType?: string;
};

const HOSPITAL_DOC_TYPES = [
  { label: "Aadhaar Card", value: "aadhaar-card" },
  { label: "PAN Card", value: "pan-card" },
  { label: "Registration Certificate", value: "registration-certificate" },
  { label: "CIN Certificate", value: "cin-certificate" },
  { label: "GST Certificate", value: "gst-certificate" },
];

type PickedFile = {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
};

type ProfileData = {
  userEmail: string;
  userName: string;
  isEmailVerified: boolean;
  hospitalLegalName: string;
  currentAddress: string;
  location: string;
  servicesAvailable: string[];
  staffCount: string;
  isProfileComplete: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (mime?: string): string => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word") || mime.includes("doc")) return "📘";
  if (mime.includes("sheet") || mime.includes("excel")) return "📗";
  if (mime.includes("image")) return "🖼️";
  return "📄";
};

function mapVerificationStatus(status: string): CredStatus {
  switch (status) {
    case "verified":
      return "Verified";
    case "manual-pending-verification":
    case "pending":
      return "Pending";
    case "expiring-soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

// ─── Fixed: uses documentId, uploadedAt, fileName, url from GET response ──────
function mapAPIDocument(doc: any): Credential {
  const displayName =
    doc.documentType
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) ??
    doc.fileName ??
    "Document";

  return {
    id: doc.documentId ?? doc._id ?? Date.now().toString(),
    name: displayName,
    status: mapVerificationStatus(doc.verificationStatus),
    updated: new Date(doc.uploadedAt ?? doc.updatedAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "2-digit", year: "numeric" }
    ),
    fileName: doc.fileName ?? undefined,
    url: doc.url ?? undefined,
    documentType: doc.documentType,
  };
}

function mapAPIToProfile(data: any): ProfileData {
  return {
    userEmail: data?.user?.email ?? "",
    userName: data?.user?.name ?? "",
    isEmailVerified: data?.user?.isEmailVerified ?? false,
    hospitalLegalName: data?.profile?.hospitalLegalName ?? "",
    currentAddress: data?.profile?.currentAddress ?? "",
    location: data?.profile?.location ?? "",
    servicesAvailable: Array.isArray(data?.profile?.servicesAvailable)
      ? data.profile.servicesAvailable
      : [],
    staffCount: data?.profile?.staffCount ?? "",
    isProfileComplete: data?.profile?.isProfileComplete ?? false,
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: CredStatus }) => {
  const cfg: Record<CredStatus, { bg: string; text: string; dot: string }> = {
    Verified: { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
    "Expiring Soon": { bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" },
    Expired: { bg: RED_BG, text: RED_TEXT, dot: "#EF4444" },
    Pending: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  };
  const c = cfg[status];
  return (
    <View style={[bSt.wrap, { backgroundColor: c.bg }]}>
      <View style={[bSt.dot, { backgroundColor: c.dot }]} />
      <Text style={[bSt.text, { color: c.text }]}>{status}</Text>
    </View>
  );
};
const bSt = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
    gap: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "600" },
});

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({
  icon,
  title,
  children,
  headerRight,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) => (
  <View style={cSt.card}>
    <View style={cSt.hdr}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }}
      >
        <View style={cSt.iconWrap}>
          <Text style={{ fontSize: 13 }}>{icon}</Text>
        </View>
        <Text style={cSt.title}>{title}</Text>
      </View>
      {headerRight}
    </View>
    <View style={cSt.divider} />
    {children}
  </View>
);
const cSt = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hdr: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  divider: { height: 1, backgroundColor: BORDER, marginBottom: 14 },
});

// ─── Info Fields ──────────────────────────────────────────────────────────────
const InfoField = ({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string;
  prefix?: string;
}) => (
  <View style={vMSt.group}>
    <Text style={vMSt.label}>{label}</Text>
    <View style={vMSt.box}>
      {prefix ? (
        <View style={vMSt.prefixRow}>
          <View style={vMSt.prefixBox}>
            <Text style={vMSt.prefixTxt}>{prefix}</Text>
          </View>
          <Text style={vMSt.valueWithPrefix} numberOfLines={1}>
            {value || "—"}
          </Text>
        </View>
      ) : (
        <Text style={vMSt.value} numberOfLines={2}>
          {value || "—"}
        </Text>
      )}
    </View>
  </View>
);

const InfoFieldFull = ({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string;
  prefix?: string;
}) => (
  <View style={vMSt.groupFull}>
    <Text style={vMSt.label}>{label}</Text>
    <View style={vMSt.box}>
      {prefix ? (
        <View style={vMSt.prefixRow}>
          <View style={vMSt.prefixBox}>
            <Text style={vMSt.prefixTxt}>{prefix}</Text>
          </View>
          <Text style={vMSt.valueWithPrefix} numberOfLines={1}>
            {value || "—"}
          </Text>
        </View>
      ) : (
        <Text style={vMSt.value} numberOfLines={3}>
          {value || "—"}
        </Text>
      )}
    </View>
  </View>
);

const InfoRow = InfoField;
const InfoRowFull = InfoFieldFull;

const vMSt = StyleSheet.create({
  group: { flex: 1, marginBottom: 14 },
  groupFull: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  box: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: WHITE,
    minHeight: 42,
    justifyContent: "center",
    overflow: "hidden",
  },
  value: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    lineHeight: 20,
  },
  prefixRow: { flexDirection: "row", alignItems: "center", minHeight: 42 },
  prefixBox: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  prefixTxt: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "500" },
  valueWithPrefix: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

// ─── Department Tags – view mode ──────────────────────────────────────────────
const DepartmentTagsView = ({ departments }: { departments: string[] }) => (
  <View style={vMSt.groupFull}>
    <Text style={vMSt.label}>Departments &amp; Services</Text>
    {departments.length === 0 ? (
      <Text style={{ fontSize: 13.5, color: TEXT_SECONDARY, fontStyle: "italic" }}>
        No departments added.
      </Text>
    ) : (
      <View style={tvSt.tagsWrap}>
        {departments.map((dept) => (
          <View key={dept} style={tvSt.tag}>
            <Text style={tvSt.tagTxt}>{dept}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
const tvSt = StyleSheet.create({
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  tag: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tagTxt: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },
});

// ─── Labeled Input ────────────────────────────────────────────────────────────
const LabeledInput = ({
  label,
  value,
  onChangeText,
  half,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  half?: boolean;
  placeholder?: string;
}) => (
  <View style={[iSt.group, half && iSt.half]}>
    <Text style={iSt.label}>{label}</Text>
    <TextInput
      style={iSt.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);
const iSt = StyleSheet.create({
  group: { marginBottom: 12, flex: 1 },
  half: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    backgroundColor: WHITE,
    minHeight: 42,
  },
});

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const STAFF_OPTIONS = ["2-10", "11-50", "51-100", "100+"];

const Dropdown = ({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={[iSt.group, iSt.half, { zIndex: 10 }]}>
      <Text style={iSt.label}>{label}</Text>
      <TouchableOpacity style={dSt.btn} onPress={() => setOpen(!open)}>
        <Text style={dSt.val}>{value || "Select"}</Text>
        <Text style={dSt.chev}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={dSt.menu}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={dSt.item}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  dSt.itemTxt,
                  opt === value && { color: BLUE, fontWeight: "700" },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
const dSt = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHITE,
    minHeight: 42,
  },
  val: { fontSize: 13.5, color: TEXT_PRIMARY },
  chev: { fontSize: 10, color: TEXT_SECONDARY },
  menu: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemTxt: { fontSize: 13.5, color: TEXT_PRIMARY },
});

// ─── Clinical Services ────────────────────────────────────────────────────────
const ALL_SERVICES = [
  "Emergency Care",
  "General Surgery",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Internal Medicine",
  "Radiology",
  "Laboratory Services",
  "Pharmacy",
  "Physical Therapy",
  "Mental Health",
  "Oncology",
  "Dermatology",
  "Ophthalmology",
  "ENT (Ear, Nose, Throat)",
  "Urology",
  "Gastroenterology",
  "Pulmonology",
];

// ─── Department Tags – edit mode ──────────────────────────────────────────────
const DepartmentTags = ({
  departments,
  setDepartments,
}: {
  departments: string[];
  setDepartments: (d: string[]) => void;
}) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const toggle = (service: string) => {
    if (departments.includes(service)) {
      setDepartments(departments.filter((x) => x !== service));
    } else {
      setDepartments([...departments, service]);
    }
  };

  return (
    <View style={tSt.wrapper}>
      <Text style={iSt.label}>Available Clinical Services</Text>
      <View style={tSt.tagsArea}>
        {departments.length === 0 && (
          <Text style={tSt.emptyHint}>No services selected yet.</Text>
        )}
        {departments.map((dept) => (
          <View key={dept} style={tSt.tag}>
            <Text style={tSt.tagTxt}>{dept}</Text>
            <TouchableOpacity
              onPress={() => toggle(dept)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={tSt.tagClose}
            >
              <Text style={tSt.tagCloseTxt}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={tSt.addBtn}
          onPress={() => setPanelOpen(!panelOpen)}
          activeOpacity={0.8}
        >
          <Text style={tSt.addBtnTxt}>+ Add Service</Text>
        </TouchableOpacity>
      </View>
      {panelOpen && (
        <View style={tSt.panel}>
          <View style={tSt.panelHeader}>
            <Text style={tSt.panelTitle}>SELECT SERVICES</Text>
            <TouchableOpacity
              onPress={() => setPanelOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={tSt.panelClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {ALL_SERVICES.map((service, idx) => {
            const selected = departments.includes(service);
            const isLast = idx === ALL_SERVICES.length - 1;
            return (
              <TouchableOpacity
                key={service}
                style={[tSt.serviceRow, isLast && { borderBottomWidth: 0 }]}
                onPress={() => toggle(service)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    tSt.serviceName,
                    selected && tSt.serviceNameSelected,
                  ]}
                >
                  {service}
                </Text>
                <View
                  style={[
                    tSt.checkCircle,
                    selected && tSt.checkCircleSelected,
                  ]}
                >
                  {selected ? (
                    <Text style={tSt.checkMark}>✓</Text>
                  ) : (
                    <Text style={tSt.plusMark}>＋</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <Text style={tSt.hint}>
        Select all specialized departments active in your facility.
      </Text>
    </View>
  );
};

const SVC_BLUE = "#2563EB";

const tSt = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  tagsArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#F8FAFF",
    minHeight: 60,
    alignItems: "center",
    marginBottom: 8,
  },
  emptyHint: { fontSize: 12.5, color: "#9CA3AF", fontStyle: "italic" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SVC_BLUE,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagTxt: { fontSize: 13, color: WHITE, fontWeight: "700" },
  tagClose: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tagCloseTxt: {
    fontSize: 16,
    color: WHITE,
    fontWeight: "400",
    lineHeight: 18,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: WHITE,
  },
  addBtnTxt: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "600" },
  panel: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: WHITE,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#F8FAFF",
  },
  panelTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: TEXT_PRIMARY,
    letterSpacing: 1.2,
  },
  panelClose: { fontSize: 15, color: TEXT_SECONDARY, fontWeight: "400" },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  serviceName: { fontSize: 14, color: TEXT_SECONDARY, flex: 1, marginRight: 12 },
  serviceNameSelected: { color: SVC_BLUE, fontWeight: "700" },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },
  checkCircleSelected: { backgroundColor: SVC_BLUE, borderColor: SVC_BLUE },
  checkMark: { fontSize: 13, color: WHITE, fontWeight: "800" },
  plusMark: { fontSize: 14, color: "#CBD5E1", lineHeight: 16 },
  hint: { fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginTop: 2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  UPLOAD DOCUMENT MODAL  — only docType + file, no docName
// ═══════════════════════════════════════════════════════════════════════════════
const UploadDocModal = ({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (c: Credential) => void;
}) => {
  // ✅ No docName state — API only needs documentType + file
  const [docType, setDocType] = useState("");
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "image/*",
          // "application/pdf",
          // "application/msword",
          // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          // "text/plain",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setPickedFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
      }
    } catch {
      Alert.alert("Error", "Could not open file picker. Please try again.");
    }
  };

  const handleSave = async () => {
    // ✅ Only validate docType + file
    if (!docType.trim()) {
      Alert.alert("Required", "Please select a document type.");
      return;
    }
    if (!pickedFile) {
      Alert.alert("Required", "Please select a document to upload.");
      return;
    }

    try {
      setUploading(true);
      const response = await documentAPI.uploadDocument(
        docType,
        pickedFile.uri,
        pickedFile.mimeType
      );

      // ✅ Map from API response if available, else build fallback
      const uploadedDoc =
        response?.document
          ? mapAPIDocument(response.document)
          : response?.documents?.[0]
            ? mapAPIDocument(response.documents[0])
            : {
              id: Date.now().toString(),
              name: docType
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c: string) => c.toUpperCase()),
              status: "Pending" as CredStatus,
              updated: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              fileName: pickedFile.name,
              fileSize: pickedFile.size
                ? formatBytes(pickedFile.size)
                : undefined,
              documentType: docType,
            };

      onAdd(uploadedDoc);
      reset();
    } catch (err: any) {
      Alert.alert(
        "Upload Failed",
        err?.message ?? "Could not upload document. Try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setDocType("");
    setPickedFile(null);
    setUploading(false);
    onClose();
  };

  const sheetContent = (
    <View style={uSt.sheet}>
      <View style={uSt.handle} />
      <View style={uSt.header}>
        <Text style={uSt.title}>Upload Document</Text>
        <TouchableOpacity onPress={reset} style={uSt.closeIcon}>
          <Text style={{ fontSize: 15, color: TEXT_SECONDARY }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Document Name input removed — not needed by API */}

        <Text style={uSt.label}>
          Document Type <Text style={{ color: BLUE }}>*</Text>
        </Text>
        <View style={uSt.pickerWrap}>
          {HOSPITAL_DOC_TYPES.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                uSt.pickerOption,
                docType === opt.value && uSt.pickerOptionActive,
              ]}
              onPress={() => setDocType(opt.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  uSt.pickerOptionText,
                  docType === opt.value && uSt.pickerOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
              {docType === opt.value && (
                <Text style={{ color: BLUE }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={uSt.label}>
          Upload Document <Text style={{ color: BLUE }}>*</Text>
        </Text>
        {pickedFile ? (
          <View style={uSt.fileCard}>
            <View style={uSt.fileCardLeft}>
              <Text style={{ fontSize: 28 }}>
                {fileIcon(pickedFile.mimeType)}
              </Text>
              <View style={uSt.fileCardInfo}>
                <Text style={uSt.fileName} numberOfLines={1}>
                  {pickedFile.name}
                </Text>
                {pickedFile.size !== undefined && (
                  <Text style={uSt.fileSize}>
                    {formatBytes(pickedFile.size)}
                  </Text>
                )}
                <Text style={uSt.fileReady}>✓ Ready to upload</Text>
              </View>
            </View>
            <View style={uSt.fileCardActions}>
              <TouchableOpacity
                onPress={handlePickFile}
                style={uSt.changeBtn}
              >
                <Text style={uSt.changeTxt}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickedFile(null)}
                style={uSt.removeBtn}
              >
                <Text style={uSt.removeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={uSt.uploadZone}
            onPress={handlePickFile}
            activeOpacity={0.75}
          >
            <View style={uSt.uploadIconCircle}>
              <Text style={{ fontSize: 26 }}>☁️</Text>
            </View>
            <Text style={uSt.uploadPrimary}>Tap to upload file</Text>
            <Text style={uSt.uploadSecondary}>
              PDF, DOC, DOCX, Images supported
            </Text>
          </TouchableOpacity>
        )}

        <View style={uSt.footer}>
          <TouchableOpacity
            style={uSt.cancelBtn}
            onPress={reset}
            disabled={uploading}
          >
            <Text style={uSt.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[uSt.saveBtn, uploading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ActivityIndicator size="small" color={WHITE} />
                <Text style={uSt.saveTxt}>Uploading...</Text>
              </View>
            ) : (
              <Text style={uSt.saveTxt}>Upload & Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={reset}
    >
      {Platform.OS === "web" ? (
        <View style={uSt.overlay}>{sheetContent}</View>
      ) : (
        <KeyboardAvoidingView
          style={uSt.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {sheetContent}
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

const uSt = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  title: { fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY },
  closeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_SECONDARY,
    marginBottom: 7,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 22,
    backgroundColor: "#F9FAFB",
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  uploadPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  uploadSecondary: { fontSize: 12, color: TEXT_SECONDARY },
  fileCard: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    backgroundColor: ORANGE_LIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fileCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fileCardInfo: { flex: 1 },
  fileName: { fontSize: 13.5, fontWeight: "700", color: TEXT_PRIMARY },
  fileSize: { fontSize: 11.5, color: TEXT_SECONDARY, marginTop: 2 },
  fileReady: {
    fontSize: 11.5,
    color: "#15803D",
    fontWeight: "600",
    marginTop: 3,
  },
  fileCardActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  changeTxt: { fontSize: 12, color: ORANGE_DARK, fontWeight: "600" },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: RED_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTxt: { fontSize: 10, color: RED_TEXT, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  saveTxt: { fontSize: 14, color: WHITE, fontWeight: "700" },
  pickerWrap: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FAFAFA",
  },
  pickerOptionActive: {
    backgroundColor: "#EFF6FF",
    borderBottomColor: "#BFDBFE",
  },
  pickerOptionText: { fontSize: 13.5, color: TEXT_PRIMARY },
  pickerOptionTextActive: { color: BLUE, fontWeight: "700" },
});


const ViewDocModal = ({
  visible,
  doc,
  onClose,
  loading,
}: {
  visible: boolean;
  doc: Credential | null;
  onClose: () => void;
  loading?: boolean;
}) => {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const handleOpenDocument = () => {
    if (!doc?.url) {
      Alert.alert("Unavailable", "No document URL available.");
      return;
    }
    Linking.openURL(doc.url).catch(() =>
      Alert.alert("Error", "Could not open the document.")
    );
  };

  const isImageUrl = (fileName?: string, url?: string): boolean => {
    const source = fileName ?? url ?? "";
    return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(source);
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      {/* ── Overlay — centered on web, bottom-sheet on mobile ── */}
      <View
        style={[
          vdSt.overlay,
          isWeb && vdSt.overlayWeb,
        ]}
      >
        {/* ── Tap outside to close (web only) ── */}
        {isWeb && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        )}

        <View
          style={[
            vdSt.box,
            isWeb
              ? {
                borderRadius: 18,
                maxWidth: 520,
                width: "100%",
                maxHeight: screenHeight * 0.9,
                alignSelf: "center",
              }
              : {
                maxHeight: screenHeight * 0.92,
              },
          ]}
        >
          {/* ── Handle (mobile only) ── */}
          {!isWeb && <View style={vdSt.handle} />}

          {/* ── Header ── */}
          <View style={vdSt.header}>
            <View style={{ flex: 1 }}>
              <Text style={vdSt.title} numberOfLines={1}>
                {doc?.name ?? "Document"}
              </Text>
              {doc?.fileName && (
                <Text style={vdSt.subtitle} numberOfLines={1}>
                  📎 {doc.fileName}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={vdSt.closeBtn}>
              <Text style={{ fontSize: 14, color: TEXT_SECONDARY }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Status strip ── */}
          {doc && (
            <View style={vdSt.statusStrip}>
              <StatusBadge status={doc.status} />
              <Text style={vdSt.stripDate}>Updated: {doc.updated}</Text>
              <Text style={vdSt.stripId}>#{doc.id.slice(-6)}</Text>
            </View>
          )}

          <View style={vdSt.divider} />

          {/* ── Document preview ── */}
          {loading ? (
            <View style={[vdSt.previewBox, { height: 220 }]}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={vdSt.previewHint}>Loading document...</Text>
            </View>
          ) : doc?.url && isImageUrl(doc.fileName, doc.url) ? (
            <View
              style={[
                vdSt.previewBox,
                {
                  height: isWeb
                    ? Math.min(screenHeight * 0.55, 480)
                    : screenHeight * 0.5,
                },
              ]}
            >
              <Image
                source={{ uri: doc.url }}
                style={vdSt.image}
                resizeMode="contain"
              />
            </View>
          ) : doc?.url ? (
            <View style={[vdSt.previewBox, { height: 200 }]}>
              <Text style={{ fontSize: 52 }}>📄</Text>
              <Text style={vdSt.previewHint}>
                Preview not available for this file type.
              </Text>
              <TouchableOpacity
                style={[vdSt.openBtn, { marginTop: 14, paddingHorizontal: 24 }]}
                onPress={handleOpenDocument}
                activeOpacity={0.85}
              >
                <Text style={vdSt.openBtnTxt}>🔗  Open in Browser</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[vdSt.previewBox, { height: 200 }]}>
              <Text style={{ fontSize: 52 }}>📭</Text>
              <Text style={vdSt.previewHint}>No preview available.</Text>
            </View>
          )}

          {/* ── Footer ── */}
          <View style={vdSt.footer}>
            {doc?.url && isImageUrl(doc.fileName, doc.url) && (
              <TouchableOpacity
                style={vdSt.openBtn}
                onPress={handleOpenDocument}
                activeOpacity={0.85}
              >
                <Text style={vdSt.openBtnTxt}>🔗  Open Original</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={vdSt.doneBtn} onPress={onClose}>
              <Text style={vdSt.doneTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const vdSt = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",          // bottom sheet on mobile
  },
  overlayWeb: {
    justifyContent: "center",            // centered on web
    alignItems: "center",
    padding: 20,
  },
  box: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 2,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  stripDate: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  stripId: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  previewBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
    padding: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  previewHint: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 10,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  openBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
  },
  openBtnTxt: {
    fontSize: 14,
    color: BLUE,
    fontWeight: "700",
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: ORANGE,
    alignItems: "center",
  },
  doneTxt: {
    fontSize: 14,
    color: WHITE,
    fontWeight: "700",
  },
});

// ─── Credential Row ───────────────────────────────────────────────────────────
const CredentialRow = ({ cred, onView, onRemove, last, }: {
  cred: Credential;
  onView: () => void;
  onRemove: () => void;
  last?: boolean;
}) => (
  <View style={[crSt.row, last && { borderBottomWidth: 0 }]}>
    <View style={crSt.nameCell}>
      <Text style={{ fontSize: 15, marginRight: 7 }}>📋</Text>
      <View style={{ flex: 1 }}>
        <Text style={crSt.name} numberOfLines={1}>
          {cred.name}
        </Text>
        {cred.fileName && (
          <Text style={crSt.fileHint} numberOfLines={1}>
            📎 {cred.fileName}
            {cred.fileSize ? `  ·  ${cred.fileSize}` : ""}
          </Text>
        )}
      </View>
    </View>
    <View style={crSt.statusCell}>
      <StatusBadge status={cred.status} />
    </View>
    <View style={crSt.dateCell}>
      <Text style={crSt.date}>{cred.updated}</Text>
    </View>
    <View style={crSt.actionsCell}>
      <TouchableOpacity onPress={onView}>
        <Text style={crSt.viewTxt}>View</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRemove}
        style={crSt.removeBtn}
      >
        <Text style={crSt.removeTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  </View>
);
const crSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  nameCell: {
    flex: 2.4,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
  },
  name: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: "500" },
  fileHint: { fontSize: 11, color: TEXT_SECONDARY, marginTop: 2 },
  statusCell: { flex: 1.6 },
  dateCell: { flex: 1.3 },
  date: { fontSize: 12, color: TEXT_SECONDARY },
  actionsCell: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  viewTxt: { fontSize: 12.5, color: BLUE, fontWeight: "600" },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: RED_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTxt: { fontSize: 9, color: RED_TEXT, fontWeight: "700" },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(30)).current;
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslateY, {
            toValue: 30,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2500);
    });
  };

  const [hospitalLegalName, setHospitalLegalName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [location, setLocation] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [services, setServices] = useState<string[]>([]);

  const STATIC_PHONE = "+91 000 000-0000";
  const STATIC_WEBSITE = "—";
  const STATIC_BED_CAP = "—";

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftStaff, setDraftStaff] = useState("");
  const [draftServices, setDraftServices] = useState<string[]>([]);

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credsLoading, setCredsLoading] = useState(true);
  const [credsError, setCredsError] = useState<string | null>(null);

  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Credential | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ✅ GET: response shape → { success, documents: [...], pagination }
  const fetchDocuments = useCallback(async () => {
    try {
      setCredsLoading(true);
      setCredsError(null);
      const data = await documentAPI.getDocuments();
      if (data?.success) {
        setCredentials(
          Array.isArray(data.documents)
            ? data.documents.map(mapAPIDocument)
            : []
        );
      } else {
        setCredentials([]);
      }
    } catch (err: any) {
      console.error("fetchDocuments error:", err);
      setCredsError(err?.message ?? "Failed to load documents.");
    } finally {
      setCredsLoading(false);
    }
  }, []);

  // ✅ DELETE: /api/documents/:documentId
  const handleDeleteDocument = async (credId: string) => {
    try {
      await documentAPI.deleteDocument(credId);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
      showToast("Document removed successfully.");
    } catch {
      Alert.alert("Error", "Could not delete document. Please try again.");
    }
  };

  const handleViewDocument = async (cred: Credential) => {
    try {
      setViewLoading(true);
      const data = await documentAPI.getDocument(cred.id);
      if (data?.success && data?.data) {
        setSelectedDoc(mapAPIDocument(data.data));
      } else {
        setSelectedDoc(cred);
      }
      setViewModal(true);
    } catch {
      setSelectedDoc(cred);
      setViewModal(true);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data: any = await profileAPI.getMyProfile();
      const mapped = mapAPIToProfile(data);
      setHospitalLegalName(mapped.hospitalLegalName);
      setUserEmail(mapped.userEmail);
      setCurrentAddress(mapped.currentAddress);
      setLocation(mapped.location);
      setStaffCount(mapped.staffCount);
      setServices(mapped.servicesAvailable);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Failed to load profile. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, [fetchProfile, fetchDocuments]);

  const handleStartEdit = () => {
    setDraftName(hospitalLegalName);
    setDraftAddress(currentAddress);
    setDraftLocation(location);
    setDraftStaff(staffCount);
    setDraftServices([...services]);
    setIsEditing(true);
  };

  const handleDiscard = () => setIsEditing(false);

  const handleSave = async () => {
    if (!draftName.trim()) {
      Alert.alert("Required", "Hospital name cannot be empty.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        hospitalLegalName: draftName.trim(),
        currentAddress: draftAddress.trim(),
        location: draftLocation.trim(),
        staffCount: draftStaff,
        servicesAvailable: draftServices,
      };
      await profileAPI.updateMyProfile(payload);
      setHospitalLegalName(draftName.trim());
      setCurrentAddress(draftAddress.trim());
      setLocation(draftLocation.trim());
      setStaffCount(draftStaff);
      setServices(draftServices);
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Failed to save changes. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={gSt.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={gSt.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={gSt.loadingTxt}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (apiError) {
    return (
      <SafeAreaView style={gSt.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={gSt.loadingContainer}>
          <Text style={{ fontSize: 36 }}>⚠️</Text>
          <Text style={gSt.errorTxt}>{apiError}</Text>
          <TouchableOpacity style={gSt.retryBtn} onPress={fetchProfile}>
            <Text style={gSt.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={gSt.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Page Header ── */}
      <View style={gSt.pageHeader}>
        <View style={gSt.pageHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={gSt.pageTitle}>Hospital Profile</Text>
            <Text style={gSt.pageSub}>
              {isEditing
                ? "Make your changes below and save when done."
                : "View and manage your hospital's information."}
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={gSt.editBtn}
              onPress={handleStartEdit}
              activeOpacity={0.8}
            >
              <Text style={gSt.editBtnTxt}>✏️  Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
        {isEditing && (
          <View style={gSt.editBanner}>
            <Text style={gSt.editBannerTxt}>
              ✏️  You are currently editing the profile
            </Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={gSt.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── General Information ── */}
        <SectionCard icon="ℹ️" title="General Information">
          {isEditing ? (
            <>
              <LabeledInput
                label="Hospital Name"
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Enter hospital name"
              />
              <View style={iSt.group}>
                <Text style={iSt.label}>Contact Email</Text>
                <View style={gSt.staticField}>
                  <Text style={gSt.staticFieldTxt}>{userEmail}</Text>
                </View>
              </View>
              <LabeledInput
                label="Full Address"
                value={draftAddress}
                onChangeText={setDraftAddress}
                placeholder="Enter full address"
              />
              <View style={gSt.row}>
                <LabeledInput
                  label="City / Location"
                  value={draftLocation}
                  onChangeText={setDraftLocation}
                  placeholder="e.g. Nagpur"
                  half
                />
                <View style={{ width: 12 }} />
                <View style={[iSt.group, iSt.half]}>
                  <Text style={iSt.label}>Phone Number</Text>
                  <View style={gSt.staticField}>
                    <Text style={gSt.staticFieldTxt}>{STATIC_PHONE}</Text>
                  </View>
                </View>
              </View>
              <View style={iSt.group}>
                <Text style={iSt.label}>Official Website</Text>
                <View style={gSt.staticField}>
                  <Text style={gSt.staticFieldTxt}>{STATIC_WEBSITE}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <InfoFieldFull label="Hospital Name" value={hospitalLegalName} />
              <InfoFieldFull label="Full Address" value={currentAddress} />
              <View style={[gSt.row, { gap: 12 }]}>
                <InfoField label="City / Location" value={location} />
                <InfoField label="Contact Email" value={userEmail} />
              </View>
              <View style={[gSt.row, { gap: 12 }]}>
                <InfoField label="Phone Number" value={STATIC_PHONE} />
                <InfoField label="Official Website" value={STATIC_WEBSITE} />
              </View>
            </>
          )}
        </SectionCard>

        {/* ── Capacity & Services ── */}
        <SectionCard icon="⊞" title="Capacity & Services">
          {isEditing ? (
            <>
              <View style={[gSt.row, { zIndex: 10 }]}>
                <Dropdown
                  label="Staff Count"
                  value={draftStaff}
                  options={STAFF_OPTIONS}
                  onSelect={setDraftStaff}
                />
                <View style={{ width: 12 }} />
                <View style={[iSt.group, iSt.half]}>
                  <Text style={iSt.label}>Bed Capacity</Text>
                  <View style={gSt.staticField}>
                    <Text style={gSt.staticFieldTxt}>{STATIC_BED_CAP}</Text>
                  </View>
                </View>
              </View>
              <DepartmentTags
                departments={draftServices}
                setDepartments={setDraftServices}
              />
            </>
          ) : (
            <>
              <View style={[gSt.row, { gap: 12 }]}>
                <InfoRow label="Staff Count" value={staffCount} />
                <InfoRow label="Bed Capacity" value={STATIC_BED_CAP} />
              </View>
              <DepartmentTagsView departments={services} />
            </>
          )}
        </SectionCard>

        {/* ── Credential & Compliance ── */}
        <SectionCard
          icon="🛡️"
          title="Credential & Compliance"
          headerRight={
            <TouchableOpacity
              style={gSt.plusBtn}
              onPress={() => setUploadModal(true)}
              activeOpacity={0.8}
            >
              <Text style={gSt.plusTxt}>＋</Text>
            </TouchableOpacity>
          }
        >
          <View style={gSt.credHeader}>
            <Text style={[gSt.credHdrTxt, { flex: 2.4 }]}>DOCUMENT NAME</Text>
            <Text style={[gSt.credHdrTxt, { flex: 1.6 }]}>STATUS</Text>
            <Text style={[gSt.credHdrTxt, { flex: 1.3 }]}>LAST UPDATED</Text>
            <Text style={[gSt.credHdrTxt, { flex: 1, textAlign: "right" }]}>
              ACTIONS
            </Text>
          </View>

          {credsLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text
                style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 8 }}
              >
                Loading documents...
              </Text>
            </View>
          ) : credsError ? (
            <View
              style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}
            >
              <Text style={{ fontSize: 13, color: RED_TEXT }}>{credsError}</Text>
              <TouchableOpacity onPress={fetchDocuments}>
                <Text
                  style={{ fontSize: 13, color: BLUE, fontWeight: "600" }}
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : credentials.length === 0 ? (
            <View style={gSt.emptyState}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={gSt.emptyTxt}>No documents yet.</Text>
              <TouchableOpacity
                style={gSt.emptyAddBtn}
                onPress={() => setUploadModal(true)}
              >
                <Text style={gSt.emptyAddTxt}>
                  Upload your first document
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            credentials.map((cred, idx) => (
              <CredentialRow
                key={cred.id}
                cred={cred}
                onView={() => handleViewDocument(cred)}
                // AFTER — platform-aware confirmation
                onRemove={() => {
                  if (Platform.OS === "web") {
                    // window.confirm works correctly on web
                    if (window.confirm(`Are you sure you want to remove "${cred.name}"?`)) {
                      handleDeleteDocument(cred.id);
                    }
                  } else {
                    // Alert.alert works correctly on Android/iOS
                    Alert.alert(
                      "Remove Document",
                      `Are you sure you want to remove "${cred.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => handleDeleteDocument(cred.id),
                        },
                      ]
                    );
                  }
                }}
                last={idx === credentials.length - 1}
              />
            ))
          )}
        </SectionCard>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer – edit mode only ── */}
      {isEditing && (
        <View style={gSt.footer}>
          <TouchableOpacity
            style={gSt.discardBtn}
            onPress={handleDiscard}
            disabled={saving}
          >
            <Text style={gSt.discardTxt}>Discard Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[gSt.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ActivityIndicator size="small" color={WHITE} />
                <Text style={gSt.saveTxt}>Saving...</Text>
              </View>
            ) : (
              <Text style={gSt.saveTxt}>💾  Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modals ── */}
      <UploadDocModal
        visible={uploadModal}
        onClose={() => setUploadModal(false)}
        onAdd={(cred) => {
          setCredentials((prev) => [...prev, cred]);
          fetchDocuments();
        }}
      />
      <ViewDocModal
        visible={viewModal}
        doc={selectedDoc}
        onClose={() => setViewModal(false)}
        loading={viewLoading}
      />

      {/* ── Toast ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          gSt.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateY: toastTranslateY }],
          },
        ]}
      >
        <View style={gSt.toastIconWrap}>
          <Text style={{ fontSize: 15 }}>✓</Text>
        </View>
        <Text style={gSt.toastTxt}>{toastMsg}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const gSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 30,
  },
  loadingTxt: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 },
  errorTxt: {
    fontSize: 14,
    color: RED_TEXT,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: ORANGE,
  },
  retryTxt: { fontSize: 14, color: WHITE, fontWeight: "700" },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 18 : 12,
    paddingBottom: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pageHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pageTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 12.5,
    color: TEXT_SECONDARY,
    marginTop: 3,
    lineHeight: 18,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editBtnTxt: { fontSize: 13, color: WHITE, fontWeight: "700" },
  editBanner: {
    marginTop: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  editBannerTxt: { fontSize: 12.5, color: BLUE, fontWeight: "600" },
  body: { padding: 16 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  staticField: {
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    minHeight: 42,
    justifyContent: "center",
  },
  staticFieldTxt: { fontSize: 13.5, color: TEXT_SECONDARY },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  plusTxt: {
    fontSize: 18,
    color: WHITE,
    fontWeight: "700",
    lineHeight: 22,
  },
  credHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 2,
  },
  credHdrTxt: {
    fontSize: 10.5,
    fontWeight: "700",
    color: TEXT_SECONDARY,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyTxt: { fontSize: 13, color: TEXT_SECONDARY },
  emptyAddBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: ORANGE_LIGHT,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  emptyAddTxt: { fontSize: 13, color: ORANGE_DARK, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 5,
  },
  discardBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  discardTxt: { fontSize: 13.5, color: TEXT_SECONDARY, fontWeight: "500" },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 140,
    justifyContent: "center",
  },
  saveTxt: { fontSize: 13.5, color: WHITE, fontWeight: "700" },
  toast: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 20,
  },
  toastIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  toastTxt: { fontSize: 14, color: WHITE, fontWeight: "600", flex: 1 },
});

export default Profile;


