import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { documentAPI } from "../../../../service/api"; 
import { useNavigation } from "@react-navigation/native";


// ─── Document Type Config ─────────────────────────────────────────────────────

interface DocTypeOption {
  value: string;
  label: string;
  group: string;
}

const DOCUMENT_TYPES: DocTypeOption[] = [
  { value: "aadhaar-card",             label: "Aadhaar Card",                     group: "Identity"     },
  { value: "pan-card",                 label: "PAN Card",                         group: "Identity"     },
  { value: "degree-certificate",       label: "Degree Certificate",               group: "Education"    },
  { value: "mcim-certificate",         label: "MCIM Certificate",                 group: "Education"    },
  { value: "ncim-certificate",         label: "NCIM Certificate",                 group: "Education"    },
  { value: "license-permit",           label: "License / Permit",                 group: "Licensing"    },
  { value: "resume-experience",        label: "Resume / Experience",              group: "Experience"   },
  { value: "recommendation-letter",    label: "Recommendation Letter (Optional)", group: "Experience"   },
  { value: "registration-certificate", label: "Registration Certificate",         group: "Registration" },
  { value: "nabh-certificate",         label: "NABH Certificate",                 group: "Registration" },
  { value: "rohini-certificate",       label: "Rohini Certificate",               group: "Registration" },
  { value: "cghs-certificate",         label: "CGHS Certificate",                 group: "Registration" },
];

const GROUPS = ["Identity", "Education", "Licensing", "Experience", "Registration"];

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "Active" | "Pending" | "Expired";

interface CredentialDoc {
  id: string;
  name: string;
  docType: string;
  docTypeLabel: string;
  status: DocStatus;
  lastUpdated: string;
  fileType: "image" | "pdf" | "doc" | "other";
  uri?: string;
  url?: string;      // ← S3 URL from API
  fileName?: string; // ← original file name from API
}

