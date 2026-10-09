import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import RatingSummary, { Stars } from "@/component/rating/RatingSummary";
import { formatDate, roleLabel } from "@/constant/jobs";
import { profileAPI, reviewAPI } from "@/service/api";
import PersonActions from "@/component/safety/PersonActions";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PREVIEW = 3;

// Ratings & Reviews card shown inside the hospital's and the doctor's own profile.
export default function RatingSection({ role }: { role: "hospital" | "staff" }) {
  const styles = useStylesThemed();
  const th = useTheme();
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
        <ActivityIndicator color={th.c.primary} style={{ alignSelf: "flex-start" }} />
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

const make_styles = (t: Theme) => ({
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 18 : 14, borderWidth: 1, borderColor: t.c.border, padding: 18, gap: 8, marginBottom: 16 },
  title: { fontSize: 16, ...t.f("700"), color: t.c.text },
  subTitle: { fontSize: 14, ...t.f("700"), color: t.c.text },
  muted: { ...t.f(), fontSize: 12, color: t.c.subText, lineHeight: 18 },
  small: { ...t.f(), fontSize: 12, color: t.c.subText },
  divider: { height: 1, backgroundColor: t.c.border, marginVertical: 4 },
  review: { borderTopWidth: 1, borderTopColor: t.hex("#F1F5F9"), paddingTop: 10, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 13, ...t.f("700"), color: t.c.text },
  body: { ...t.f(), fontSize: 13, color: t.c.text, lineHeight: 19 },
  link: { fontSize: 13, ...t.f("600"), color: t.c.primary, marginTop: 4 },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
