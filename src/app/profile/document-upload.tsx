import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface DocumentItem {
  id: string;
  name: string;
  key: string;
  status: "not_uploaded" | "pending" | "verified" | "auto_verified" | "rejected";
  fileUri?: string;
  fileName?: string;
}

const DOCUMENTS: DocumentItem[] = [
  { id: "1", name: "Aadhar Card",          key: "aadhaar-card",         status: "not_uploaded" },
  { id: "2", name: "Pan Card",             key: "pan-card",             status: "not_uploaded" },
  { id: "3", name: "Medical Certificate",  key: "medical-certificate",  status: "not_uploaded" },
  { id: "4", name: "Medical License",      key: "medical-license",      status: "not_uploaded" },
  { id: "5", name: "Resume",               key: "resume",               status: "not_uploaded" },
  { id: "6", name: "Recommendation Letter",key: "recommendation-letter",status: "not_uploaded" },
];

const STATUS_CONFIG = {
  not_uploaded:  { label: "",              color: "transparent", textColor: "transparent", dot: "transparent" },
  pending:       { label: "Pending",       color: "#FEF3C7",     textColor: "#92400E",     dot: "#F59E0B" },
  verified:      { label: "Verified",      color: "#D1FAE5",     textColor: "#065F46",     dot: "#10B981" },
  auto_verified: { label: "Auto Verified", color: "#DBEAFE",     textColor: "#1E40AF",     dot: "#3B82F6" },
  rejected:      { label: "Rejected",      color: "#FEE2E2",     textColor: "#991B1B",     dot: "#EF4444" },
};

