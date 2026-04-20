import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface JobItem {
  _id: string;
  role: string;
  hospital_name: string;
  location: string;
  job_description: string;
  posted_date?: string | null;
  apply_link: string;
  emails: string[];
  phones: string[];
  whatsapp?: string | null;
  outreach_status: string;
  ranking_score: number;
  confidence_score: number;
}

interface Props {
  job: JobItem;
}

// Derive tags from API data
function getJobTags(job: JobItem) {
  const tags = [];
  if (job.outreach_status === "partial" || job.emails.length > 0 || job.phones.length > 0) {
    tags.push({ label: "DIRECT CONTACT", color: "#059669", bg: "#D1FAE5" });
  } else {
    tags.push({ label: "APPLY ONLINE", color: COLORS.primary, bg: "#EEF8FA" });
  }
  if (job.confidence_score >= 75) {
    tags.push({ label: "HIGH MATCH", color: "#7C3AED", bg: "#EDE9FE" });
  }
  return tags;
}

export default function VacancyJobCard({ job }: Props) {
  const [saved, setSaved] = useState(false);
  const tags = getJobTags(job);

  const handleApply = () => {
    if (job.apply_link) Linking.openURL(job.apply_link);
  };

  // Clean up hospital name (sometimes duplicated like "X, X")
  const hospitalName = job.hospital_name.includes(",")
    ? job.hospital_name.split(",")[0].trim()
    : job.hospital_name;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.hospitalIcon}>
          <Ionicons name="medical-outline" size={20} color={COLORS.subText} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{job.role}</Text>
          </View>
          <Text style={styles.hospital} numberOfLines={1}>
            {hospitalName}
            <Text style={styles.dot}>  •  </Text>
            {job.location}
          </Text>

          {/* Tags row */}
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag.label} style={[styles.tag, { backgroundColor: tag.bg }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <InfoItem icon="location-outline" text={job.location} />
        {job.posted_date && (
          <InfoItem icon="time-outline" text={job.posted_date} />
        )}
        <InfoItem
          icon="speedometer-outline"
          text={"Score: " + job.ranking_score}
        />
      </View>

      {/* Contact info if available */}
      {(job.emails.length > 0 || job.phones.length > 0 || job.whatsapp) && (
        <View style={styles.contactRow}>
          {job.emails.slice(0, 1).map((email) => (
            <TouchableOpacity
              key={email}
              style={styles.contactChip}
              onPress={() => Linking.openURL("mailto:" + email)}
            >
              <Ionicons name="mail-outline" size={12} color={COLORS.primary} />
              <Text style={styles.contactText} numberOfLines={1}>{email}</Text>
            </TouchableOpacity>
          ))}
          {job.phones.slice(0, 1).map((phone) => (
            <TouchableOpacity
              key={phone}
              style={styles.contactChip}
              onPress={() => Linking.openURL("tel:" + phone)}
            >
              <Ionicons name="call-outline" size={12} color={COLORS.primary} />
              <Text style={styles.contactText}>{phone}</Text>
            </TouchableOpacity>
          ))}
          {job.whatsapp && (
            <TouchableOpacity
              style={[styles.contactChip, styles.whatsappChip]}
              onPress={() => Linking.openURL("https://wa.me/" + job.whatsapp?.replace(/[^0-9]/g, ""))}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#25D366" />
              <Text style={[styles.contactText, { color: "#25D366" }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.divider} />

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.applyText}>Apply Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.savedBtn]}
          onPress={() => setSaved(!saved)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={16}
            color={saved ? COLORS.primary : COLORS.subText}
          />
          <Text style={[styles.saveText, saved && styles.savedText]}>
            {saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={13} color={COLORS.subText} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header:      { flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: 12 },
  hospitalIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  titleRow:    { marginBottom: 4 },
  title:       { fontSize: 15, fontWeight: "700", color: COLORS.text, lineHeight: 20 },
  hospital:    { fontSize: 13, color: COLORS.subText, marginBottom: 6 },
  dot:         { color: COLORS.border },
  tags:        { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText:     { fontSize: 10, fontWeight: "700" },

  infoRow:    { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 10 },
  infoItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText:   { fontSize: 12, color: "#475569" },

  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  contactChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EEF8FA",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    maxWidth: 200,
  },
  whatsappChip: { backgroundColor: "#F0FFF4", borderColor: "#BBF7D0" },
  contactText: { fontSize: 11, color: COLORS.primary, fontWeight: "500" },

  divider:  { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  buttons:  { flexDirection: "row", gap: 12, alignItems: "center" },
  applyBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  applyText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  savedBtn:   { borderColor: COLORS.primary, backgroundColor: "#EEF8FA" },
  saveText:   { fontSize: 13, color: COLORS.subText, fontWeight: "500" },
  savedText:  { color: COLORS.primary, fontWeight: "600" },
});