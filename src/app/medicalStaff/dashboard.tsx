// import ActionCard from "@/component/cards/medicalStaff/ActionCard";
// import DutyCard from "@/component/cards/medicalStaff/Dashboard/DutyCard";
// import StatsCard from "@/component/cards/medicalStaff/Dashboard/StatsCard";
// import Toast from "@/component/common/Toast";
// import ToggleSwitch from "@/component/common/ToggleSwitch";
// import { COLORS } from "@/constant/colors";
// import { duties } from "@/data/duties";
// import { Ionicons } from "@expo/vector-icons";
// import { useState } from "react";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useWindowDimensions,
//   View,
// } from "react-native";

// export default function Dashboard() {
//   const [toast, setToast] = useState(false);
//   const [showAll, setShowAll] = useState(false);
//   const [available, setAvailable] = useState(true);



//   const { width } = useWindowDimensions();
//   const isMobile = width < 768;

//   const visibleDuties = showAll ? duties : duties.slice(0, 2);

//   const handleAccept = () => {
//     setToast(true);
//     setTimeout(() => setToast(false), 3000);
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
//       showsVerticalScrollIndicator={false}
//     >
//       {toast && <Toast message="Duty Accepted Successfully!" />}

//       {/* ── Active Duty Banner ───────────────────────────── */}
//       <View style={styles.activeDutyCard}>
//         <View style={styles.activeDutyTop}>
//           <View style={styles.activeDutyLeft}>
//             <View style={styles.activeDutyIconWrap}>
//               <Ionicons name="time-outline" size={18} color={COLORS.primary} />
//             </View>
//             <View>
//               <Text style={styles.activeDutyLabel}>ACTIVE DUTY</Text>
//               <Text style={styles.activeDutyTitle}>
//                 Emergency Nurse at City General Hospital
//               </Text>
//             </View>
//           </View>
//           <View style={styles.activeDutyRight}>
//             <Text style={styles.activeDutyPercent}>65% Complete</Text>
//             <Text style={styles.activeDutySep}>  |  </Text>
//             {/* <Text style={styles.activeDutyTime}>Time Remaining: 2h 45m</Text> */}
//           </View>
//         </View>

//         {/* Progress Bar */}
//         <View style={styles.progressTrack}>
//           <View style={[styles.progressFill, { width: "65%" }]} />
//         </View>
//       </View>

//       {/* ── Available Banner ─────────────────────────────── */}
//       <View style={[styles.availableBanner, !available && styles.unavailableBanner]}>
//         <View style={styles.availableLeft}>
//           <View style={[styles.availableDot, { backgroundColor: available ? COLORS.green : COLORS.red }]} />
//           <View>
//             <Text style={styles.availableTitle}>
//               {available ? "Available" : "Unavailable"}
//             </Text>
//             <Text style={styles.availableSub}>
//               {available
//                 ? "Ready to receive new clinical duties"
//                 : "You won't receive duty requests"}
//             </Text>
//           </View>
//         </View>
//         <ToggleSwitch enabled={available} onToggle={() => setAvailable(!available)} />
//       </View>

//       {/* ── Stats ────────────────────────────────────────── */}
//       <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
//         <StatsCard
//           icon="cash-outline"
//           value="₹ 3,480"
//           label="Total Earnings"
//           trend="12%"
//           trendUp
//           isMobile={isMobile}
//         />
//         <StatsCard
//           icon="briefcase-outline"
//           value="14"
//           label="Duties Completed"
//           isMobile={isMobile}
//         />
//         <StatsCard
//           icon="calendar-outline"
//           value="2"
//           label="Available Duties"
//           isMobile={isMobile}
//         />
//         <StatsCard
//           icon="star-outline"
//           value="4.8"
//           label="Avg. Rating"
//           trend="0.2"
//           trendUp
//           isMobile={isMobile}
//         />
//       </View>

//       {/* ── Nearby Opportunities ─────────────────────────── */}
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>Available Duties</Text>
//         {!showAll && (
//           <TouchableOpacity onPress={() => setShowAll(true)} activeOpacity={0.7}>
//             <Text style={styles.viewAll}>View All</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={[styles.dutiesGrid, isMobile && styles.dutiesGridMobile]}>
//         {visibleDuties.map((duty) => (
//           <DutyCard
//             key={duty.id}
//             duty={duty}
//             onAccept={handleAccept}
//             isMobile={isMobile}
//           />
//         ))}
//       </View>