export default function DocumentUpload() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const router   = useRouter();

  const [documents, setDocuments]   = useState<DocumentItem[]>(DOCUMENTS);
  const [uploading, setUploading]   = useState<string | null>(null);

  const hasAnyUploaded = documents.some((d) => d.status !== "not_uploaded");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleUpload = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) return;

      setUploading(docId);

      // Simulate upload delay
      await new Promise((res) => setTimeout(res, 1500));

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "pending", fileUri: file.uri, fileName: file.name }
            : d
        )
      );
    } catch (err: any) {
      showAlert("Upload Failed", err?.message || "Could not upload document.");
    } finally {
      setUploading(null);
    }
  };

  const handleView = (doc: DocumentItem) => {
    showAlert("Document", `Viewing: ${doc.fileName || doc.name}`);
  };

  return (
    <ScrollView
      style={styles.scrollWrapper}
      contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Card ── */}
      <View style={[styles.headerCard, isMobile && styles.headerCardMobile]}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <Text style={styles.headerSub}>Help us personalize your experience as a medical professional.</Text>
      </View>

      {/* ── Documents Card ── */}
      <View style={[styles.card, isMobile && styles.cardMobile]}>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark" size={14} color="#2563eb" />
          </View>
          <Text style={styles.sectionTitle}>Credential &amp; Compliance</Text>
        </View>

        {/* Table Header */}
        <View style={[styles.tableHeader, isMobile && styles.tableHeaderMobile]}>
          <Text style={[styles.colHeader, { flex: 1 }]}>DOCUMENT NAME</Text>
          {hasAnyUploaded && !isMobile && (
            <Text style={[styles.colHeader, styles.colStatus]}>STATUS</Text>
          )}
          <Text style={[styles.colHeader, styles.colActions]}>ACTIONS</Text>
        </View>

        <View style={styles.divider} />

        {/* Rows */}
        {documents.map((doc, index) => {
          const isUploading = uploading === doc.id;
          const cfg         = STATUS_CONFIG[doc.status];
          const uploaded    = doc.status !== "not_uploaded";

          return (
            <View key={doc.id}>
              <View style={[styles.row, isMobile && styles.rowMobile]}>

                {/* Doc Name */}
                <View style={styles.docNameWrap}>
                  <Ionicons name="document-text-outline" size={16} color="#64748b" />
                  <Text style={[styles.docName, isMobile && styles.docNameMobile]}>
                    {doc.name}
                  </Text>
                </View>

                {/* Status — desktop only in table col, mobile below name */}
                {isMobile ? (
                  uploaded ? (
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color, marginLeft: 24, marginTop: 4 }]}>
                      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[styles.statusText, { color: cfg.textColor }]}>{cfg.label}</Text>
                    </View>
                  ) : null
                ) : (
                  hasAnyUploaded && (
                    <View style={styles.colStatusWrap}>
                      {uploaded && (
                        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
                          <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                          <Text style={[styles.statusText, { color: cfg.textColor }]}>{cfg.label}</Text>
                        </View>
                      )}
                    </View>
                  )
                )}

                {/* Action */}
                <View style={styles.colActionsWrap}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : uploaded ? (
                    <TouchableOpacity onPress={() => handleView(doc)} activeOpacity={0.7}>
                      <Text style={styles.viewBtn}>View</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => handleUpload(doc.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.uploadBtnText}>Upload</Text>
                      <Ionicons name="arrow-up-circle-outline" size={14} color="#475569" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {index < documents.length - 1 && <View style={styles.rowDivider} />}
            </View>
          );
        })}
      </View>

      {/* ── Bottom Button ── */}
      <TouchableOpacity
        style={[styles.exploreBtn, !hasAnyUploaded && styles.exploreBtnDisabled]}
        activeOpacity={0.85}
        onPress={() => router.replace("/medicalStaff/dashboard")}
      >
        <Text style={[styles.exploreBtnText, !hasAnyUploaded && styles.exploreBtnTextDisabled]}>
          Explore Hospilink
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper:        { flex: 1, backgroundColor: "#eef2f7" },
  scrollContent:        { alignItems: "center", padding: 24, paddingBottom: 48, gap: 16 },
  scrollContentMobile:  { padding: 16, gap: 14 },

  // Header Card
  headerCard:           { width: "100%", maxWidth: 860, backgroundColor: "#fff", borderRadius: 14, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", ...Platform.select({ web: { boxShadow: "0 2px 12px rgba(100,140,200,0.10)" }, default: { elevation: 2 } }) },
  headerCardMobile:     { padding: 18 },
  headerTitle:          { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  headerSub:            { fontSize: 13, color: "#64748b" },

  // Main Card
  card:                 { width: "100%", maxWidth: 860, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#c5d1e0", overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 2px 12px rgba(100,140,200,0.10)" }, default: { elevation: 2 } }) },
  cardMobile:           { borderRadius: 12 },

  // Section Header
  sectionHeader:        { flexDirection: "row", alignItems: "center", gap: 8, padding: 18, paddingBottom: 14, borderWidth: 1, borderColor: "#cad2e5", borderRadius: 12, margin: 12 },
  shieldIcon:           { width: 26, height: 26, borderRadius: 6, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  sectionTitle:         { fontSize: 15, fontWeight: "700", color: "#0f172a" },

  // Table
  tableHeader:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10 },
  tableHeaderMobile:    { paddingHorizontal: 16 },
  colHeader:            { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6 },
  colStatus:            { width: 130, textAlign: "center" },
  colActions:           { width: 80, textAlign: "right" },

  divider:              { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 0 },

  // Row
  row:                  { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  rowMobile:            { paddingHorizontal: 16, paddingVertical: 12, flexWrap: "wrap" },
  rowDivider:           { height: 1, backgroundColor: "#f8fafc", marginHorizontal: 20 },

  docNameWrap:          { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  docName:              { fontSize: 14, color: "#1e293b", fontWeight: "500" },
  docNameMobile:        { fontSize: 13 },

  colStatusWrap:        { width: 130, alignItems: "center" },
  statusBadge:          { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusDot:            { width: 6, height: 6, borderRadius: 3 },
  statusText:           { fontSize: 12, fontWeight: "600" },

  colActionsWrap:       { width: 80, alignItems: "flex-end" },
  uploadBtn:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  uploadBtnText:        { fontSize: 13, color: "#475569", fontWeight: "500" },
  viewBtn:              { fontSize: 13, color: "#2563eb", fontWeight: "600" },

  // Bottom Button
  exploreBtn:           { backgroundColor: "#2563eb", paddingVertical: 13, paddingHorizontal: 40, borderRadius: 10, minWidth: 200, alignItems: "center", marginTop: 4, ...Platform.select({ web: { boxShadow: "0 4px 14px rgba(37,99,235,0.28)" }, default: { elevation: 4 } }) },
  exploreBtnDisabled:   { backgroundColor: "#e2e8f0" },
  exploreBtnText:       { color: "#fff", fontSize: 15, fontWeight: "700" },
  exploreBtnTextDisabled: { color: "#94a3b8" },
});