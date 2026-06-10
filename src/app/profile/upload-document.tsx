
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { documentAPI, profileAPI } from "../../service/api";

// ── Sub-type options shown when "Registration Certificate" is tapped
const REGISTRATION_SUBTYPES = [
  {
    key: "nabh-certificate",
    label: "NABH Certificate",
    desc: "National Accreditation Board for Hospitals & Healthcare",
    icon: "ribbon-outline" as const,
  },
  {
    key: "rohini-certificate",
    label: "Rohini Certificate",
    desc: "Rohini Classification & Accreditation Certificate",
    icon: "shield-checkmark-outline" as const,
  },
  {
    key: "cghs-certificate",
    label: "CGHS Certificate",
    desc: "Central Government Health Scheme Empanelment",
    icon: "medical-outline" as const,
  },
];

// ── Document definition
interface DocumentItem {
  id: string;
  name: string;
  key: string;                // matches the API field name
  optional: boolean;
  status: "not_uploaded" | "pending" | "verified" | "auto_verified" | "rejected";
  fileUri?: string;
  fileName?: string;
  fileUrl?: string;           // remote S3 URL from API
  apiId?: string;             // database document ID used for deletion
}

const DOCUMENTS: DocumentItem[] = [
  { id: "1", name: "Aadhaar Card", key: "aadhaar-card", optional: false, status: "not_uploaded" },
  { id: "2", name: "PAN Card", key: "pan-card", optional: false, status: "not_uploaded" },
  { id: "3", name: "Registration Certificate", key: "registration-certificate", optional: false, status: "not_uploaded" },
  { id: "4", name: "CIN Certificate", key: "cin-certificate", optional: false, status: "not_uploaded" },
  { id: "5", name: "GST Certificate", key: "gst-certificate", optional: false, status: "not_uploaded" },
];

// ── Map API verificationStatus → local status
const API_STATUS_MAP: Record<string, DocumentItem["status"]> = {
  "verified": "verified",
  "auto-verified": "auto_verified",
  "auto_verified": "auto_verified",
  "rejected": "rejected",
  "manual-pending-verification": "pending",
  "pending": "pending",
};

// ── Map API documentType → local document ID
// Registration subtypes all map to row id "3"
const DOC_TYPE_TO_ID: Record<string, string> = {
  "aadhaar-card": "1",
  "pan-card": "2",
  "nabh-certificate": "3",
  "rohini-certificate": "3",
  "cghs-certificate": "3",
  "cin-certificate": "4",
  "gst-certificate": "5",
};

const STATUS_CONFIG = {
  not_uploaded: { label: "", color: "transparent", textColor: "transparent", dot: "transparent", icon: null },
  pending: { label: "Pending", color: "#FEF3C7", textColor: "#92400E", dot: "#F59E0B", icon: "time-outline" },
  verified: { label: "Verified", color: "#D1FAE5", textColor: "#065F46", dot: "#10B981", icon: "checkmark-circle-outline" },
  auto_verified: { label: "Auto Verified", color: "#DBEAFE", textColor: "#1E40AF", dot: "#3B82F6", icon: "shield-checkmark-outline" },
  rejected: { label: "Rejected", color: "#FEE2E2", textColor: "#991B1B", dot: "#EF4444", icon: "close-circle-outline" },
};

