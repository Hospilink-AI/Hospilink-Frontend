import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
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
  Image,
  useWindowDimensions,
} from "react-native";
import { profileAPI, documentAPI } from "../../service/api";
import { Ionicons } from '@expo/vector-icons';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const BLUE = "#2563EB";
const BLUE_LIGHT = "#EFF6FF";
const GREEN = "#10B981";
const GREEN_LIGHT = "#DCFCE7";
const ORANGE = "#F97316";
const ORANGE_LIGHT = "#FFF7ED";
const PURPLE_LIGHT = "#F3E8FF";
const BORDER = "#E2E8F0";
const BG = "#F4F7FB";
const TEXT_PRIMARY = "#1E293B";
const TEXT_SECONDARY = "#64748B";
const WHITE = "#FFFFFF";
const RED_BG = "#FEE2E2";
const RED_TEXT = "#EF4444";

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
  { label: "NABH Certificate", value: "nabh-certificate" },
  { label: "CIN Certificate", value: "cin-certificate" },
  { label: "GST Certificate", value: "gst-certificate" },
  { label: "ROHINI Certificate", value: "rohini-certificate" },
  { label: "CGHS Certificate", value: "cghs-certificate" },
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
    case "verified": return "Verified";
    case "expiring-soon": return "Expiring Soon";
    case "expired": return "Expired";
    case "manual-pending-verification":
    case "pending":
    default:
      return "Pending";
  }
}

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
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "700" },
});