interface Props {
  initialItems?: CredentialDoc[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString("en-IN", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fileExtToType(name: string): CredentialDoc["fileType"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  if (ext === "pdf")                                                  return "pdf";
  if (["doc", "docx"].includes(ext))                                  return "doc";
  return "other";
}

function fileTypeIcon(type: CredentialDoc["fileType"]) {
  switch (type) {
    case "image": return { name: "image-outline" as const,         color: "#7C3AED" };
    case "pdf":   return { name: "document-text-outline" as const, color: "#DC2626" };
    case "doc":   return { name: "document-outline" as const,      color: "#2563EB" };
    default:      return { name: "attach-outline" as const,        color: "#6B7280" };
  }
}

const STATUS_META: Record<DocStatus, { bg: string; text: string; dot: string }> = {
  Active:  { bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  Pending: { bg: "#FEF9C3", text: "#CA8A04", dot: "#CA8A04" },
  Expired: { bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
};

// ─── API Mappers ──────────────────────────────────────────────────────────────

function mapVerificationStatus(status: string): DocStatus {
  switch (status) {
    case "verified":                    return "Active";
    case "expired":                     return "Expired";
    case "pending":
    case "manual-pending-verification":
    default:                            return "Pending";
  }
}

function mapAPIDocument(doc: any): CredentialDoc {
  const typeOption = DOCUMENT_TYPES.find((d) => d.value === doc.documentType);
  const fileName   = doc.fileName ?? "";
  return {
    id:           doc.documentId ?? doc._id ?? Date.now().toString(),
    name:         typeOption?.label ?? doc.documentType ?? "Document",
    docType:      doc.documentType ?? "",
    docTypeLabel: typeOption?.label ?? doc.documentType ?? "",
    status:       mapVerificationStatus(doc.verificationStatus),
    lastUpdated:  new Date(doc.uploadedAt ?? doc.updatedAt).toLocaleDateString("en-IN", {
                    month: "short", day: "numeric", year: "numeric",
                  }),
    fileType:     fileExtToType(fileName),
    uri:          doc.url ?? undefined,
    url:          doc.url ?? undefined,
    fileName:     fileName || undefined,
  };
}

function isImageUrl(fileName?: string, url?: string): boolean {
  const source = fileName ?? url ?? "";
  return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(source);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VIEW DOCUMENT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ViewDocModal({
  visible,
  doc,
  onClose,
  loading,
}: {
  visible: boolean;
  doc: CredentialDoc | null;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={vms.overlay}>
        <View style={vms.sheet}>
          {/* Handle */}
          <View style={vms.handle} />

          {/* Header */}
          <View style={vms.header}>
            <View style={{ flex: 1 }}>
              <Text style={vms.title} numberOfLines={1}>
                {doc?.name ?? "Document"}
              </Text>
              {doc?.docTypeLabel && (
                <Text style={vms.sub} numberOfLines={1}>
                  {doc.docTypeLabel}
                </Text>
              )}
            </View>
            <TouchableOpacity style={vms.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Status strip */}
          {doc && (
            <View style={vms.strip}>
              <View style={[vms.pill, { backgroundColor: STATUS_META[doc.status].bg }]}>
                <View style={[vms.dot, { backgroundColor: STATUS_META[doc.status].dot }]} />
                <Text style={[vms.pillText, { color: STATUS_META[doc.status].text }]}>
                  {doc.status}
                </Text>
              </View>
              <Text style={vms.date}>Updated: {doc.lastUpdated}</Text>
              <Text style={vms.docId}>#{doc.id.slice(-6)}</Text>
            </View>
          )}

          <View style={vms.divider} />

          {/* Preview area */}
          {loading ? (
            <View style={vms.previewBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={vms.hint}>Loading document...</Text>
            </View>
          ) : doc?.url && isImageUrl(doc.fileName, doc.url) ? (
            <View style={vms.previewBox}>
              <Image
                source={{ uri: doc.url }}
                style={vms.image}
                resizeMode="contain"
              />
            </View>
          ) : doc?.url ? (
            <View style={[vms.previewBox, { height: 180 }]}>
              <Ionicons name="document-text-outline" size={52} color="#94A3B8" />
              <Text style={vms.hint}>Preview unavailable for this file type.</Text>
            </View>
          ) : (
            <View style={[vms.previewBox, { height: 180 }]}>
              <Ionicons name="cloud-offline-outline" size={52} color="#94A3B8" />
              <Text style={vms.hint}>No preview available.</Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={vms.closeFullBtn} onPress={onClose}>
            <Text style={vms.closeFullText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const vms = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet:         { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === "ios" ? 38 : 24, maxHeight: "90%" },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  header:        { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  title:         { fontSize: 16, fontWeight: "700", color: COLORS.text },
  sub:           { fontSize: 11, color: COLORS.subText, marginTop: 2 },
  closeBtn:      { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginLeft: 10 },
  strip:         { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  pill:          { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  dot:           { width: 6, height: 6, borderRadius: 3 },
  pillText:      { fontSize: 11, fontWeight: "700" },
  date:          { fontSize: 11, color: COLORS.subText, flex: 1 },
  docId:         { fontSize: 11, color: COLORS.subText, fontWeight: "600" },
  divider:       { height: 1, backgroundColor: "#E5E7EB", marginBottom: 16 },
  previewBox:    { backgroundColor: "#F8FAFC", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", height: 280, marginBottom: 16, overflow: "hidden" },
  image:         { width: "100%", height: "100%" },
  hint:          { fontSize: 13, color: COLORS.subText, marginTop: 10, textAlign: "center" },
  closeFullBtn:  { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeFullText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  UPLOAD MODAL
// ═══════════════════════════════════════════════════════════════════════════════

type ModalStep = "form" | "preview";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  // ✅ No docName — only docType + file needed by API
  onSubmit: (
    docType: DocTypeOption,
    uri: string,
    fileType: CredentialDoc["fileType"],
    mimeType?: string
  ) => Promise<void>;
}

function UploadModal({ visible, onClose, onSubmit }: UploadModalProps) {
  const [step, setStep]                       = useState<ModalStep>("form");
  const [selectedType, setSelectedType]       = useState<DocTypeOption | null>(null);
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const [previewUri, setPreviewUri]           = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<CredentialDoc["fileType"]>("other");
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState<string | undefined>(undefined);
  const [uploading, setUploading]             = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [typeError, setTypeError]             = useState(false);

  function resetAll() {
    setStep("form");
    setSelectedType(null);
    setDropdownOpen(false);
    setPreviewUri(null);
    setPreviewFileType("other");
    setPreviewFileName("");
    setPreviewMimeType(undefined);
    setUploading(false);
    setSubmitting(false);
    setTypeError(false);
  }

  function handleClose() { resetAll(); onClose(); }

  function validate() {
    const tErr = !selectedType;
    setTypeError(tErr);
    return !tErr;
  }

  // ── File picker — images only ────────────────────────────────────────────
  async function pickDocument() {
    if (!validate()) return;
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setPreviewFileName(asset.name);
        setPreviewFileType(fileExtToType(asset.name));
        setPreviewMimeType(asset.mimeType ?? "image/jpeg");
        setStep("preview");
      }
    } catch {
      Alert.alert("Error", "Could not open document picker.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!previewUri || !selectedType) return;
    try {
      setSubmitting(true);
      await onSubmit(selectedType, previewUri, previewFileType, previewMimeType);
      resetAll();
    } catch {
      Alert.alert("Upload Failed", "Could not upload document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={ms.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%" }}
        >
          <Pressable style={ms.sheet} onPress={(e) => e.stopPropagation()}>

            {/* Handle */}
            <View style={ms.handle} />

            {/* Header */}
            <View style={ms.header}>
              {step === "preview" && (
                <TouchableOpacity style={ms.iconBtn} onPress={() => setStep("form")}>
                  <Ionicons name="arrow-back" size={18} color={COLORS.text} />
                </TouchableOpacity>
              )}
              <Text style={ms.title}>
                {step === "form" ? "Add Document" : "Review & Submit"}
              </Text>
              <TouchableOpacity style={ms.iconBtn} onPress={handleClose}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ── STEP 1: Form ── */}
            {step === "form" ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Document Type */}
                <Text style={ms.label}>
                  Document Type <Text style={ms.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    ms.dropTrigger,
                    dropdownOpen && ms.dropTriggerOpen,
                    typeError && ms.dropTriggerError,
                  ]}
                  onPress={() => setDropdownOpen((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={selectedType ? ms.dropVal : ms.dropPlaceholder}>
                    {selectedType ? selectedType.label : "Select document type…"}
                  </Text>
                  <Ionicons
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
                {typeError && (
                  <Text style={ms.errorText}>Please select a document type</Text>
                )}

                {/* Dropdown List */}
                {dropdownOpen && (
                  <View style={ms.dropList}>
                    <ScrollView
                      style={{ maxHeight: 240 }}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {GROUPS.map((group) => (
                        <View key={group}>
                          <Text style={ms.groupLabel}>{group.toUpperCase()}</Text>
                          {DOCUMENT_TYPES.filter((d) => d.group === group).map((item) => {
                            const sel = selectedType?.value === item.value;
                            return (
                              <TouchableOpacity
                                key={item.value}
                                style={[ms.dropItem, sel && ms.dropItemSel]}
                                onPress={() => {
                                  setSelectedType(item);
                                  setDropdownOpen(false);
                                  setTypeError(false);
                                }}
                              >
                                <Text style={[ms.dropItemText, sel && ms.dropItemTextSel]}>
                                  {item.label}
                                </Text>
                                {sel && (
                                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Upload source */}
                <Text style={[ms.label, { marginTop: 22 }]}>Upload Image</Text>
                <TouchableOpacity
                  style={[ms.sourceBtn, uploading && ms.sourceBtnDisabled]}
                  onPress={pickDocument}
                  disabled={uploading}
                  activeOpacity={0.75}
                >
                  <View style={[ms.sourceIcon, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="folder-open-outline" size={22} color="#2563EB" />
                  </View>
                  <Text style={ms.sourceBtnTitle}>Browse Images</Text>
                  <Text style={ms.sourceBtnSub}>JPG, PNG, WEBP supported</Text>
                </TouchableOpacity>

                {uploading && (
                  <View style={ms.uploadingRow}>
                    <Ionicons name="hourglass-outline" size={14} color={COLORS.primary} />
                    <Text style={ms.uploadingText}>Opening picker…</Text>
                  </View>
                )}
              </ScrollView>

            ) : (
              /* ── STEP 2: Preview ── */
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {previewFileType === "image" && previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={ms.previewImg}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={ms.previewFile}>
                    <Ionicons
                      name={fileTypeIcon(previewFileType).name}
                      size={44}
                      color={fileTypeIcon(previewFileType).color}
                    />
                    <Text style={ms.previewFileName} numberOfLines={2}>
                      {previewFileName}
                    </Text>
                  </View>
                )}

                {/* Summary */}
                <View style={ms.summaryBox}>
                  <View style={[ms.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={ms.summaryKey}>Document Type</Text>
                    <Text style={ms.summaryVal} numberOfLines={1}>
                      {selectedType?.label}
                    </Text>
                  </View>
                </View>

                {/* Change file */}
                <TouchableOpacity style={ms.changeBtn} onPress={() => setStep("form")}>
                  <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                  <Text style={ms.changeBtnText}>Change File</Text>
                </TouchableOpacity>

                {/* Submit */}
                <TouchableOpacity
                  style={[ms.submitBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  )}
                  <Text style={ms.submitBtnText}>
                    {submitting ? "Uploading..." : "Submit Document"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN CARD
// ═══════════════════════════════════════════════════════════════════════════════



export default function CredentialComplianceCard({ initialItems = [] }: Props) {
  const navigation = useNavigation(); 
  const [docs, setDocs]                         = useState<CredentialDoc[]>([]);
  const [docsLoading, setDocsLoading]           = useState(true);
  const [docsError, setDocsError]               = useState<string | null>(null);
  const [modalVisible, setModalVisible]         = useState(false);
  const [deleteDoc, setDeleteDoc]               = useState<CredentialDoc | null>(null);
  const [deleting, setDeleting]                 = useState(false);
  const [viewDoc, setViewDoc]                   = useState<CredentialDoc | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewLoading, setViewLoading]           = useState(false);

  // ── Fetch all docs ────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      setDocsLoading(true);
      setDocsError(null);
      const data = await documentAPI.getDocuments();
      if (data?.success) {
        setDocs(
          Array.isArray(data.documents)
            ? data.documents.map(mapAPIDocument)
            : []
        );
      } else {
        setDocs([]);
      }
    } catch (err: any) {
      setDocsError(err?.message ?? "Failed to load documents.");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ── Upload ────────────────────────────────────────────────────────────────
  async function handleSubmit(
    docType: DocTypeOption,
    uri: string,
    fileType: CredentialDoc["fileType"],
    mimeType?: string
  ) {
    const response = await documentAPI.uploadDocument(docType.value, uri, mimeType);

    // Optimistic add with fallback — then refresh for real documentId + url
    const uploaded: CredentialDoc =
      response?.document
        ? mapAPIDocument(response.document)
        : response?.documents?.[0]
          ? mapAPIDocument(response.documents[0])
          : {
              id:           Date.now().toString(),
              name:         docType.label,
              docType:      docType.value,
              docTypeLabel: docType.label,
              status:       "Pending",
              lastUpdated:  today(),
              fileType,
              uri,
            };

    setDocs((prev) => [uploaded, ...prev]);
    fetchDocuments(); 
    setModalVisible(false);
  }

  // ── View (fetch fresh S3 URL) ─────────────────────────────────────────────
  async function handleViewDocument(doc: CredentialDoc) {
    try {
      setViewLoading(true);
      setViewDoc(doc);         // show modal immediately with cached data
      setViewModalVisible(true);
      const data = await documentAPI.getDocument(doc.id);
      if (data?.success && data?.data) {
        setViewDoc(mapAPIDocument(data.data)); // replace with fresh URL
      }
    } catch {
      // keep showing cached doc on error
    } finally {
      setViewLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function executeDelete() {
    if (!deleteDoc) return;
    try {
      setDeleting(true);
      await documentAPI.deleteDocument(deleteDoc.id);
      setDocs((prev) => prev.filter((d) => d.id !== deleteDoc.id));
      setDeleteDoc(null);
    } catch {
      Alert.alert("Error", "Could not delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function handleDeletePress(doc: CredentialDoc) {
    
      setDeleteDoc(doc);
    
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.card}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="shield-half-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Credential &amp; Compliance</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {docsLoading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.subText, marginTop: 8 }}>
            Loading documents...
          </Text>
        </View>

      ) : docsError ? (
        <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
          <Text style={{ fontSize: 13, color: "#DC2626" }}>{docsError}</Text>
          <TouchableOpacity onPress={fetchDocuments}>
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>

      ) : docs.length > 0 ? (
        <>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.col, styles.colName,    styles.colLabel]}>DOCUMENT NAME</Text>
            <Text style={[styles.col, styles.colStatus,  styles.colLabel]}>STATUS</Text>
            <Text style={[styles.col, styles.colDate,    styles.colLabel]}>LAST UPDATED</Text>
            <Text style={[styles.col, styles.colActions, styles.colLabel]}>ACTIONS</Text>
          </View>

          {/* Rows */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {docs.map((doc, idx) => {
              const icon   = fileTypeIcon(doc.fileType);
              const status = STATUS_META[doc.status];
              return (
                <View
                  key={doc.id}
                  style={[styles.row, idx < docs.length - 1 && styles.rowDivider]}
                >
                  {/* Name */}
                  <View style={[styles.col, styles.colName, styles.rowName]}>
                    <View style={[styles.fileIcon, { backgroundColor: icon.color + "18" }]}>
                      <Ionicons name={icon.name} size={16} color={icon.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.docSub} numberOfLines={1}>{doc.docTypeLabel}</Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={[styles.col, styles.colStatus]}>
                    <View style={[styles.pill, { backgroundColor: status.bg }]}>
                      <View style={[styles.dot, { backgroundColor: status.dot }]} />
                      <Text style={[styles.pillText, { color: status.text }]}>
                        {doc.status}
                      </Text>
                    </View>
                  </View>

                  {/* Date */}
                  <Text style={[styles.col, styles.colDate, styles.dateText]}>
                    {doc.lastUpdated}
                  </Text>

                  {/* Actions */}
                  <View style={[styles.col, styles.colActions, styles.actionsRow]}>
                    {/* View */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleViewDocument(doc)}
                    >
                      <Ionicons name="eye-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Delete — direct onPress, confirmation inside handleDeletePress */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDeletePress(doc)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>

      ) : (
        /* Empty state */
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📬</Text>
          <Text style={styles.emptyTitle}>No documents yet.</Text>
          <Text style={styles.emptySub}>Upload your credentials to get started</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.uploadBtnText}>Upload your first document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Modal */}
      <UploadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />

      {/* View Document Modal */}
      <ViewDocModal
        visible={viewModalVisible}
        doc={viewDoc}
        onClose={() => {
          setViewModalVisible(false);
          setViewDoc(null);
        }}
        loading={viewLoading}
      />

      {/* Delete Confirm Modal — only shown on native (Android/iOS) */}
      <Modal
        visible={!!deleteDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDoc(null)}
      >
        <View style={styles.delOverlay}>
          <View style={styles.delModal}>
            <Ionicons
              name="trash-outline"
              size={28}
              color="#EF4444"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.delTitle}>Remove Document?</Text>
            <Text style={styles.delBody}>
              "{deleteDoc?.name}" will be removed from your credentials.
            </Text>
            <View style={styles.delActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteDoc(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
                onPress={executeDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.deleteText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Card Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center", justifyContent: "center",
  },
  title:  { fontSize: 16, fontWeight: "700", color: COLORS.text },
  addBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colLabel:   { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.6 },
  col:        { paddingRight: 8 },
  colName:    { flex: 3 },
  colStatus:  { flex: 2 },
  colDate:    { flex: 2 },
  colActions: { flex: 1, paddingRight: 0 },
  list:       { maxHeight: 340 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  rowName:    { flexDirection: "row", alignItems: "center", gap: 10 },
  fileIcon:   { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  docName:    { fontSize: 13, fontWeight: "600", color: COLORS.text },
  docSub:     { fontSize: 10, color: COLORS.subText, marginTop: 2 },
  pill: {
    flexDirection: "row", alignItems: "center",
    gap: 5, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, alignSelf: "flex-start",
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  pillText:   { fontSize: 11, fontWeight: "700" },
  dateText:   { fontSize: 12, color: COLORS.subText },
  actionsRow: { flexDirection: "row", gap: 6, justifyContent: "flex-end" },
  actionBtn: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  empty:      { alignItems: "center", paddingVertical: 44, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: COLORS.subText, marginBottom: 20, textAlign: "center" },
  uploadBtn:  {
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 24, paddingHorizontal: 24, paddingVertical: 11,
  },
  uploadBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  delOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  delModal: {
    width: 300, backgroundColor: "#fff", borderRadius: 18,
    padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  delTitle:   { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  delBody:    { fontSize: 13, color: COLORS.subText, textAlign: "center", marginBottom: 24 },
  delActions: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", color: COLORS.subText },
  deleteBtn:  { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  deleteText: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    maxHeight: "92%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 8,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.text },
  label:        { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  req:          { color: "#EF4444" },
  errorText:    { fontSize: 11, color: "#EF4444", marginTop: 4, marginLeft: 2 },
  dropTrigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#FAFAFA",
  },
  dropTriggerOpen:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "06" },
  dropTriggerError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  dropPlaceholder:  { fontSize: 14, color: "#9CA3AF" },
  dropVal:          { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  dropList: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    marginTop: 4, backgroundColor: "#fff", overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
  },
  groupLabel: {
    fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
    backgroundColor: "#F8FAFC",
  },
  dropItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F1F5F9",
  },
  dropItemSel:     { backgroundColor: COLORS.primary + "0D" },
  dropItemText:    { fontSize: 13, color: COLORS.text },
  dropItemTextSel: { fontWeight: "600", color: COLORS.primary },
  sourceBtn: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAFA",
    gap: 6,
  },
  sourceBtnDisabled: { opacity: 0.45 },
  sourceIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  sourceBtnTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  sourceBtnSub:   { fontSize: 11, color: COLORS.subText, textAlign: "center" },
  uploadingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 12,
  },
  uploadingText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  previewImg:  { width: "100%", height: 210, borderRadius: 14, marginBottom: 16 },
  previewFile: {
    width: "100%", height: 140, borderRadius: 14, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16,
  },
  previewFileName: {
    fontSize: 13, color: COLORS.text, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 24,
  },
  summaryBox: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, marginBottom: 14, overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  summaryKey: { fontSize: 12, color: COLORS.subText },
  summaryVal: { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 1, textAlign: "right" },
  changeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 11, marginBottom: 12,
  },
  changeBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
