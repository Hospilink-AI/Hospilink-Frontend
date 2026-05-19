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
   useWindowDimensions, 
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
  { value: "mcim-certificate",         label: "MCIM Certificate",                 group: "Education"    },
  { value: "ncim-certificate",         label: "NCIM Certificate",                 group: "Education"    },
  { value: "license-permit",           label: "License / Permit",                 group: "Licensing"    },
  { value: "resume-experience",        label: "Resume / Experience",              group: "Experience"   },
  { value: "recommendation-letter",    label: "Recommendation Letter (Optional)", group: "Experience"   },
];

const GROUPS = ["Identity", "Education", "Licensing", "Experience", "Registration"];

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "Verified" | "Pending" | "Expired" | "Auto Verified" | "Manual Review";

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
  "Verified":      { bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  "Auto Verified": { bg: "#D1FAE5", text: "#15803D", dot: "#15803D" },
  "Pending":       { bg: "#FEF9C3", text: "#CA8A04", dot: "#CA8A04" },
  "Manual Review": { bg: "#DBEAFE", text: "#2563EB", dot: "#2563EB" },
  "Expired":       { bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
};

// ─── API Mappers ──────────────────────────────────────────────────────────────

function mapVerificationStatus(status: string): DocStatus {
  switch (status) {
    case "verified":                    return "Verified";
    case "auto-verified":               return "Auto Verified";
    case "manual-pending-verification": return "Manual Review";
    case "expired":                     return "Expired";
    case "pending":
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
//  VIEW DOCUMENT MODAL (CENTERED)
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={vms.overlay}>
        <View style={vms.modalCard}>

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

// ═══════════════════════════════════════════════════════════════════════════════
//  UPLOAD MODAL (CENTERED)
// ═══════════════════════════════════════════════════════════════════════════════

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    docType: DocTypeOption,
    uri: string,
    fileType: CredentialDoc["fileType"],
    mimeType?: string
  ) => Promise<void>;
}

function UploadModal({ visible, onClose, onSubmit }: UploadModalProps) {
  const [selectedType, setSelectedType] = useState<DocTypeOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<CredentialDoc["fileType"]>("other");
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState<string | undefined>(undefined);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ type: false, file: false });

  function resetAll() {
    setSelectedType(null);
    setDropdownOpen(false);
    setPreviewUri(null);
    setPreviewFileType("other");
    setPreviewFileName("");
    setPreviewMimeType(undefined);
    setUploading(false);
    setSubmitting(false);
    setErrors({ type: false, file: false });
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  function validate() {
    const newErrors = {
      type: !selectedType,
      file: !previewUri,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).includes(true);
  }

  async function pickDocument() {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setPreviewFileName(asset.name);
        setPreviewFileType(fileExtToType(asset.name));
        setPreviewMimeType(asset.mimeType ?? "image/jpeg");
        setErrors((prev) => ({ ...prev, file: false }));
      }
    } catch {
      Alert.alert("Error", "Could not open document picker.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSubmit(selectedType!, previewUri!, previewFileType, previewMimeType);
      resetAll();
    } catch {
      Alert.alert("Upload Failed", "Could not upload document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={cm.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%", alignItems: "center" }}
        >
          <Pressable style={cm.modalCard} onPress={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <View style={cm.header}>
              <Text style={cm.title}>Upload Document</Text>
              <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              
              {/* Document Type Dropdown */}
              <Text style={cm.label}>DOCUMENT TYPE <Text style={cm.req}>*</Text></Text>
              <View style={{ zIndex: 10 }}>
                <TouchableOpacity
                  style={[cm.input, cm.dropdownTrigger, errors.type && cm.inputError]}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={selectedType ? cm.dropVal : cm.dropPlaceholder}>
                    {selectedType ? selectedType.label : "Select document type"}
                  </Text>
                  <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={cm.dropList}>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {GROUPS.map((group) => (
                        <View key={group}>
                          <Text style={cm.groupLabel}>{group.toUpperCase()}</Text>
                          {DOCUMENT_TYPES.filter((d) => d.group === group).map((item) => {
                            const sel = selectedType?.value === item.value;
                            return (
                              <TouchableOpacity
                                key={item.value}
                                style={[cm.dropItem, sel && cm.dropItemSel]}
                                onPress={() => {
                                  setSelectedType(item);
                                  setDropdownOpen(false);
                                  setErrors((prev) => ({ ...prev, type: false }));
                                }}
                              >
                                <Text style={[cm.dropItemText, sel && cm.dropItemTextSel]}>{item.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Upload Area */}
              <Text style={[cm.label, { marginTop: dropdownOpen ? 10 : 14 }]}>
                DOCUMENT FILE <Text style={cm.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={[cm.uploadArea, errors.file && cm.inputError]}
                onPress={pickDocument}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : previewUri ? (
                  <View style={cm.previewContainer}>
                    {previewFileType === "image" ? (
                      <Image source={{ uri: previewUri }} style={cm.previewImageThumb} resizeMode="cover" />
                    ) : (
                      <Ionicons name="document-text" size={32} color="#9CA3AF" />
                    )}
                    <Text style={cm.previewName} numberOfLines={1}>{previewFileName}</Text>
                    <Text style={cm.changeText}>Tap to change</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="arrow-up-outline" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                    <Text style={cm.uploadAreaText}>Upload your document</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={[cm.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={cm.submitBtnText}>Upload</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
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

const { width } = useWindowDimensions();
const isMobile = width < 600;

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
  colLabel:   { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.4 },
  col:        { paddingRight: 8 },
  colName:    { flex: 3 },
  colStatus:  { flex: 1.7 },
  colDate:    { flex: 2.2 },
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
  docName:    { fontSize: 12, fontWeight: "600", color: COLORS.text },
  docSub:     { fontSize: 10, color: COLORS.subText, marginTop: 2 },
  pill: {
    flexDirection: "row", alignItems: "center",
    gap: 5, paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 20, alignSelf: "flex-start",
  },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  pillText:   { fontSize: 10, fontWeight: "700" },
  dateText:   { fontSize: 11, color: COLORS.subText },
  actionsRow: { flexDirection: "row", gap: 5, justifyContent: "flex-end" },
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

// ─── Modal Styles (Centered UI) ─────────────────────────────────────────────

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 14,
  },
  req: {
    color: "#3B82F6",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1F2937",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropPlaceholder: { color: "#9CA3AF", fontSize: 13 },
  dropVal: { color: "#1F2937", fontSize: 13 },
  dropList: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: "#F8FAFC",
  },
  dropItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  dropItemSel: { backgroundColor: "#EFF6FF" },
  dropItemText: { fontSize: 13, color: "#1F2937" },
  dropItemTextSel: { fontWeight: "600", color: "#3B82F6" },
  uploadArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  uploadAreaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  previewContainer: {
    alignItems: "center",
    width: "100%",
  },
  previewImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    maxWidth: "80%",
  },
  changeText: {
    fontSize: 11,
    color: "#3B82F6",
  },
  submitBtn: {
    backgroundColor: "#EFF6FF", 
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "700",
  },
});

const vms = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalCard:     { backgroundColor: "#fff", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, maxHeight: "85%" },
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