// ─── Labeled Input ────────────────────────────────────────────────────────────
const LabeledInput = ({ label, value, onChangeText, half, placeholder }: { label: string; value: string; onChangeText: (t: string) => void; half?: boolean; placeholder?: string; }) => (
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
  group: { marginBottom: 16, flex: 1 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: "600", color: TEXT_SECONDARY, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT_PRIMARY, backgroundColor: WHITE },
});

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const STAFF_OPTIONS = ["2-10", "11-50", "51-100", "100+"];
const Dropdown = ({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void; }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={[iSt.group, iSt.half, { zIndex: 10 }]}>
      <Text style={iSt.label}>{label}</Text>
      <TouchableOpacity style={dSt.btn} onPress={() => setOpen(!open)}>
        <Text style={dSt.val}>{value || "Select"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={TEXT_SECONDARY} />
      </TouchableOpacity>
      {open && (
        <View style={dSt.menu}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={dSt.item} onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[dSt.itemTxt, opt === value && { color: BLUE, fontWeight: "700" }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
const dSt = StyleSheet.create({
  btn: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: WHITE },
  val: { fontSize: 14, color: TEXT_PRIMARY },
  menu: { position: "absolute", top: 70, left: 0, right: 0, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, zIndex: 100, elevation: 8 },
  item: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  itemTxt: { fontSize: 14, color: TEXT_PRIMARY },
});

// ─── Department Tags – edit mode ──────────────────────────────────────────────
const ALL_SERVICES = ["Emergency Care", "General Surgery", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Obstetrics & Gynecology", "Internal Medicine", "Radiology", "Laboratory Services"];
const DepartmentTags = ({ departments, setDepartments }: { departments: string[]; setDepartments: (d: string[]) => void; }) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const toggle = (service: string) => {
    if (departments.includes(service)) setDepartments(departments.filter((x) => x !== service));
    else setDepartments([...departments, service]);
  };

  return (
    <View style={tSt.wrapper}>
      <Text style={iSt.label}>Available Clinical Services</Text>
      <View style={tSt.tagsArea}>
        {departments.length === 0 && <Text style={tSt.emptyHint}>No services selected yet.</Text>}
        {departments.map((dept) => (
          <View key={dept} style={tSt.tag}>
            <Text style={tSt.tagTxt}>{dept}</Text>
            <TouchableOpacity onPress={() => toggle(dept)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={tSt.tagClose}>
              <Text style={tSt.tagCloseTxt}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={tSt.addBtn} onPress={() => setPanelOpen(!panelOpen)} activeOpacity={0.8}>
          <Text style={tSt.addBtnTxt}>+ Add Service</Text>
        </TouchableOpacity>
      </View>
      {panelOpen && (
        <View style={tSt.panel}>
          {ALL_SERVICES.map((service) => {
            const selected = departments.includes(service);
            return (
              <TouchableOpacity key={service} style={tSt.serviceRow} onPress={() => toggle(service)} activeOpacity={0.7}>
                <Text style={[tSt.serviceName, selected && tSt.serviceNameSelected]}>{service}</Text>
                <View style={[tSt.checkCircle, selected && tSt.checkCircleSelected]}>
                  {selected && <Text style={tSt.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};
const tSt = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  tagsArea: { flexDirection: "row", flexWrap: "wrap", gap: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, backgroundColor: "#F8FAFF", minHeight: 60, alignItems: "center", marginBottom: 8 },
  emptyHint: { fontSize: 13, color: "#9CA3AF", fontStyle: "italic" },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagTxt: { fontSize: 12, color: WHITE, fontWeight: "600" },
  tagClose: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  tagCloseTxt: { fontSize: 14, color: WHITE },
  addBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: WHITE },
  addBtnTxt: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: "600" },
  panel: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: WHITE, marginBottom: 10, maxHeight: 200, overflow: 'hidden' },
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  serviceName: { fontSize: 14, color: TEXT_SECONDARY },
  serviceNameSelected: { color: BLUE, fontWeight: "700" },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  checkCircleSelected: { backgroundColor: BLUE, borderColor: BLUE },
  checkMark: { fontSize: 12, color: WHITE, fontWeight: "800" },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════════════════════
const UploadDocModal = ({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (c: Credential) => void; }) => {
  const [docType, setDocType] = useState("");
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setPickedFile({ name: asset.name, size: asset.size, uri: asset.uri, mimeType: asset.mimeType });
      }
    } catch {
      Alert.alert("Error", "Could not open file picker. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!docType.trim() || !pickedFile) { Alert.alert("Required", "Please select document type and file."); return; }
    try {
      setUploading(true);
      const response = await documentAPI.uploadDocument(docType, pickedFile.uri, pickedFile.mimeType);
      const uploadedDoc = response?.document
        ? mapAPIDocument(response.document)
        : response?.documents?.[0]
        ? mapAPIDocument(response.documents[0])
        : {
            id: Date.now().toString(),
            name: docType.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            status: "Pending" as CredStatus,
            updated: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            fileName: pickedFile.name,
            fileSize: pickedFile.size ? formatBytes(pickedFile.size) : undefined,
            documentType: docType,
          };
      onAdd(uploadedDoc);
      reset();
    } catch (err: any) {
      Alert.alert("Upload Failed", err?.message ?? "Could not upload document.");
    } finally { setUploading(false); }
  };

  const reset = () => { setDocType(""); setPickedFile(null); setUploading(false); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <View style={uSt.overlay}>
        <View style={uSt.sheet}>
          <View style={uSt.header}>
            <Text style={uSt.title}>Upload Document</Text>
            <TouchableOpacity onPress={reset}><Ionicons name="close" size={24} color={TEXT_SECONDARY} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={uSt.label}>Document Type <Text style={{ color: BLUE }}>*</Text></Text>
            <View style={uSt.pickerWrap}>
              {HOSPITAL_DOC_TYPES.map((opt) => (
                <TouchableOpacity key={opt.value} style={[uSt.pickerOption, docType === opt.value && uSt.pickerOptionActive]} onPress={() => setDocType(opt.value)}>
                  <Text style={[uSt.pickerOptionText, docType === opt.value && uSt.pickerOptionTextActive]}>{opt.label}</Text>
                  {docType === opt.value && <Text style={{ color: BLUE }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={uSt.label}>Upload Document <Text style={{ color: BLUE }}>*</Text></Text>
            {pickedFile ? (
              <View style={uSt.fileCard}>
                <View style={uSt.fileCardLeft}>
                  <Text style={{ fontSize: 24 }}>{fileIcon(pickedFile.mimeType)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={uSt.fileName} numberOfLines={1}>{pickedFile.name}</Text>
                    {pickedFile.size !== undefined && <Text style={uSt.fileSize}>{formatBytes(pickedFile.size)}</Text>}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handlePickFile} style={uSt.changeBtn}><Text style={uSt.changeTxt}>Change</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setPickedFile(null)} style={uSt.removeBtn}><Text style={uSt.removeTxt}>✕</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={uSt.uploadZone} onPress={handlePickFile}>
                <Ionicons name="cloud-upload-outline" size={32} color={BLUE} style={{ marginBottom: 8 }} />
                <Text style={uSt.uploadPrimary}>Tap to upload file</Text>
                <Text style={uSt.uploadSecondary}>PDF, DOC, Images supported</Text>
              </TouchableOpacity>
            )}
            <View style={uSt.footer}>
              <TouchableOpacity style={uSt.cancelBtn} onPress={reset} disabled={uploading}><Text style={uSt.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[uSt.saveBtn, uploading && { opacity: 0.7 }]} onPress={handleSave} disabled={uploading}>
                {uploading ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={uSt.saveTxt}>Upload</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const uSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  sheet: { backgroundColor: WHITE, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90%' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY },
  label: { fontSize: 12, fontWeight: "600", color: TEXT_SECONDARY, marginBottom: 8 },
  uploadZone: { borderWidth: 2, borderColor: BORDER, borderStyle: "dashed", borderRadius: 12, alignItems: "center", paddingVertical: 32, marginBottom: 24, backgroundColor: "#F8FAFC" },
  uploadPrimary: { fontSize: 14, fontWeight: "600", color: TEXT_PRIMARY },
  uploadSecondary: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 },
  fileCard: { borderWidth: 1, borderColor: BLUE, borderRadius: 10, padding: 14, marginBottom: 24, backgroundColor: BLUE_LIGHT, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fileCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  fileName: { fontSize: 14, fontWeight: "600", color: TEXT_PRIMARY },
  fileSize: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER },
  changeTxt: { fontSize: 12, color: TEXT_PRIMARY, fontWeight: "600" },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  removeTxt: { fontSize: 12, color: RED_TEXT, fontWeight: "700" },
  footer: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: BORDER, alignItems: "center" },
  cancelTxt: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: "600" },
  saveBtn: { flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  saveTxt: { fontSize: 14, color: WHITE, fontWeight: "600" },
  pickerWrap: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, overflow: "hidden", marginBottom: 20 },
  pickerOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  pickerOptionActive: { backgroundColor: BLUE_LIGHT },
  pickerOptionText: { fontSize: 14, color: TEXT_PRIMARY },
  pickerOptionTextActive: { color: BLUE, fontWeight: "600" },
});

const ViewDocModal = ({ visible, doc, onClose, loading }: { visible: boolean; doc: Credential | null; onClose: () => void; loading?: boolean; }) => {
  const isImageUrl = (f?: string, u?: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f ?? u ?? "");
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vdSt.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={vdSt.box}>
          <View style={vdSt.header}>
            <View style={{ flex: 1 }}>
              <Text style={vdSt.title} numberOfLines={1}>{doc?.name ?? "Document"}</Text>
              {doc?.fileName && <Text style={vdSt.subtitle} numberOfLines={1}>📎 {doc.fileName}</Text>}
            </View>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={TEXT_SECONDARY}/></TouchableOpacity>
          </View>
          {doc && (
            <View style={vdSt.statusStrip}>
              <StatusBadge status={doc.status} />
              <Text style={vdSt.stripDate}>Updated: {doc.updated}</Text>
            </View>
          )}
          <View style={vdSt.divider} />
          {loading ? (
            <View style={[vdSt.previewBox, { height: 200 }]}><ActivityIndicator size="large" color={BLUE} /></View>
          ) : doc?.url && isImageUrl(doc.fileName, doc.url) ? (
            <View style={[vdSt.previewBox, { height: 300 }]}><Image source={{ uri: doc.url }} style={vdSt.image} resizeMode="contain" /></View>
          ) : doc?.url ? (
            <View style={[vdSt.previewBox, { height: 200 }]}>
              <Ionicons name="document-text-outline" size={48} color={TEXT_SECONDARY} />
              <TouchableOpacity style={vdSt.openBtn} onPress={() => Linking.openURL(doc.url!)}><Text style={vdSt.openBtnTxt}>Open Document</Text></TouchableOpacity>
            </View>
          ) : (
            <View style={[vdSt.previewBox, { height: 200 }]}><Ionicons name="folder-open-outline" size={48} color={BORDER} /><Text style={vdSt.previewHint}>No preview available</Text></View>
          )}
        </View>
      </View>
    </Modal>
  );
};
const vdSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  box: { backgroundColor: WHITE, borderRadius: 16, padding: 24, width: "100%", maxWidth: 500 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY },
  subtitle: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 },
  statusStrip: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  stripDate: { fontSize: 12, color: TEXT_SECONDARY },
  divider: { height: 1, backgroundColor: BORDER, marginBottom: 16 },
  previewBox: { backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 16, padding: 10 },
  image: { width: "100%", height: "100%" },
  previewHint: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 12 },
  openBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: BLUE_LIGHT, borderRadius: 8, borderWidth: 1, borderColor: "#BFDBFE" },
  openBtnTxt: { color: BLUE, fontWeight: "600" },
});

// ─── Credential Row ───────────────────────────────────────────────────────────
const CredentialRow = ({ cred, onView, onRemove, last }: { cred: Credential; onView: () => void; onRemove: () => void; last?: boolean; }) => (
  <View style={[crSt.row, last && { borderBottomWidth: 0 }]}>
    <View style={crSt.nameCell}>
      <View style={crSt.iconBox}><Ionicons name="document-text" size={16} color={TEXT_SECONDARY}/></View>
      <View style={{ flex: 1 }}>
        <Text style={crSt.name} numberOfLines={1}>{cred.name}</Text>
        {cred.fileName && <Text style={crSt.fileHint} numberOfLines={1}>📎 {cred.fileName}</Text>}
      </View>
    </View>
    <View style={crSt.statusCell}><StatusBadge status={cred.status} /></View>
    <View style={crSt.dateCell}><Text style={crSt.date}>{cred.updated}</Text></View>
    <View style={crSt.actionsCell}>
      <TouchableOpacity onPress={onView}><Text style={crSt.viewTxt}>View</Text></TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={crSt.removeBtn}><Ionicons name="close" size={14} color={RED_TEXT} /></TouchableOpacity>
    </View>
  </View>
);
const crSt = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  nameCell: { flex: 2.5, flexDirection: "row", alignItems: "center", paddingRight: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 14, color: TEXT_PRIMARY, fontWeight: "600" },
  fileHint: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  statusCell: { flex: 1.5 },
  dateCell: { flex: 1.5 },
  date: { fontSize: 13, color: TEXT_SECONDARY },
  actionsCell: { flex: 1, flexDirection: "row", gap: 12, justifyContent: "flex-end", alignItems: "center" },
  viewTxt: { fontSize: 13, color: BLUE, fontWeight: "600" },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const Profile = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(30)).current;
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(toastTranslateY, { toValue: 30, duration: 250, useNativeDriver: true }),
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
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);

  const STATIC_PHONE = "+917498965650";

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftStaff, setDraftStaff] = useState("");
  const [draftServices, setDraftServices] = useState<string[]>([]);

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credsLoading, setCredsLoading] = useState(true);

  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Credential | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setCredsLoading(true);
      const data = await documentAPI.getDocuments();
      if (data?.success) setCredentials(Array.isArray(data.documents) ? data.documents.map(mapAPIDocument) : []);
    } catch (err) {
      console.error("fetchDocuments error:", err);
    } finally { setCredsLoading(false); }
  }, []);

  const handleDeleteDocument = async (credId: string) => {
    try {
      await documentAPI.deleteDocument(credId);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
      showToast("Document removed.");
    } catch {
      Alert.alert("Error", "Could not delete document.");
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true); setApiError(null);
      const data: any = await profileAPI.getMyProfile();
      console.log('API Response:', JSON.stringify(data, null, 2));
      const mapped = mapAPIToProfile(data);
      console.log('Mapped Profile:', mapped);
      setHospitalLegalName(mapped.hospitalLegalName || "ABC Hospital");
      setUserEmail(mapped.userEmail || "abhishekpimpalkar35@gmail.com");
      setCurrentAddress(mapped.currentAddress || "Mumbai, Goregaon");
      setLocation(mapped.location || "Mumbai");
      setStaffCount(mapped.staffCount || "124");
      setServices(mapped.servicesAvailable?.length ? mapped.servicesAvailable : ["Emergency & Acute Care", "Diagnostics & Imaging", "Support Services"]);
      setIsProfileComplete(mapped.isProfileComplete || false);
      setVerificationStatus(data?.profile?.verificationStatus ?? null);
      setProfilePicture(data?.profile?.profilePicture || null);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      setApiError(err?.response?.data?.message ?? "Failed to load profile.");
    } finally { setLoading(false); }
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
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!draftName.trim()) { Alert.alert("Required", "Hospital name cannot be empty."); return; }
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
      setEditModalVisible(false);
      showToast("Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Failed to save changes.");
    } finally { setSaving(false); }
  };

  const processImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      setProfilePicture(uri);
      const res = await profileAPI.uploadProfilePicture(uri);
      if (res.success) {
        setProfilePicture(res.profilePicture);
        showToast("Profile picture updated!");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Error", "Failed to upload profile picture.");
      setProfilePicture(profilePicture);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpload = async () => {
    setShowImageMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    setShowImageMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
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
        setProfilePicture(null);
        showToast("Profile picture removed!");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      Alert.alert("Error", "Failed to delete profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={gSt.safe}>
        <View style={gSt.centerContainer}><ActivityIndicator size="large" color={BLUE} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={gSt.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={gSt.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Top Header Card ── */}
        {/* ── Top Header Card ── */}
        <View style={gSt.headerCard}>
          {/* 1. On mobile, switch the main row to a column so the Edit Button drops to the bottom */}
          <View style={[gSt.headerRow, isMobile && { flexDirection: "column" }]}>
            
            {/* 2. Top-align the avatar and text using alignItems: "flex-start" */}
            <View style={[gSt.headerLeft, { flex: 1, alignItems: "flex-start" }]}>
              <TouchableOpacity style={[gSt.avatarCircle, { marginTop: 4 }]} onPress={() => setShowImageMenu(true)} activeOpacity={0.85}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={gSt.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color="#94A3B8" />
                )}
                <View style={gSt.cameraBadge}><Ionicons name="camera" size={12} color={WHITE} /></View>
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <Text style={gSt.hospitalTitle}>{hospitalLegalName}</Text>
                <Text style={gSt.hospitalSub}>Multispeciality Hospital • ICU Specialist</Text>
                
                {/* 3. Added a slight top margin to separate badges from the subtitle */}
                <View style={[gSt.badgeRow, { marginTop: 10 }, isMobile && gSt.badgeRowMobile]}>
                  <View style={gSt.blueBadge}><Text style={gSt.blueBadgeTxt}>MD, FRCP</Text></View>
                  {verificationStatus === "verified" ? (
                    <View style={gSt.greenBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                      <Text style={gSt.greenBadgeTxt}>Verified Profile</Text>
                    </View>
                  ) : verificationStatus === "rejected" ? (
                    <View style={[gSt.pill, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                      <Ionicons name="close-circle" size={12} color="#DC2626" />
                      <Text style={[gSt.pillTxt, { color: "#DC2626" }]}>Rejected</Text>
                    </View>
                  ) : (
                    <View style={[gSt.pill, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
                      <Ionicons name="time-outline" size={12} color="#A16207" />
                      <Text style={[gSt.pillTxt, { color: "#A16207" }]}>Verification Under Process</Text>
                    </View>
                  )}
                  {isProfileComplete && (
                    <View style={gSt.completeBadge}>
                      <Ionicons name="checkmark-done-circle" size={12} color="#15803D" />
                      <Text style={gSt.completeBadgeTxt}>Profile Complete</Text>
                    </View>
                  )}
                  <View style={gSt.grayBadge}><Ionicons name="call" size={11} color={TEXT_SECONDARY} /><Text style={gSt.grayBadgeTxt}>{STATIC_PHONE}</Text></View>
                  <View style={gSt.grayBadge}><Ionicons name="mail" size={11} color={TEXT_SECONDARY} /><Text style={gSt.grayBadgeTxt}>{userEmail}</Text></View>
                </View>
              </View>
            </View>

            {/* 4. On mobile, make the Edit Button 100% width and center the text */}
            <TouchableOpacity 
              style={[
                gSt.editBtn, 
                isMobile && { width: "100%", justifyContent: "center", marginTop: 12 }
              ]} 
              onPress={handleStartEdit} 
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={14} color={WHITE} />
              <Text style={gSt.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4 Stats Cards ── */}
        <View style={[gSt.statsRow, isMobile && gSt.statsRowMobile]}>
          <View style={[gSt.statCard, isMobile && gSt.statCardMobile]}>
            <View style={[gSt.statIconWrap, { backgroundColor: BLUE_LIGHT }]}><Ionicons name="checkmark-done" size={18} color={BLUE} /></View>
            <Text style={gSt.statValue}>{isProfileComplete ? '90%' : '50%'}</Text>
            <Text style={gSt.statLabel}>Profile Completion</Text>
            <View style={gSt.progressBarBg}><View style={[gSt.progressBarFill, { width: isProfileComplete ? '90%' : '50%', backgroundColor: BLUE }]} /></View>
          </View>
          <View style={[gSt.statCard, isMobile && gSt.statCardMobile]}>
            <View style={[gSt.statIconWrap, { backgroundColor: GREEN_LIGHT }]}><Ionicons name="shield-checkmark" size={18} color={GREEN} /></View>
            <Text style={gSt.statValue}>{credentials.filter(c => c.status === 'Verified').length || '12'}</Text>
            <Text style={gSt.statLabel}>Verified Docs</Text>
          </View>
          <View style={[gSt.statCard, isMobile && gSt.statCardMobile]}>
            <View style={[gSt.statIconWrap, { backgroundColor: ORANGE_LIGHT }]}><Ionicons name="people" size={18} color={ORANGE} /></View>
            <Text style={gSt.statValue}>{staffCount}</Text>
            <Text style={gSt.statLabel}>Staff Count</Text>
          </View>
          <View style={[gSt.statCard, isMobile && gSt.statCardMobile]}>
            <View style={[gSt.statIconWrap, { backgroundColor: PURPLE_LIGHT }]}><Ionicons name="bed" size={18} color="#9333EA" /></View>
            <Text style={gSt.statValue}>50</Text>
            <Text style={gSt.statLabel}>Bed Capacity</Text>
          </View>
        </View>

        {/* ── Departments & Services ── */}
        <View style={gSt.sectionCard}>
          <View style={gSt.sectionHeader}>
            <Text style={gSt.sectionTitle}>List of Department & Services</Text>
            <TouchableOpacity><Text style={gSt.viewAllTxt}>View All</Text></TouchableOpacity>
          </View>
          <View style={[gSt.deptMainRow, isMobile && { flexDirection: 'column' }]}>
            <View style={[gSt.deptMainBox, isMobile && { width: '100%' }]}>
              <View style={[gSt.deptIcon, { backgroundColor: RED_BG }]}><Ionicons name="medkit" size={20} color={RED_TEXT}/></View>
              <Text style={gSt.deptMainTitle}>Emergency & Acute Care</Text>
              <Text style={gSt.deptMainSub}>Level 1 Trauma center and 24/7 cardiac emergency.</Text>
            </View>
            <View style={[gSt.deptMainBox, isMobile && { width: '100%' }]}>
              <View style={[gSt.deptIcon, { backgroundColor: PURPLE_LIGHT }]}><Ionicons name="scan" size={20} color="#9333EA"/></View>
              <Text style={gSt.deptMainTitle}>Diagnostics & Imaging</Text>
              <Text style={gSt.deptMainSub}>Advanced MRI, CT-Scan, and Pathology Labs.</Text>
            </View>
            <View style={[gSt.deptMainBox, isMobile && { width: '100%' }]}>
              <View style={[gSt.deptIcon, { backgroundColor: GREEN_LIGHT }]}><Ionicons name="people" size={20} color={GREEN}/></View>
              <Text style={gSt.deptMainTitle}>Support Services</Text>
              <Text style={gSt.deptMainSub}>Physical therapy, Nutrition, and Social work.</Text>
            </View>
          </View>
          <View style={gSt.deptTagsRow}>
            {services.map((srv, idx) => (
              <View key={idx} style={[gSt.deptMiniBox, isMobile && { width: '48%' }]}>
                <View style={gSt.deptMiniHeader}>
                  <Text style={gSt.deptMiniTitle} numberOfLines={1}>{srv}</Text>
                  <Ionicons name="arrow-forward" size={12} color={TEXT_SECONDARY} />
                </View>
                <View style={gSt.progressBarBg}><View style={[gSt.progressBarFill, { width: `${Math.floor(Math.random() * 50) + 40}%`, backgroundColor: BLUE }]} /></View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Licenses & Certifications ── */}
        <View style={gSt.sectionCard}>
          <View style={gSt.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[gSt.statIconWrap, { backgroundColor: BLUE_LIGHT, width: 32, height: 32, borderRadius: 8 }]}><Ionicons name="shield-checkmark" size={16} color={BLUE} /></View>
              <Text style={gSt.sectionTitle}>Licenses & Certifications</Text>
            </View>
            <TouchableOpacity style={gSt.plusBtn} onPress={() => setUploadModal(true)}>
              <Ionicons name="add" size={16} color={WHITE} />
            </TouchableOpacity>
          </View>
          <View style={gSt.tableHeader}>
            <Text style={[gSt.thText, { flex: 2.5 }]}>DOCUMENT NAME</Text>
            <Text style={[gSt.thText, { flex: 1.5 }]}>STATUS</Text>
            <Text style={[gSt.thText, { flex: 1.5 }]}>LAST UPDATED</Text>
            <Text style={[gSt.thText, { flex: 1, textAlign: "right" }]}>ACTIONS</Text>
          </View>
          {credsLoading ? (
            <View style={gSt.centerContainer}><ActivityIndicator size="small" color={BLUE} /></View>
          ) : credentials.length === 0 ? (
            <View style={gSt.centerContainer}>
              <Text style={{ color: TEXT_SECONDARY, marginBottom: 12 }}>No documents uploaded.</Text>
              <TouchableOpacity style={gSt.outlineBtn} onPress={() => setUploadModal(true)}><Text style={{ color: BLUE, fontWeight: '600' }}>Upload Document</Text></TouchableOpacity>
            </View>
          ) : (
            credentials.map((cred, idx) => (
              <CredentialRow
                key={cred.id} cred={cred} last={idx === credentials.length - 1}
                onView={() => { setSelectedDoc(cred); setViewModal(true); }}
                onRemove={() => handleDeleteDocument(cred.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={gSt.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={gSt.keyboardView}>
            <View style={[gSt.modalBox, isMobile && gSt.modalBoxMobile]}>
              <View style={gSt.modalHeader}>
                <Text style={gSt.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={TEXT_SECONDARY}/></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={gSt.modalScroll}>
                <View style={gSt.modalAvatarRow}>
                  {uploadingImage ? (
                    <View style={[gSt.modalAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                      <ActivityIndicator size="small" color={BLUE} />
                    </View>
                  ) : profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={gSt.modalAvatar} />
                  ) : (
                    <View style={[gSt.modalAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="person" size={32} color="#94A3B8" />
                    </View>
                  )}
                  <TouchableOpacity style={gSt.changePhotoBtn} onPress={() => { setEditModalVisible(false); setTimeout(() => setShowImageMenu(true), 300); }}>
                    <Ionicons name="camera-outline" size={16} color={BLUE} />
                    <Text style={gSt.changePhotoTxt}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
                <LabeledInput label="Full Name (Hospital Name)" value={draftName} onChangeText={setDraftName} />
                <Dropdown label="Staff Count" value={draftStaff} options={STAFF_OPTIONS} onSelect={setDraftStaff} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <LabeledInput label="City" value={draftLocation} onChangeText={setDraftLocation} half />
                  <LabeledInput label="Area" value={draftAddress} onChangeText={setDraftAddress} half />
                </View>
                <View style={iSt.group}>
                  <Text style={iSt.label}>Phone Number</Text>
                  <View style={gSt.phoneInputWrap}>
                    <Text style={gSt.phonePrefix}>+91</Text>
                    <TextInput style={gSt.phoneInput} value={STATIC_PHONE.replace('+91', '')} editable={false} />
                  </View>
                </View>
                <DepartmentTags departments={draftServices} setDepartments={setDraftServices} />
              </ScrollView>
              <View style={gSt.modalFooter}>
                <TouchableOpacity style={gSt.modalCancel} onPress={() => setEditModalVisible(false)}><Text style={gSt.modalCancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={gSt.modalSave} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={WHITE}/> : <Text style={gSt.modalSaveTxt}>✓ Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Sub-Modals ── */}
      <UploadDocModal visible={uploadModal} onClose={() => setUploadModal(false)} onAdd={(c) => { setCredentials(p => [...p, c]); fetchDocuments(); }} />
      <ViewDocModal visible={viewModal} doc={selectedDoc} onClose={() => setViewModal(false)} />

      {/* ── Photo Menu Modal ── */}
      <Modal visible={showImageMenu} transparent animationType="fade" onRequestClose={() => setShowImageMenu(false)}>
        <TouchableOpacity style={gSt.photoMenuOverlay} activeOpacity={1} onPress={() => setShowImageMenu(false)}>
          <TouchableOpacity activeOpacity={1} style={gSt.photoMenuBox} onPress={() => {}}>
            <View style={gSt.photoMenuHeader}>
              <Text style={gSt.photoMenuTitle}>Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowImageMenu(false)}>
                <Ionicons name="close" size={24} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            {profilePicture && (
              <View style={gSt.photoPreviewWrap}>
                <Image source={{ uri: profilePicture }} style={gSt.photoPreview} />
              </View>
            )}
            <TouchableOpacity style={gSt.photoMenuItem} onPress={handleUpload} activeOpacity={0.75}>
              <View style={[gSt.photoMenuIcon, { backgroundColor: BLUE_LIGHT }]}>
                <Ionicons name="image-outline" size={20} color={BLUE} />
              </View>
              <View>
                <Text style={gSt.photoMenuLabel}>Upload from Library</Text>
                <Text style={gSt.photoMenuSub}>Choose a photo from your gallery</Text>
              </View>
            </TouchableOpacity>
            {Platform.OS !== "web" && (
              <TouchableOpacity style={gSt.photoMenuItem} onPress={handleCamera} activeOpacity={0.75}>
                <View style={[gSt.photoMenuIcon, { backgroundColor: GREEN_LIGHT }]}>
                  <Ionicons name="camera-outline" size={20} color={GREEN} />
                </View>
                <View>
                  <Text style={gSt.photoMenuLabel}>Take a Photo</Text>
                  <Text style={gSt.photoMenuSub}>Use your camera</Text>
                </View>
              </TouchableOpacity>
            )}
            {profilePicture && (
              <TouchableOpacity style={gSt.photoMenuItem} onPress={handleRemove} activeOpacity={0.75}>
                <View style={[gSt.photoMenuIcon, { backgroundColor: RED_BG }]}>
                  <Ionicons name="trash-outline" size={20} color={RED_TEXT} />
                </View>
                <View>
                  <Text style={[gSt.photoMenuLabel, { color: RED_TEXT }]}>Remove Photo</Text>
                  <Text style={gSt.photoMenuSub}>Revert to default avatar</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={gSt.photoMenuCancel} onPress={() => setShowImageMenu(false)}>
              <Text style={gSt.photoMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Toast ── */}
      <Animated.View pointerEvents="none" style={[gSt.toast, { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }]}>
        <Ionicons name="checkmark-circle" size={20} color={WHITE} />
        <Text style={gSt.toastTxt}>{toastMsg}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const gSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  centerContainer: { padding: 30, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 24, paddingBottom: 40, maxWidth: 1200, marginHorizontal: 'auto', width: '100%' },

  // Header Card
  headerCard: { backgroundColor: WHITE, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: BLUE, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE, zIndex: 10 },
  hospitalTitle: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  hospitalSub: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  badgeRowMobile: { gap: 4 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  // shared pill base
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  pillTxt: { fontSize: 11, fontWeight: '600' },
  blueBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_LIGHT, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  blueBadgeTxt: { color: BLUE, fontSize: 11, fontWeight: '700' },
  greenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_LIGHT, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#6EE7B7" },
  greenBadgeTxt: { color: "#065F46", fontSize: 11, fontWeight: '700' },
  grayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  grayBadgeTxt: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '600' },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#BBF7D0' },
  completeBadgeTxt: { color: '#15803D', fontSize: 11, fontWeight: '700' },
  incompleteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A' },
  incompleteBadgeTxt: { color: '#B45309', fontSize: 11, fontWeight: '700' },
  outlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: GREEN_LIGHT },
  outlineBadgeTxt: { color: GREEN, fontSize: 11, fontWeight: '600' },
  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  editBtnTxt: { color: WHITE, fontSize: 13, fontWeight: '600' },
  outlineBtn: { borderWidth: 1, borderColor: BLUE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statsRowMobile: { flexWrap: 'wrap' },
  statCard: { flex: 1, backgroundColor: WHITE, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  // ✅ FIX: removed `flex: 'none'` — invalid in React Native (flex only accepts numbers)
  statCardMobile: { width: '47%' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 2 },
  statLabel: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 10 },
  progressBarBg: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },

  // Section Cards
  sectionCard: { backgroundColor: WHITE, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: BORDER, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  viewAllTxt: { fontSize: 13, color: BLUE, fontWeight: '600' },
  plusBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },

  // Depts
  deptMainRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  deptMainBox: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16 },
  deptIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deptMainTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 6 },
  deptMainSub: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
  deptTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  deptMiniBox: { flex: 1, minWidth: 150, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16 },
  deptMiniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deptMiniTitle: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },

  // Table
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 12, marginBottom: 8 },
  thText: { fontSize: 11, fontWeight: '700', color: TEXT_SECONDARY, letterSpacing: 0.5 },

  // Edit Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  keyboardView: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  modalBox: { width: 500, maxHeight: '90%', backgroundColor: WHITE, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalBoxMobile: { width: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  modalScroll: { flexShrink: 1, width: '100%' },
  modalAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  modalAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E2E8F0' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: BLUE, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: WHITE },
  changePhotoTxt: { color: BLUE, fontSize: 13, fontWeight: '600' },
  phoneInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 8, backgroundColor: WHITE, overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F8FAFC', color: TEXT_SECONDARY, fontWeight: '600', borderRightWidth: 1, borderRightColor: BORDER },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 14, color: TEXT_PRIMARY },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 20 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  modalCancelTxt: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  modalSave: { flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: BLUE, alignItems: 'center' },
  modalSaveTxt: { color: WHITE, fontSize: 14, fontWeight: '700' },

  // Toast
  toast: { position: "absolute", bottom: 36, left: 20, right: 20, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10, elevation: 10 },
  toastTxt: { fontSize: 14, color: WHITE, fontWeight: "600" },

  // Photo Menu Modal
  photoMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  photoMenuBox: { backgroundColor: WHITE, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  photoMenuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  photoMenuTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  photoPreviewWrap: { alignItems: 'center', marginBottom: 20 },
  photoPreview: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: BORDER },
  photoMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  photoMenuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  photoMenuLabel: { fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY },
  photoMenuSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  photoMenuCancel: { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  photoMenuCancelText: { fontSize: 15, fontWeight: '600', color: TEXT_SECONDARY },
});

export default Profile;
