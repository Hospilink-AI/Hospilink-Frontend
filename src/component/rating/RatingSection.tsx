import RatingSummary, { Stars } from "@/component/rating/RatingSummary";
import { COLORS } from "@/constant/colors";
import { formatDate, roleLabel } from "@/constant/jobs";
import { profileAPI, reviewAPI } from "@/service/api";
import PersonActions from "@/component/safety/PersonActions";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PREVIEW = 3;

// Ratings & Reviews card shown inside the hospital's and the doctor's own profile.
export default function RatingSection({ role }: { role: "hospital" | "staff" }) {
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await profileAPI.getMyProfile();
        const p = me?.profile ?? {};
        if (!active) return;
        setProfile(p);
        const id = p.id ?? p._id;
        if (id) {
          const res = role === "hospital" ? await reviewAPI.getForHospital(id) : await reviewAPI.getForStaff(id);
          if (active) setReviews(res?.reviews ?? []);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [role]);

  const from = role === "hospital" ? "staff" : "hospitals";
  const shown = showAll ? reviews : reviews.slice(0, PREVIEW);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ratings & Reviews</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ alignSelf: "flex-start" }} />
      ) : failed ? (
        <Text style={styles.muted}>Couldn't load your rating right now.</Text>
      ) : (
        <>
          <RatingSummary
            effectiveRating={profile?.effectiveRating}
            averageRating={profile?.averageRating}
            totalRatings={profile?.totalRatings}
            breakdown={profile?.ratingBreakdown}
            override={profile?.ratingOverride}
          />

          <View style={styles.divider} />
          <Text style={styles.subTitle}>Reviews from {from}</Text>
          <Text style={styles.muted}>
            A review shows up once you've both reviewed that shift, or 14 days after the shift.
          </Text>

          {reviews.length === 0 ? (
            <Text style={[styles.muted, { marginTop: 4 }]}>No reviews to show yet.</Text>
          ) : (
            shown.map((r) => {
              const who =
                role === "hospital"
                  ? r.medicalStaff?.fullName ?? "Staff member"
                  : r.hospital?.hospitalLegalName ?? "Hospital";
              const sub =
                role === "hospital" && r.medicalStaff?.jobRole ? roleLabel(r.medicalStaff.jobRole) : null;
              return (
                <View key={r._id} style={styles.review}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{who}</Text>
                      <Text style={styles.small}>
                        {[sub, r.duty?.date ? `Shift on ${formatDate(r.duty.date)}` : null].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <Stars value={r.rating} size={14} />
                    {(role === "hospital" ? r.medicalStaff?._id : r.hospital?._id) && (
                      <PersonActions
                        kind={role === "hospital" ? "staff" : "hospital"}
                        id={role === "hospital" ? r.medicalStaff._id : r.hospital._id}
                        name={who}
                        dutyId={r.duty?._id}
                        reviewId={r._id}
                      />
                    )}
                  </View>
                  {!!r.review && <Text style={styles.body}>{r.review}</Text>}
                </View>
              );
            })
          )}
          {reviews.length > PREVIEW && (
            <TouchableOpacity onPress={() => setShowAll(!showAll)}>
              <Text style={styles.link}>{showAll ? "Show fewer" : `Show all ${reviews.length} reviews`}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 8, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  subTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 18 },
  small: { fontSize: 12, color: COLORS.subText },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  review: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  body: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  link: { fontSize: 13, fontWeight: "600", color: COLORS.primary, marginTop: 4 },
});
