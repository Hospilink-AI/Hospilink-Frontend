import RatingSummary, { Stars } from "@/component/rating/RatingSummary";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, roleLabel } from "@/constant/jobs";
import { profileAPI, reviewAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

// Hospital's own rating and the staff reviews about it.
export default function HospitalRatingScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await profileAPI.getMyProfile();
      const p = me?.profile ?? {};
      setProfile(p);
      const id = p.id ?? p._id;
      if (id) {
        const res = await reviewAPI.getForHospital(id);
        setReviews(res?.reviews ?? []);
      }
    } catch (err: any) {
      setError(apiError(err, "Could not load your rating."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <Text style={styles.title}>Ratings & Reviews</Text>
      <Text style={styles.subtitle}>How staff rate working with your hospital.</Text>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}

      {!loading && !!error && (
        <View style={styles.state}>
          <Text style={[styles.muted, { color: COLORS.red }]}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your rating</Text>
            <RatingSummary
              effectiveRating={profile?.effectiveRating}
              averageRating={profile?.averageRating}
              totalRatings={profile?.totalRatings}
              breakdown={profile?.ratingBreakdown}
            />
          </View>

          <Text style={styles.sectionTitle}>Reviews from staff</Text>
          <Text style={styles.muted}>
            A review shows up once you've both reviewed that shift, or 14 days after the shift, whichever comes first.
          </Text>

          {reviews.length === 0 ? (
            <View style={[styles.card, styles.empty]}>
              <Ionicons name="chatbox-ellipses-outline" size={30} color={COLORS.subText} />
              <Text style={styles.muted}>No reviews to show yet.</Text>
            </View>
          ) : (
            reviews.map((r) => (
              <View key={r._id} style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{r.medicalStaff?.fullName ?? "Staff member"}</Text>
                    <Text style={styles.muted}>
                      {r.medicalStaff?.jobRole ? roleLabel(r.medicalStaff.jobRole) : "Staff"}
                      {r.duty?.date ? ` · Shift on ${formatDate(r.duty.date)}` : ""}
                    </Text>
                  </View>
                  <Stars value={r.rating} size={15} />
                </View>
                {!!r.review && <Text style={styles.body}>{r.review}</Text>}
                <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 10, maxWidth: 820, width: "100%", alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8 },
  empty: { alignItems: "center", paddingVertical: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  date: { fontSize: 11, color: COLORS.subText },
  state: { alignItems: "center", gap: 10, paddingVertical: 40 },
  retry: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700" },
});
