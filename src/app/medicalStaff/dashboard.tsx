import ActionCard from "@/component/cards/medicalStaff/ActionCard";
import DutyCard from "@/component/cards/medicalStaff/Dashboard/DutyCard";
import OngoingDutyCard from "@/component/cards/medicalStaff/Dashboard/OngoingDutyCard";
import StatsCard from "@/component/cards/medicalStaff/Dashboard/StatsCard";
import UpcomingDutyCard from "@/component/cards/medicalStaff/Dashboard/UpcomingDutyCard";
import { useDashboardLocationTracking } from '@/hooks/useDashboardLocationTracking';
import Toast from "@/component/common/Toast";
import ToggleSwitch from "@/component/common/ToggleSwitch";
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { dutyAPI, profileAPI } from "../../service/api";

interface Duty {
  _id: string;
  id: string;
  title: string;
  hospitalId?: string;
  hospital: string;
  assignedTo?: string;
  distance: string;
  time: string;
  price: string;
  date: string;
  tag?: string;
  staffRole?: string;
  urgency?: string;
  startTime?: string;
  endTime?: string;

  totalPayment?: number;
  status?: string;
}

export default function Dashboard() {
  const [toast, setToast] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    completedDutiesCount: 0,
    averagePerDuty: "0.0",
    growth: { percent: 0, trend: "neutral", label: "+0%" },
  });
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [upcomingDuties, setUpcomingDuties] = useState<Duty[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [ongoingDuties, setOngoingDuties] = useState<Duty[]>([]);
  const [ongoingLoading, setOngoingLoading] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingGrowth, setRatingGrowth] = useState({
    percent: 0, trend: "neutral", label: "+0%"
  });


  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const availableDutiesRef = useRef<View>(null);

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const visibleDuties = showAll ? duties : duties.slice(0, 2);

  // Get active duty (first ongoing duty)
  const activeDuty = ongoingDuties.length > 0 ? ongoingDuties[0] : null;

  // Inside the Dashboard component, after other hooks
  const { permissionGranted } = useDashboardLocationTracking();


  // Calculate progress based on status
  const getProgress = (status: string | undefined) => {
    switch (status) {
      case 'assigned':
        return { percent: 10, label: '10% Complete' };
      case 'enroute':
        return { percent: 50, label: '50% Complete' };
      case 'in-progress':
        return { percent: 75, label: '75% Complete' };
      default:
        return { percent: 0, label: '0% Complete' };
    }
  };

  const progress = activeDuty ? getProgress(activeDuty.status) : { percent: 0, label: 'No Active Duty' };

  const handleFindDuties = () => {
    setShowAll(true);
    setTimeout(() => {
      availableDutiesRef.current?.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({ y: pageY - 80, animated: true });
      });
    }, 100);
  };



  // const checkLocationPermission = async () => {
  //   try {
  //     if (Platform.OS === 'web') {
  //       const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });

  //       if (permissionStatus?.state === 'granted') {
  //         navigator.geolocation.getCurrentPosition(
  //           async (position) => {
  //             await profileAPI.sendDashboardLocationPermission(
  //               true,
  //               position.coords.latitude as unknown as null,
  //               position.coords.longitude as unknown as null
  //             );
  //           },
  //           async () => {
  //             await profileAPI.sendDashboardLocationPermission(false);
  //           },
  //           { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  //         );
  //         return;
  //       }

  //       if (permissionStatus?.state === 'denied') {
  //         await profileAPI.sendDashboardLocationPermission(false);
  //         return;
  //       }

  //       if (permissionStatus?.state === 'prompt') {
  //         navigator.geolocation.getCurrentPosition(
  //           async (position) => {
  //             await profileAPI.sendDashboardLocationPermission(
  //               true,
  //               position.coords.latitude as unknown as null,
  //               position.coords.longitude as unknown as null
  //             );
  //           },
  //           async () => {
  //             await profileAPI.sendDashboardLocationPermission(false);
  //           },
  //           { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     await profileAPI.sendDashboardLocationPermission(false);
  //   }
  // };

  const handleAccept = useCallback(async () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    await fetchAvailableDuties();
    await fetchUpcomingDuties();
  }, []);

  const refreshDuties = () => {
    fetchUpcomingDuties();
    fetchOngoingDuties();
  };

  const handlePressDuty = (id: string) => {
    if (!id) return;
    router.push(`/medicalStaff/dutyDetails/${id}` as any);
  };

  const handleToggleAvailability = async () => {
    const newValue = !available;
    setAvailable(newValue);
    setToggling(true);
    try {
      await profileAPI.toggleMedicalStaffAvailability(newValue);
    } catch (err: any) {
      setAvailable(!newValue);
    } finally {
      setToggling(false);
    }
  };



  const fetchAvailableDuties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dutyAPI.getAvailableDuties();
      const transformedDuties = (response.jobs || []).map((job: any) => ({
        _id: job._id,
        id: job._id,
        title: job.staffRole?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Medical Duty',
        hospital: job.hospital?.hospitalLegalName || 'Hospital',
        distance: job.distanceText || `${job.distance} km`,
        time: `${job.startTime} - ${job.endTime}`,
        price: `₹${job.totalPayment}`,
        date: new Date(job.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        tag: job.urgency?.toUpperCase() || 'MEDIUM'
      }));
      setDuties(transformedDuties);
      setTotalJobs(response.totalJobs || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load duties");
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    setEarningsLoading(true);
    try {
      const response = await profileAPI.getEarnings();
      if (response.success && response.data) {
        console.log(response.data)
        // setEarnings(response.data);
        setEarnings({
          totalEarnings: response.data.totalEarnings,
          completedDutiesCount: response.data.completedDutiesCount,
          averagePerDuty: response.data.averagePerDuty,
          growth: response.data.growth,
        });
      }
    } catch (err: any) {
    } finally {
      setEarningsLoading(false);
    }
  };

  const fetchDashboardOverview = async () => {
    try {
      const response = await profileAPI.getStaffOverview();
      setAverageRating(response.data?.profile?.averageRating || 0);
      setRatingGrowth(response.data?.growth || { percent: 0, trend: "neutral", label: "+0%" });
    } catch (err) {
    }
  };

  const fetchUpcomingDuties = async () => {
    setUpcomingLoading(true);
    try {
      const response = await dutyAPI.getMyUpcomingDuties();
      const transformedDuties = (response.data || [])
        .filter((job: any) => job.status === 'assigned')
        .map((job: any) => ({
          _id: job._id,
          id: job._id,
          title: job.formattedRole || "Medical Duty",
          hospital: job.hospital?.hospitalLegalName || "Hospital",
          time: `${job.startTime || "N/A"} - ${job.endTime || "N/A"}`,
          price: `₹${job.totalPayment || 0}`,
          date: new Date(job.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: job.status,
          distanceText: job.distanceText || `${job.distance} km` || "N/A",
        }));
      setUpcomingDuties(transformedDuties);
    } catch (err: any) {
    } finally {
      setUpcomingLoading(false);
    }
  };

  const fetchAvailabilityStatus = async () => {
    setAvailabilityLoading(true);
    try {
      const response = await profileAPI.getMyProfile();
      setAvailable(response.profile?.isAvailable ?? false);
    } catch (err) {
      setAvailable(false);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchOngoingDuties = async () => {
    setOngoingLoading(true);
    try {
      const res = await dutyAPI.getOngoingDuties();
      const transformed = (res.data || [])
        .filter((job: any) => job.status === 'enroute' || job.status === 'in-progress')
        .map((job: any) => ({
          _id: job._id,
          id: job._id,
          title: job.formattedRole || "Medical Duty",
          hospital: job.hospital?.hospitalLegalName || "Hospital",
          hospitalId: job.hospital?.user?._id,
          time: `${job.startTime || "N/A"} - ${job.endTime || "N/A"}`,
          assignedTo: job.assignedTo,
          price: `₹${job.totalPayment || 0}`,
          date: new Date(job.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: job.status,
        }));
      setOngoingDuties(transformed);
    } catch (err) {
    } finally {
      setOngoingLoading(false);
    }
  };

  // useEffect(() => {
  //   checkLocationPermission();
  // }, []);

  useEffect(() => {
    if (available) {
      fetchAvailableDuties();
    } else {
      setTotalJobs(0);
    }
  }, [available]);

  useEffect(() => {
    fetchAvailabilityStatus();
    fetchEarnings();
    fetchDashboardOverview();
    fetchUpcomingDuties();
    fetchOngoingDuties();
  }, []);



  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      showsVerticalScrollIndicator={false}
    >
      {toast && <Toast message="Duty Accepted Successfully!" />}

      {activeDuty ? (
        <View style={styles.activeDutyCard}>
          <View style={styles.activeDutyTop}>
            <View style={styles.activeDutyLeft}>
              <View style={styles.activeDutyIconWrap}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.activeDutyLabel}>ACTIVE DUTY</Text>
                {/* <Text style={styles.activeDutyTitle}>
                  {activeDuty.title} at {activeDuty.hospital}
                </Text> */}
                <Text style={styles.activeDutyTitle} numberOfLines={2} ellipsizeMode="tail">
                  {activeDuty.title} at {activeDuty.hospital}
                </Text>
              </View>
            </View>
            <View style={styles.activeDutyRight}>
              <Text style={styles.activeDutyPercent}>{progress.label}</Text>
              <Text style={styles.activeDutySep}>  |  </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
          </View>
        </View>
      ) : (
        <View style={styles.noActiveDutyCard}>
          <View style={styles.noActiveDutyContent}>
            <Ionicons name="briefcase-outline" size={24} color={COLORS.subText} />
            <View>
              <Text style={styles.noActiveDutyTitle}>No Active Duty</Text>
              <Text style={styles.noActiveDutySub}>Accept a duty to start tracking</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.availableBanner, !available && styles.unavailableBanner]}>
        <View style={styles.availableLeft}>
          <View style={[styles.availableDot, { backgroundColor: available ? COLORS.green : COLORS.red }]} />
          <View>
            <Text style={styles.availableTitle}>
              {available ? "Available" : "Unavailable"}
            </Text>
            <Text style={styles.availableSub}>
              {available
                ? "Ready to receive new clinical duties"
                : "You won't receive duty requests"}
            </Text>
          </View>
        </View>
        {toggling
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : <ToggleSwitch enabled={available ?? false} onToggle={handleToggleAvailability} />
        }
      </View>

      <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
        <StatsCard
          icon="cash-outline"
          value={earningsLoading ? "..." : `₹ ${earnings.totalEarnings.toLocaleString()}`}
          label="Total Earnings"
          trend={earnings.growth.label}
          trendUp={earnings.growth.trend === "up"}
          isMobile={isMobile}
        />
        <StatsCard
          icon="briefcase-outline"
          value={earningsLoading ? "..." : earnings.completedDutiesCount.toString()}
          label="Duties Completed"
          isMobile={isMobile}
        />
        <StatsCard
          icon="calendar-outline"
          value={totalJobs.toString()}
          label="Available Duties"
          isMobile={isMobile}
        />
        <StatsCard
          icon="star-outline"
          value={averageRating.toString()}
          label="Avg. Rating"
          trend={ratingGrowth.label}
          trendUp={ratingGrowth.trend === "up"}
          isMobile={isMobile}
        />
      </View>

      {available ? (
        <>
          <View style={styles.sectionHeader} ref={availableDutiesRef} collapsable={false}>
            <Text style={styles.sectionTitle}>Available Duties</Text>
            {!showAll && duties.length > 2 && (
              <TouchableOpacity onPress={() => setShowAll(true)} activeOpacity={0.7}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading available duties...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableDuties}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && (
            <>
              {duties.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="briefcase-outline" size={36} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Available Duties</Text>
                  <Text style={styles.emptySub}>Check back later for new opportunities</Text>
                </View>
              ) : (
                <View style={[styles.dutiesGrid, isMobile && styles.dutiesGridMobile]}>
                  {visibleDuties.map((duty) => (
                    <DutyCard
                      key={duty._id || duty.id}
                      duty={duty}
                      onAccept={handleAccept}
                      onPress={() => handlePressDuty(duty._id || duty.id)}
                      isMobile={isMobile}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </>
      ) : (
        <View style={styles.unavailableEmpty}>
          <Ionicons name="moon-outline" size={36} color="#94a3b8" />
          <Text style={styles.unavailableEmptyTitle}>You're Currently Unavailable</Text>
          <Text style={styles.unavailableEmptySub}>
            Toggle availability above to start receiving duty requests.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Duties</Text>
      </View>

      {upcomingLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading upcoming duties...</Text>
        </View>
      ) : upcomingDuties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={36} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Upcoming Duties</Text>
          <Text style={styles.emptySub}>Check back later for upcoming opportunities</Text>
        </View>
      ) : (
        <View style={[styles.dutiesGrid, isMobile && styles.dutiesGridMobile]}>
          {upcomingDuties.map((duty) => (
            <UpcomingDutyCard
              key={duty._id}
              duty={duty}
              isMobile={isMobile}
              onPress={() => handlePressDuty(duty._id)}
              onStatusChange={refreshDuties}
            />
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ongoing Duties</Text>
      </View>

      {ongoingLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading ongoing duties...</Text>
        </View>
      ) : ongoingDuties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={36} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Ongoing Duties</Text>
          <Text style={styles.emptySub}>Check back later for ongoing opportunities</Text>
        </View>
      ) : (
        <View style={[styles.dutiesGrid, isMobile && styles.dutiesGridMobile]}>
          {ongoingDuties.map((duty) => (
            <OngoingDutyCard
              key={duty._id}
              duty={duty}
              isMobile={isMobile}
              onPress={handlePressDuty}
              onStatusChange={refreshDuties}
            />
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <ActionCard
          icon="search-outline"
          label="Find Duties"
          iconBg="#EEF2FF"
          isMobile={isMobile}
          onPress={handleFindDuties}
        />
        <ActionCard
          icon="document-text-outline"
          label="My Documents"
          iconBg="#D1FAE5"
          isMobile={isMobile}
          onPress={() => router.push("/medicalStaff/profile")}
        />
        <ActionCard
          icon="help-circle-outline"
          label="Support Center"
          iconBg="#FEF3C7"
          isMobile={isMobile}
          onPress={() => router.push("/medicalStaff/support")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile: { padding: 16, gap: 16 },
  activeDutyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  activeDutyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  activeDutyLeft: { flexDirection: "row", alignItems: "flex-start", gap: 11, flex: 1, minWidth: 0 },
  activeDutyIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  activeDutyLabel: { fontSize: 11, color: COLORS.subText, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 },
  activeDutyTitle: { fontSize: 12, fontWeight: "600", color: COLORS.text, flexShrink: 0.9,lineHeight: 18,  },
  activeDutyRight: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  activeDutyPercent: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  activeDutySep: { color: COLORS.border, fontSize: 12 },
  activeDutyTime: { fontSize: 12, color: COLORS.subText, fontWeight: "500" },
  progressTrack: { height: 8, backgroundColor: "#EEF2FF", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },
  noActiveDutyCard: {
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
  noActiveDutyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noActiveDutyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  noActiveDutySub: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  availableBanner: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#BBF7D0" },
  unavailableBanner: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  availableLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  availableDot: { width: 10, height: 10, borderRadius: 5 },
  availableTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  availableSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  statsRowMobile: { gap: 10, justifyContent: "space-between" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  viewAll: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  dutiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  dutiesGridMobile: { flexDirection: "column" },
  unavailableEmpty: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  unavailableEmptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  unavailableEmptySub: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingHorizontal: 24 },
  loadingContainer: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.subText, marginTop: 8 },
  errorContainer: { alignItems: "center", paddingVertical: 30, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.red, gap: 10 },
  errorText: { fontSize: 14, color: COLORS.red, textAlign: "center", paddingHorizontal: 20 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingHorizontal: 24 },
  actionsRow: { flexDirection: "row", gap: 14, marginTop: 4 },
});