export default function DocumentUpload() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>(DOCUMENTS);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Registration cert-type picker modal state
  const [certPicker, setCertPicker] = useState<{
    visible: boolean;
    docId: string;
  }>({ visible: false, docId: "" });

  // ── Document viewer modal state
  const [docViewer, setDocViewer] = useState<{
    visible: boolean;
    url: string;
    name: string;
    imgError: boolean;
  }>({ visible: false, url: "", name: "", imgError: false });

  // ────────────────────────────────────────────────────────────
  // Load already-uploaded documents from API on mount
  // ────────────────────────────────────────────────────────────
  // const loadDocuments = async () => {
  //   try {
  //     // const data = await profileAPI.getMyProfile();
  //     // const apiDocs: any[] = data?.documents ?? [];
  //     const data = await documentAPI.getDocument();
  //     const apiDocs: any[] = data?.documents ?? [];

  //     if (!apiDocs.length) return;

  //     setDocuments((prev) => {
  //       const updated = [...prev];

  //       apiDocs.forEach((apiDoc) => {
  //         const docId = DOC_TYPE_TO_ID[apiDoc.documentType];
  //         if (!docId) return;

  //         const idx = updated.findIndex((d) => d.id === docId);
  //         if (idx === -1) return;

  //         const mappedStatus: DocumentItem["status"] =
  //           API_STATUS_MAP[apiDoc.verificationStatus] ?? "pending";

  //         // For registration certificate row: if already set, keep the more favourable status
  //         if (docId === "3" && updated[idx].status !== "not_uploaded") {
  //           const priority: Record<DocumentItem["status"], number> = {
  //             not_uploaded: 0, rejected: 1, pending: 2, auto_verified: 3, verified: 4,
  //           };
  //           if (priority[mappedStatus] <= priority[updated[idx].status]) return;
  //         }

  //         updated[idx] = {
  //           ...updated[idx],
  //           status: mappedStatus,
  //           fileUrl: apiDoc.url ?? undefined,
  //           fileName: apiDoc.fileName ?? undefined,
  //           key: apiDoc.documentType,    // keep actual subtype key for registration cert
  //           // apiId:    apiDoc.id ?? undefined, // store DB id for delete
  //           apiId: apiDoc.documentId ?? undefined,
  //         };
  //       });

  //       return updated;
  //     });
  //   } catch (err) {
  //     console.warn("Could not load profile documents:", err);
  //   } finally {
  //     setProfileLoading(false);
  //   }
  // };

  const loadDocuments = async () => {
    try {
      const data = await documentAPI.getDocuments();
      const apiDocs: any[] = data?.documents ?? [];

      if (!apiDocs.length) return;

      setDocuments((prev) => {
        const updated = [...prev];

        apiDocs.forEach((apiDoc) => {
          const docId = DOC_TYPE_TO_ID[apiDoc.documentType];
          if (!docId) return;

          const idx = updated.findIndex((d) => d.id === docId);
          if (idx === -1) return;

          const mappedStatus: DocumentItem["status"] =
            API_STATUS_MAP[apiDoc.verificationStatus] ?? "pending";

          if (docId === "3" && updated[idx].status !== "not_uploaded") {
            const priority: Record<DocumentItem["status"], number> = {
              not_uploaded: 0, rejected: 1, pending: 2, auto_verified: 3, verified: 4,
            };
            if (priority[mappedStatus] <= priority[updated[idx].status]) return;
          }

          updated[idx] = {
            ...updated[idx],
            status: mappedStatus,
            fileUrl: apiDoc.url ?? undefined,
            fileName: apiDoc.fileName ?? undefined,
            key: apiDoc.documentType,
            apiId: apiDoc.documentId ?? undefined,
          };
        });

        return updated;
      });
    } catch (err) {
      console.warn("Could not load profile documents:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // ── All 5 must be uploaded to proceed
  const allRequiredDone = documents.every((d) => d.status !== "not_uploaded");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  // ── Core file-pick + upload (used after cert subtype is resolved)
  const pickAndUpload = async (doc: DocumentItem, apiKey: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      setUploading(doc.id);

      const mimeType: string =
        (file as any).mimeType ??
        (file.uri.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

      await documentAPI.uploadDocument(apiKey, file.uri, mimeType);

      // Optimistically mark as pending with local URI
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: "pending", fileUri: file.uri, fileName: file.name, key: apiKey }
            : d
        )
      );

      // Re-fetch profile to get the fresh S3 URL for the viewer
      await loadDocuments();
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      showAlert(
        "Upload Failed",
        err?.response?.data?.message ?? err?.message ?? "Could not upload document.",
      );
    } finally {
      setUploading(null);
    }
  };

  // ────────────────────────────────────────────────────────────
  // Upload handler — if registration-certificate, show cert picker first
  // ────────────────────────────────────────────────────────────
  const handleUpload = (doc: DocumentItem) => {
    if (doc.key === "registration-certificate") {
      setCertPicker({ visible: true, docId: doc.id });
      return;
    }
    const found = documents.find((d) => d.id === doc.id);
    if (found) pickAndUpload(found, found.key);
  };

  // ── Re-upload (replace existing) — for reg cert re-show subtype picker
  const handleReUpload = (doc: DocumentItem) => {
    if (doc.id === "3") {
      setCertPicker({ visible: true, docId: doc.id });
      return;
    }
    handleUpload(doc);
  };

  // ── View — open in-app document viewer modal
  const handleView = (doc: DocumentItem) => {
    const url = doc.fileUrl ?? doc.fileUri ?? "";
    if (!url) {
      showAlert("Document", `No file available for: ${doc.name}`);
      return;
    }
    setDocViewer({ visible: true, url, name: doc.name, imgError: false });
  };

  // ── Delete — confirm then call API, reset row to not_uploaded
  const handleDelete = (doc: DocumentItem) => {
    if (!doc.apiId) {
      showAlert("Error", "Document ID not found. Please refresh and try again.");
      return;
    }

    const doDelete = async () => {
      setDeleting(doc.id);
      try {
        await documentAPI.deleteDocument(doc.apiId!);
        // Reset to original blank definition
        const original = DOCUMENTS.find((d) => d.id === doc.id)!;
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...original } : d))
        );
      } catch (err: any) {
        showAlert(
          "Delete Failed",
          err?.response?.data?.message ?? err?.message ?? "Could not delete document.",
        );
      } finally {
        setDeleting(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${doc.name}"?\n\nThis action cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Document",
        `Are you sure you want to delete "${doc.name}"?\n\nThis action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  // ── Open document in external browser / app
  const openExternal = (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url).catch(() =>
        showAlert("Error", "Could not open the document.")
      );
    }
  };

  // ── Progress counts
  const uploadedCount = documents.filter((d) => d.status !== "not_uploaded").length;
  const progressPct = Math.round((uploadedCount / documents.length) * 100);

return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Fixed Top Header ── */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.appBarLogo}>
            <Ionicons name="pulse" size={20} color="#fff" />
          </View>
          <Text style={styles.appBarTitle}>Hospilink</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >

      {/* ── Header Card ── */}
      <View style={[styles.headerCard, isMobile && styles.headerCardMobile]}>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <Text style={styles.headerSub}>
          Upload your hospital credentials for verification. All 5 documents are required.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {profileLoading ? "Loading…" : `${uploadedCount}/${documents.length} uploaded`}
          </Text>
        </View>
      </View>

      {/* ── Loading row for initial fetch ── */}
      {profileLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your documents…</Text>
        </View>
      )}

      {/* ── Required Documents Card ── */}
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        <View style={styles.sectionHeader}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark" size={14} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Credential &amp; Compliance</Text>
            <Text style={styles.sectionSub}>Required for account activation</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={[styles.tableHeader, isMobile && styles.tableHeaderMobile]}>
          <Text style={[styles.colHeader, { flex: 1 }]}>DOCUMENT NAME</Text>
          <Text style={[styles.colHeader, styles.colStatus]}>STATUS</Text>
          <Text style={[styles.colHeader, styles.colActions]}>ACTIONS</Text>
        </View>

        <View style={styles.divider} />

        {documents.map((doc, index) => (
          <DocRow
            key={doc.id}
            doc={doc}
            isUploading={uploading === doc.id}
            isDeleting={deleting === doc.id}
            isMobile={isMobile}
            isLast={index === documents.length - 1}
            onUpload={() => handleUpload(doc)}
            onReUpload={() => handleReUpload(doc)}
            onView={() => handleView(doc)}
            onDelete={() => handleDelete(doc)}
          />
        ))}
      </View>

      {/* ── Note if required docs not done ── */}
      {!allRequiredDone && !profileLoading && (
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={15} color="#f59e0b" />
          <Text style={styles.noteText}>
            Please upload all 5 required documents to proceed.
          </Text>
        </View>
      )}

      {/* ── Bottom Button ── */}
      <TouchableOpacity
        style={[styles.exploreBtn, !allRequiredDone && styles.exploreBtnDisabled]}
        activeOpacity={allRequiredDone ? 0.85 : 1}
        onPress={() => {
          if (!allRequiredDone) {
            showAlert(
              "Required Documents Missing",
              "Please upload all 5 documents (Aadhaar Card, PAN Card, Registration Certificate, CIN Certificate, and GST Certificate) before proceeding.",
            );
            return;
          }
          router.replace("/hospital/dashboard");
        }}
      >
        <Text style={[styles.exploreBtnText, !allRequiredDone && styles.exploreBtnTextDisabled]}>
          Explore HospiLink
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={allRequiredDone ? "#fff" : "#94a3b8"}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* ── Secure Footer ── */}
      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={11} color="#94a3b8" />
        <Text style={styles.secureText}>  SECURE HEALTH DATA ENVIRONMENT</Text>
      </View>

      {/* ══════════════════════════════════════════════════════
          Registration cert-type picker modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        visible={certPicker.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCertPicker({ visible: false, docId: "" })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCertPicker({ visible: false, docId: "" })}
        >
          {/* Stop tap-through on the sheet itself */}
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="documents-outline" size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Registration Type</Text>
                <Text style={styles.modalSub}>
                  Choose which registration certificate you want to upload.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCertPicker({ visible: false, docId: "" })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Options */}
            {REGISTRATION_SUBTYPES.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.certOption,
                  idx < REGISTRATION_SUBTYPES.length - 1 && styles.certOptionBorder,
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  const docId = certPicker.docId;
                  setCertPicker({ visible: false, docId: "" });
                  // Small delay so modal closes before file picker opens (iOS)
                  setTimeout(() => {
                    const found = documents.find((d) => d.id === docId);
                    if (found) pickAndUpload(found, opt.key);
                  }, 200);
                }}
              >
                <View style={styles.certOptionIcon}>
                  <Ionicons name={opt.icon} size={18} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certOptionLabel}>{opt.label}</Text>
                  <Text style={styles.certOptionDesc}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCertPicker({ visible: false, docId: "" })}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          Document Viewer Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        visible={docViewer.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocViewer((s) => ({ ...s, visible: false }))}
      >
        <View style={styles.viewerOverlay}>
          <View style={[styles.viewerSheet, isMobile && styles.viewerSheetMobile]}>

            {/* Viewer Header */}
            <View style={styles.viewerHeader}>
              <View style={styles.viewerHeaderLeft}>
                <View style={styles.viewerIconWrap}>
                  <Ionicons name="document-text" size={18} color="#2563eb" />
                </View>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {docViewer.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDocViewer((s) => ({ ...s, visible: false }))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.viewerCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Document Preview */}
            <View style={styles.viewerBody}>
              {!docViewer.imgError ? (
                <Image
                  source={{ uri: docViewer.url }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                  onError={() => setDocViewer((s) => ({ ...s, imgError: true }))}
                />
              ) : (
                /* PDF or failed image — show placeholder */
                <View style={styles.viewerFallback}>
                  <Ionicons name="document-outline" size={56} color="#cbd5e1" />
                  <Text style={styles.viewerFallbackTitle}>Preview unavailable</Text>
                  <Text style={styles.viewerFallbackSub}>
                    This document type cannot be previewed inline.{"\n"}Open it in your browser instead.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalDivider} />

            {/* Viewer Footer Actions */}
            <View style={styles.viewerFooter}>
              <TouchableOpacity
                style={styles.viewerOpenBtn}
                activeOpacity={0.8}
                onPress={() => openExternal(docViewer.url)}
              >
                <Ionicons name="open-outline" size={15} color="#fff" />
                <Text style={styles.viewerOpenBtnText}>Open in Browser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerCancelBtn}
                activeOpacity={0.7}
                onPress={() => setDocViewer((s) => ({ ...s, visible: false }))}
              >
                <Text style={styles.viewerCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// DocRow — extracted for clarity
// ─────────────────────────────────────────────────────────────────
interface DocRowProps {
  doc: DocumentItem;
  isUploading: boolean;
  isDeleting: boolean;
  isMobile: boolean;
  isLast: boolean;
  onUpload: () => void;
  onReUpload: () => void;
  onView: () => void;
  onDelete: () => void;
}

function DocRow({ doc, isUploading, isDeleting, isMobile, isLast, onUpload, onReUpload, onView, onDelete }: DocRowProps) {
  const uploaded = doc.status !== "not_uploaded";
  const cfg = STATUS_CONFIG[doc.status];
  const isBusy = isUploading || isDeleting;

  return (
    <View>
      <View style={[styles.row, isMobile && styles.rowMobile]}>

        {/* ── Doc Name ── */}
        <View style={styles.docNameWrap}>
          <View style={[styles.docIconWrap, uploaded && styles.docIconWrapUploaded]}>
            <Ionicons
              name={uploaded ? "document-text" : "document-text-outline"}
              size={16}
              color={uploaded ? "#2563eb" : "#94a3b8"}
            />
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.docName, isMobile && styles.docNameMobile]}>
                {doc.name}
              </Text>
              {doc.optional && (
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              )}
            </View>
            {/* Status shown below name on mobile */}
            {isMobile && uploaded && (
              <View style={[styles.statusBadge, { backgroundColor: cfg.color, marginTop: 4 }]}>
                <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                <Text style={[styles.statusText, { color: cfg.textColor }]}>{cfg.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Status (desktop) ── */}
        {!isMobile && (
          <View style={styles.colStatusWrap}>
            {uploaded ? (
              <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
                <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                <Text style={[styles.statusText, { color: cfg.textColor }]}>{cfg.label}</Text>
              </View>
            ) : (
              <Text style={styles.notUploadedText}>—</Text>
            )}
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.colActionsWrap}>
          {isBusy ? (
            <ActivityIndicator size="small" color={isDeleting ? "#ef4444" : "#2563eb"} />
          ) : uploaded ? (
            <View style={styles.actionGroup}>
              <TouchableOpacity onPress={onView} activeOpacity={0.7} style={styles.actionBtn}>
                <Ionicons name="eye-outline" size={14} color="#2563eb" />
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity onPress={onReUpload} activeOpacity={0.7} style={styles.reUploadBtn}>
                <Ionicons name="refresh-outline" size={13} color="#64748b" />
              </TouchableOpacity> */}
              <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={13} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={onUpload} activeOpacity={0.75}>
              <Ionicons name="cloud-upload-outline" size={14} color="#475569" />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isLast && <View style={styles.rowDivider} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollWrapper: { flex: 1, backgroundColor: "#eef2f7" },
  scrollContent: { alignItems: "center", padding: 24, paddingBottom: 48, gap: 16 },
  scrollContentMobile: { padding: 16, gap: 14 },

  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logoBox: { width: 36, height: 36, backgroundColor: "#2563eb", borderRadius: 9, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText: { color: "#0f172a", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },

  // Header Card
  headerCard: {
    width: "100%", maxWidth: 860,
    backgroundColor: "#fff",
    borderRadius: 14, padding: 24,
    borderWidth: 1, borderColor: "#e2e8f0",
    ...Platform.select({ web: { boxShadow: "0 2px 12px rgba(100,140,200,0.10)" } as any, default: { elevation: 2 } }),
  },
  headerCardMobile: { padding: 18 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  headerSub: { fontSize: 13, color: "#64748b", marginBottom: 16 },

  progressWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#e2e8f0", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 10 },
  progressLabel: { fontSize: 12, color: "#64748b", fontWeight: "600", minWidth: 90, textAlign: "right" },

  safeArea: { flex: 1, backgroundColor: "#fff" },

  appBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(15,23,42,0.04)" } as any,
      default: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    }),
  },
  appBarLeft:  { flexDirection: "row", alignItems: "center" },
  appBarLogo:  { width: 40, height: 40, borderRadius: 11, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  appBarTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B", marginLeft: 12 },

  // Loading row
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 13, color: "#64748b" },

  // Main Card
  card: {
    width: "100%", maxWidth: 860,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1, borderColor: "#c5d1e0",
    overflow: "hidden",
    ...Platform.select({ web: { boxShadow: "0 2px 12px rgba(100,140,200,0.10)" } as any, default: { elevation: 2 } }),
  },
  cardMobile: { borderRadius: 12 },

  // Section Header
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  shieldIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  sectionSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },

  // Table
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#fafbfc" },
  tableHeaderMobile: { paddingHorizontal: 16 },
  colHeader: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8 },
  colStatus: { width: 130, textAlign: "center" },
  colActions: { width: 130, textAlign: "right" },

  divider: { height: 1, backgroundColor: "#f1f5f9" },
  rowDivider: { height: 1, backgroundColor: "#f8fafc", marginHorizontal: 20 },

  // Row
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  rowMobile: { paddingHorizontal: 16, paddingVertical: 12 },

  docNameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  docIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  docIconWrapUploaded: { backgroundColor: "#eff6ff" },
  docName: { fontSize: 14, color: "#1e293b", fontWeight: "500" },
  docNameMobile: { fontSize: 13 },

  optionalBadge: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  optionalBadgeText: { fontSize: 10, color: "#16a34a", fontWeight: "600" },

  colStatusWrap: { width: 130, alignItems: "center" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  notUploadedText: { color: "#cbd5e1", fontSize: 14 },

  colActionsWrap: { width: 130, alignItems: "flex-end" },
  actionGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewBtnText: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  reUploadBtn: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: "#fee2e2", backgroundColor: "#fff5f5", alignItems: "center", justifyContent: "center" },

  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  uploadBtnText: { fontSize: 13, color: "#475569", fontWeight: "500" },

  // Note
  noteRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#fffbeb", borderRadius: 8, borderWidth: 1, borderColor: "#fde68a", paddingHorizontal: 12, paddingVertical: 10, width: "100%", maxWidth: 860 },
  noteText: { fontSize: 13, color: "#92400e", flex: 1 },

  // Bottom Button
  exploreBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 13, paddingHorizontal: 40,
    borderRadius: 10, minWidth: 220,
    justifyContent: "center",
    marginTop: 4,
    ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.28)" } as any, default: { elevation: 4 } }),
  },
  exploreBtnDisabled: { backgroundColor: "#e2e8f0" },
  exploreBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  exploreBtnTextDisabled: { color: "#94a3b8" },

  secureRow: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 4 },
  secureText: { color: "#94a3b8", fontSize: 11, letterSpacing: 1.2 },

  // ── Cert-picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 20px 60px rgba(15,23,42,0.20)" } as any,
      default: { elevation: 20 },
    }),
  },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 20, paddingBottom: 16 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  modalSub: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  modalDivider: { height: 1, backgroundColor: "#f1f5f9" },

  certOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  certOptionBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  certOptionIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center", justifyContent: "center",
  },
  certOptionLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  certOptionDesc: { fontSize: 12, color: "#64748b" },

  cancelBtn: {
    margin: 16,
    marginTop: 4,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#64748b" },

  // ── Document viewer modal
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.60)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  viewerSheet: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "88%",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 24px 60px rgba(15,23,42,0.25)" } as any,
      default: { elevation: 24 },
    }),
  },
  viewerSheetMobile: {
    maxWidth: "100%",
    maxHeight: "92%",
    borderRadius: 14,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingHorizontal: 20,
  },
  viewerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  viewerIconWrap: {
    width: 36, height: 36,
    borderRadius: 9,
    backgroundColor: "#eff6ff",
    alignItems: "center", justifyContent: "center",
  },
  viewerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  viewerCloseBtn: {
    width: 32, height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  viewerBody: {
    flex: 1,
    minHeight: 320,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: 400,
  },
  viewerFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  viewerFallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  viewerFallbackSub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  viewerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    paddingHorizontal: 20,
  },
  viewerOpenBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    borderRadius: 9,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(37,99,235,0.25)" } as any,
      default: { elevation: 3 },
    }),
  },
  viewerOpenBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  viewerCancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  viewerCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
});