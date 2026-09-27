import RatingSummary from "@/component/rating/RatingSummary";
import RatingOverride from "@/component/rating/RatingOverride";
import { COLORS } from "@/constant/colors";
import { apiError, roleLabel } from "@/constant/jobs";
import { adminAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type PeekTarget = { kind: "hospital" | "staff"; profileId: string } | null;

// Quick look at a hospital or doctor involved in a ticket, without leaving the case page.
export default function ProfilePeek({ target, onClose }: { target: PeekTarget; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    let active = true;
    setData(null);
    setError(null);
    setLoading(true);
    (target.kind === "hospital" ? adminAPI.getHospitalById(target.profileId) : adminAPI.getMedicalStaffById(target.profileId))
      .then((res: any) => active && setData(res?.data ?? res))
      .catch((err: any) => active && setError(apiError(err, "Could not load this profile.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [target]);

  const isHospital = target?.kind === "hospital";
  const name = isHospital ? data?.hospitalLegalName : data?.fullName;
  const place = [data?.city, data?.state].filter(Boolean).join(", ");
  const verification = data?.verificationStatus ? String(data.verificationStatus) : "—";
  const status = data?.isSuspended ? "Suspended" : verification.charAt(0).toUpperCase() + verification.slice(1);

  const openFull = () => {
    onClose();
    router.push((isHospital ? "/admin/hospital-management" : "/admin/medical-staff") as any);
  };

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name={isHospital ? "business-outline" : "person-outline"} size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{isHospital ? "Hospital" : "Medical staff"}</Text>
              <Text style={styles.name} numberOfLines={2}>{name ?? (loading ? "Loading…" : "—")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={COLORS.subText} />
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}
          {!!error && <Text style={styles.error}>{error}</Text>}

          {!!data && (
            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10 }}>
              <View style={styles.grid}>
                {!isHospital && <Field label="Role" value={data.jobRole ? roleLabel(data.jobRole) : "—"} />}
                <Field label="Location" value={place || "—"} />
                <Field label="Status" value={status} danger={!!data.isSuspended} />
                {isHospital ? (
                  <Field label="Staff count" value={data.staffCount != null ? String(data.staffCount) : "—"} />
                ) : (
                  <Field label="Completed duties" value={data.completedDuties != null ? String(data.completedDuties) : "—"} />
                )}
                {!isHospital && <Field label="Phone" value={data.phoneNumber ?? "—"} />}
                {!isHospital && <Field label="Email" value={data.email ?? "—"} />}
              </View>
              {!!data.suspensionReason && data.isSuspended && (
                <Text style={styles.warn}>Suspended: {data.suspensionReason}</Text>
              )}
              <View style={styles.ratingBox}>
                <Text style={styles.label}>Rating</Text>
                <RatingSummary
                  viewer="admin"
                  effectiveRating={data.effectiveRating}
                  averageRating={data.averageRating}
                  totalRatings={data.totalRatings}
                  breakdown={data.ratingBreakdown}
                />
                <RatingOverride
                  kind={isHospital ? "hospital" : "staff"}
                  profileId={target!.profileId}
                  name={name}
                  current={data.totalRatings ? data.effectiveRating : null}
                />
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.fullBtn} onPress={openFull}>
            <Text style={styles.fullText}>Open {isHospital ? "Hospital Management" : "Medical Staff"}</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, danger && { color: COLORS.red }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  box: { width: "100%", maxWidth: 520, backgroundColor: COLORS.white, borderRadius: 14, padding: 18, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "700", color: COLORS.subText, textTransform: "uppercase", letterSpacing: 0.5 },
  name: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 10 },
  field: { width: "50%", paddingRight: 8, gap: 2 },
  label: { fontSize: 11, fontWeight: "700", color: COLORS.subText },
  value: { fontSize: 13, color: COLORS.text },
  ratingBox: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, gap: 6 },
  warn: { fontSize: 12, color: COLORS.red },
  error: { fontSize: 13, color: COLORS.red },
  fullBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  fullText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