//       {/* ── Quick Actions ────────────────────────────────── */}
//       <View style={styles.actionsRow}>
//         <ActionCard
//           icon="search-outline"
//           label="Find Duties"
//           iconBg="#EEF2FF"
//           isMobile={isMobile}
//         />
//         <ActionCard
//           icon="document-text-outline"
//           label="My Documents"
//           iconBg="#D1FAE5"
//           isMobile={isMobile}
//         />
//         <ActionCard
//           icon="help-circle-outline"
//           label="Support Center"
//           iconBg="#FEF3C7"
//           isMobile={isMobile}
//         />
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   content: {
//     padding: 24,
//     paddingBottom: 40,
//     gap: 20,
//   },
//   contentMobile: {
//     padding: 16,
//     gap: 16,
//   },

//   // ── Active Duty Card
//   activeDutyCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 14,
//     padding: 18,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   activeDutyTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 14,
//   },
//   activeDutyLeft: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     flex: 1,
//     minWidth: 0,           // ← add this so text can shrink
//   },
//   activeDutyIconWrap: {
//     width: 36,
//     height: 36,
//     borderRadius: 10,
//     backgroundColor: "#EEF2FF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   activeDutyLabel: {
//     fontSize: 11,
//     color: COLORS.subText,
//     fontWeight: "600",
//     letterSpacing: 0.5,
//     marginBottom: 2,
//   },
//   activeDutyTitle: {
//     fontSize: 14,          // down from 15
//     fontWeight: "700",
//     color: COLORS.text,
//     flexShrink: 1,
//   },
//   activeDutyRight: {
//     flexDirection: "row",
//     alignItems: "center",
//     flexWrap: "wrap",     // ← allows wrapping
//     gap: 4,
//   },
//   activeDutyPercent: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: COLORS.primary,
//   },
//   activeDutySep: {
//     color: COLORS.border,
//     fontSize: 12,
//   },
//   activeDutyTime: {
//     fontSize: 12,
//     color: COLORS.subText,
//     fontWeight: "500",
//   },
//   progressTrack: {
//     height: 8,
//     backgroundColor: "#EEF2FF",
//     borderRadius: 4,
//     overflow: "hidden",
//   },
//   progressFill: {
//     height: "100%",
//     backgroundColor: COLORS.primary,
//     borderRadius: 4,
//   },

//   // ── Available Banner
//   availableBanner: {
//     backgroundColor: "#F0FDF4",
//     borderRadius: 14,
//     padding: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#BBF7D0",
//   },
//   unavailableBanner: {
//     backgroundColor: "#FFF1F2",
//     borderColor: "#FECDD3",
//   },
//   availableLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   availableDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },
//   availableTitle: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: COLORS.text,
//   },
//   availableSub: {
//     fontSize: 12,
//     color: COLORS.subText,
//     marginTop: 2,
//   },

//   // ── Stats
//   statsRow: {
//     flexDirection: "row",
//     gap: 12,
//     flexWrap: "wrap",
//   },
//   statsRowMobile: {
//     gap: 10,
//     justifyContent: "space-between",
//   },

//   // ── Section Header
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 4,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: COLORS.text,
//   },
//   viewAll: {
//     fontSize: 14,
//     color: COLORS.primary,
//     fontWeight: "600",
//   },

//   // ── Duties Grid
//   dutiesGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 16,
//   },
//   dutiesGridMobile: {
//     flexDirection: "column",
//   },

//   // ── Actions Row
//   actionsRow: {
//     flexDirection: "row",
//     gap: 14,
//     marginTop: 4,
//   },
// });






import ActionCard from "@/component/cards/medicalStaff/ActionCard";
import DutyCard from "@/component/cards/medicalStaff/Dashboard/DutyCard";
import OngoingDutyCard from "@/component/cards/medicalStaff/Dashboard/OngoingDutyCard";
import StatsCard from "@/component/cards/medicalStaff/Dashboard/StatsCard";
import UpcomingDutyCard from "@/component/cards/medicalStaff/Dashboard/UpcomingDutyCard";
import Toast from "@/component/common/Toast";
import ToggleSwitch from "@/component/common/ToggleSwitch";
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { dutyAPI, profileAPI } from "../../service/api";
import { useLocationTracker } from '@/hooks/useLocationTracker';

interface Duty {
  _id?: string;
  id?: string;
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
  const [available, setAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    completedDutiesCount: 0,
    averagePerDuty: "0.0"
  });
  const [earningsLoading, setEarningsLoading] = useState(false);

  const [upcomingDuties, setUpcomingDuties] = useState<Duty[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  const [ongoingDuties, setOngoingDuties] = useState<Duty[]>([]);
  const [ongoingLoading, setOngoingLoading] = useState(false);

  const [averageRating, setAverageRating] = useState<number>(0);

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const visibleDuties = showAll ? duties : duties.slice(0, 2);

  // const handleAccept = () => {

  //   setToast(true);
  //   setTimeout(() => setToast(false), 3000);
  // };

  const handleAccept = useCallback(async () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    await fetchAvailableDuties();   // removes accepted duty from available list
    await fetchUpcomingDuties();    // shows it in upcoming list
  }, []);

  // Refresh functions for status changes
  const refreshDuties = () => {
    fetchUpcomingDuties();
    fetchOngoingDuties();
  };



  // ── PATCH /api/profile/staff-availability
  const handleToggleAvailability = async () => {
    const newValue = !available;
    setAvailable(newValue);
    setToggling(true);
    try {
      await profileAPI.toggleMedicalStaffAvailability(newValue);
      console.log("✅ Availability toggled:", newValue);
    } catch (err: any) {
      console.error("❌ Toggle failed:", err?.response?.data);
      setAvailable(!newValue);
    } finally {
      setToggling(false);
    }
  };

  // ── GET /api/duties/available
  const fetchAvailableDuties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dutyAPI.getAvailableDuties();
      console.log("✅ Available duties fetched:", response);

      interface JobResponse {
        _id: string;
        staffRole?: string;
        hospital?: {
          hospitalLegalName?: string;
        };
        distanceText?: string;
        distance?: number;
        startTime?: string;
        endTime?: string;
        totalPayment?: number;
        date: string;
        urgency?: string;
      }

      const transformedDuties = (response.jobs || []).map((job: JobResponse) => ({
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
      console.error("❌ Failed to fetch duties:", err?.response?.data);
      setError(err?.response?.data?.message || "Failed to load duties");
    } finally {
      setLoading(false);
    }
  };

  // fetch earnings
  const fetchEarnings = async () => {
    setEarningsLoading(true);
    try {
      const response = await profileAPI.getEarnings();
      console.log("✅ Earnings data fetched:", response);
      if (response.success && response.data) {
        setEarnings(response.data);
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch earnings:", err?.response?.data);
    } finally {
      setEarningsLoading(false);
    }
  };

  const fetchDashboardOverview = async () => {
    try {
      const response = await profileAPI.getStaffOverview();
      setAverageRating(response.data?.profile?.averageRating || 0);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard overview:", err);
    }
  };

  // ── GET /api/duties/my-upcoming (UPDATED)
  const fetchUpcomingDuties = async () => {
    setUpcomingLoading(true);
    try {
      const response = await dutyAPI.getMyUpcomingDuties();
      console.log("✅ Upcoming duties fetched:", response);

      interface UpcomingJobResponse {
        _id: string;
        formattedRole?: string;
        hospital?: {
          hospitalLegalName?: string;
        };
        startTime?: string;
        endTime?: string;
        totalPayment?: number;
        date: string;
        status?: string;
        distanceText?: string;
        distance?: number;
      }

      // Filter to only show duties with status 'assigned'
      const transformedDuties = (response.data || [])
        .filter((job: UpcomingJobResponse) => job.status === 'assigned')
        .map((job: UpcomingJobResponse) => ({
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
      console.error("❌ Failed to fetch upcoming duties:", err?.response?.data);
    } finally {
      setUpcomingLoading(false);
    }
  };

  // ── GET /api/duties/ongoing (UPDATED)
  const fetchOngoingDuties = async () => {
    setOngoingLoading(true);
    try {
      const res = await dutyAPI.getOngoingDuties();
      console.log("✅ Ongoing duties:", res);

      // Filter to only show duties with status 'enroute' or 'in-progress'
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
      console.error("❌ Failed to fetch ongoing duties:", err);
    } finally {
      setOngoingLoading(false);
    }
  };

 

  // inside Dashboard component, after you fetch ongoingDuties:
  const activeOngoing = ongoingDuties[0]; // first active duty

  useLocationTracker({
    dutyId: activeOngoing?._id ?? '',
    staffId: activeOngoing?.assignedTo ?? '',
    hospitalId: activeOngoing?.hospitalId ?? '',
    active: !!activeOngoing &&
      (activeOngoing.status === 'enroute' || activeOngoing.status === 'in-progress'),
  });



  // Fetch duties when component mounts and when available status changes
  useEffect(() => {
    if (available) {
      fetchAvailableDuties();
    } else {
      setTotalJobs(0);
    }
  }, [available]);

  // Fetch earnings data when component mounts
  useEffect(() => {
    fetchEarnings();
  }, []);

  // Get Average Rating
  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  // fetching upcoming duties
  useEffect(() => {
    fetchUpcomingDuties();
  }, []);

  // fetching Ongoing duties
  useEffect(() => {
    fetchOngoingDuties();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      showsVerticalScrollIndicator={false}
    >
      {toast && <Toast message="Duty Accepted Successfully!" />}

      {/* ── Active Duty Banner ───────────────────────────── */}
      <View style={styles.activeDutyCard}>
        <View style={styles.activeDutyTop}>
          <View style={styles.activeDutyLeft}>
            <View style={styles.activeDutyIconWrap}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.activeDutyLabel}>ACTIVE DUTY</Text>
              <Text style={styles.activeDutyTitle}>
                Emergency Nurse at City General Hospital
              </Text>
            </View>
          </View>
          <View style={styles.activeDutyRight}>
            <Text style={styles.activeDutyPercent}>65% Complete</Text>
            <Text style={styles.activeDutySep}>  |  </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "65%" }]} />
        </View>
      </View>

      {/* ── Available Banner ── */}
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
          : <ToggleSwitch enabled={available} onToggle={handleToggleAvailability} />
        }
      </View>

      {/* ── Stats ────────────────────────────────────────── */}
      <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
        <StatsCard
          icon="cash-outline"
          value={earningsLoading ? "..." : `₹ ${earnings.totalEarnings.toLocaleString()}`}
          label="Total Earnings"
          trend="12%"
          trendUp
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
          trend="0.2"
          trendUp
          isMobile={isMobile}
        />
      </View>

      {/* ── Available Duties ── */}
      {available ? (
        <>
          <View style={styles.sectionHeader}>
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

      {/* ── Upcoming Duties ── */}
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
              onStatusChange={refreshDuties}
            />
          ))}
        </View>
      )}

      {/* Ongoing duties  */}
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
              onStatusChange={refreshDuties}
            />
          ))}
        </View>
      )}

      {/* ── Quick Actions ────────────────────────────────── */}
      <View style={styles.actionsRow}>
        <ActionCard
          icon="search-outline"
          label="Find Duties"
          iconBg="#EEF2FF"
          isMobile={isMobile}
        />
        <ActionCard
          icon="document-text-outline"
          label="My Documents"
          iconBg="#D1FAE5"
          isMobile={isMobile}
        />
        <ActionCard
          icon="help-circle-outline"
          label="Support Center"
          iconBg="#FEF3C7"
          isMobile={isMobile}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile: { padding: 16, gap: 16 },

  // ── Active Duty Card
  activeDutyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  activeDutyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  activeDutyLeft: { flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 },
  activeDutyIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  activeDutyLabel: { fontSize: 11, color: COLORS.subText, fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 },
  activeDutyTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, flexShrink: 1 },
  activeDutyRight: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  activeDutyPercent: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  activeDutySep: { color: COLORS.border, fontSize: 12 },
  activeDutyTime: { fontSize: 12, color: COLORS.subText, fontWeight: "500" },
  progressTrack: { height: 8, backgroundColor: "#EEF2FF", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },

  // ── Available Banner
  availableBanner: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#BBF7D0" },
  unavailableBanner: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  availableLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  availableDot: { width: 10, height: 10, borderRadius: 5 },
  availableTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  availableSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },

  // ── Stats
  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  statsRowMobile: { gap: 10, justifyContent: "space-between" },

  // ── Section Header
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  viewAll: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },

  // ── Duties Grid
  dutiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  dutiesGridMobile: { flexDirection: "column" },

  // ── Unavailable empty state
  unavailableEmpty: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  unavailableEmptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  unavailableEmptySub: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingHorizontal: 24 },

  // ── Loading, Error, and Empty states
  loadingContainer: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.subText, marginTop: 8 },
  errorContainer: { alignItems: "center", paddingVertical: 30, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.red, gap: 10 },
  errorText: { fontSize: 14, color: COLORS.red, textAlign: "center", paddingHorizontal: 20 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingVertical: 40, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingHorizontal: 24 },

  // ── Actions Row
  actionsRow: { flexDirection: "row", gap: 14, marginTop: 4 },
});