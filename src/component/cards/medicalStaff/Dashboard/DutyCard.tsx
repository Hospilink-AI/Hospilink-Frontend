// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { dutyAPI } from "../../../../service/api";

// interface Props {
//   duty: {
//     _id?: string;
//     id?: string;
//     title?: string;
//     hospital?: string;
//     distance?: string;
//     time?: string;
//     price?: string;
//     date?: string;
//     tag?: string;
//     status?: string;
//     startTime?: string;
//     endTime?: string;
//   };
//   onAccept: () => void;
//    onPress: (id: string) => void;
//   isMobile?: boolean;
// }

// // Helper function to check if current time is within duty start time window (±15 minutes)
// const canStartInProgress = (dutyStartTime?: string) => {
//   if (!dutyStartTime) return false;

//   const now = new Date();
//   const dutyStart = new Date(dutyStartTime);

//   const windowStart = new Date(dutyStart.getTime() - 15 * 60 * 1000);
//   const windowEnd = new Date(dutyStart.getTime() + 15 * 60 * 1000);

//   return now >= windowStart && now <= windowEnd;
// };

// // Helper function to check if current time is within duty completion window (end time to +15 minutes)
// const canCompleteDuty = (dutyEndTime?: string) => {
//   if (!dutyEndTime) return false;

//   const now = new Date();
//   const dutyEnd = new Date(dutyEndTime);
//   const completionWindowEnd = new Date(dutyEnd.getTime() + 15 * 60 * 1000);

//   return now >= dutyEnd && now <= completionWindowEnd;
// };

// export default function DutyCard({ duty, onAccept, isMobile }: Props) {
//   const [accepted, setAccepted] = useState(false);
//   const [accepting, setAccepting] = useState(false);
//   const [dutyStatus, setDutyStatus] = useState(duty.status || 'available');
//   const [statusLoading, setStatusLoading] = useState(false);

//   const router = useRouter();

//   const isUrgent = duty.tag === "URGENT";
//   const isNight = duty.tag === "NIGHT SHIFT";

//   // Auto-completion check at 4:16pm
//   useEffect(() => {
//     if (dutyStatus === 'in-progress' && duty.endTime) {
//       const endTime = duty.endTime; // Assign to const to satisfy TypeScript
//       const checkAutoComplete = () => {
//         const now = new Date();
//         const dutyEnd = new Date(endTime);
//         const autoCompleteTime = new Date(dutyEnd.getTime() + 16 * 60 * 1000);

//         if (now >= autoCompleteTime) {
//           handleMarkCompleted();
//         }
//       };

//       const interval = setInterval(checkAutoComplete, 60000);
//       return () => clearInterval(interval);
//     }
//   }, [dutyStatus, duty.endTime]);

//   // handle accept duty
//   const handleAccept = async () => {
//     setAccepting(true);
//     try {
//       await dutyAPI.acceptDuty(duty._id || duty.id);
//       console.log("Duty accepted:", duty._id || duty.id);
//       setAccepted(true);
//       setDutyStatus('assigned');
//       onAccept();
//     } catch (err: any) {
//       console.error("Accept duty failed:", err?.response?.data);
//       alert(err?.response?.data?.message || "Failed to accept duty.");
//     } finally {
//       setAccepting(false);
//     }
//   };

//   // Handle Mark as Enroute
//   const handleMarkEnroute = async () => {
//     setStatusLoading(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id || duty.id, 'enroute');
//       console.log("Duty marked as enroute:", duty._id || duty.id);
//       setDutyStatus('enroute');
//     } catch (err: any) {
//       console.error("Mark enroute failed:", err?.response?.data);
//       alert(err?.response?.data?.message || "Failed to mark as enroute.");
//     } finally {
//       setStatusLoading(false);
//     }
//   };

//   // Handle Mark as In-Progress
//   const handleMarkInProgress = async () => {
//     if (!canStartInProgress(duty.startTime)) {
//       alert("You can only mark duty as in-progress within 15 minutes of start time.");
//       return;
//     }

//     setStatusLoading(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id || duty.id, 'in-progress');
//       console.log("Duty marked as in-progress:", duty._id || duty.id);
//       setDutyStatus('in-progress');
//     } catch (err: any) {
//       console.error("Mark in-progress failed:", err?.response?.data);
//       alert(err?.response?.data?.message || "Failed to mark as in-progress.");
//     } finally {
//       setStatusLoading(false);
//     }
//   };

//   // Handle Mark as Completed
//   const handleMarkCompleted = async () => {
//     if (dutyStatus !== 'in-progress') {
//       alert("You can only complete a duty that is in-progress.");
//       return;
//     }

//     if (!canCompleteDuty(duty.endTime)) {
//       alert("You can only complete duty within 15 minutes after end time.");
//       return;
//     }

//     setStatusLoading(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id || duty.id, 'completed');
//       console.log("Duty marked as completed:", duty._id || duty.id);
//       setDutyStatus('completed');
//     } catch (err: any) {
//       console.error("Mark completed failed:", err?.response?.data);
//       alert(err?.response?.data?.message || "Failed to mark as completed.");
//     } finally {
//       setStatusLoading(false);
//     }
//   };

//   return (
//     // In the return
//     <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardDesktop]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.title}>{duty.title || 'Medical Duty'}</Text>
//           <Text style={styles.hospital}>{duty.hospital || 'Hospital'}</Text>
//         </View>
//         <View style={styles.tags}>
//           {accepted && (
//             <View style={styles.acceptedTag}>
//               <Ionicons name="checkmark-circle" size={12} color="#fff" />
//               <Text style={styles.acceptedText}>ACCEPTED</Text>
//             </View>
//           )}
//           {duty.tag && (
//             <View style={[styles.badge, isUrgent && styles.urgentBadge, isNight && styles.nightBadge]}>
//               <Text style={[styles.badgeText, isUrgent && styles.urgentText, isNight && styles.nightText]}>
//                 {duty.tag}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Info Grid */}
//       <View style={styles.infoGrid}>
//         <InfoItem icon="navigate-outline" text={duty.distance || 'N/A'} />
//         <InfoItem icon="time-outline" text={duty.time || 'N/A'} />
//         <InfoItem icon="card-outline" text={duty.price || 'N/A'} bold />
//         <InfoItem icon="calendar-outline" text={duty.date || 'N/A'} />
//       </View>

//       <View style={styles.divider} />

//       {/* Buttons */}
//       {!accepted ? (
//         <View style={styles.buttons}>
//           <TouchableOpacity style={styles.declineBtn} disabled={accepting}>
//             <Text style={styles.declineText}>Decline</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.acceptBtn, accepting && { opacity: 0.7 }]}
//             activeOpacity={0.85}
//             onPress={handleAccept}
//             disabled={accepting}
//           >
//             {accepting
//               ? <ActivityIndicator color="#fff" size="small" />
//               : <Text style={styles.acceptBtnText}>Accept Duty</Text>
//             }
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <View style={styles.buttons}>
//           <TouchableOpacity
//             style={styles.mapBtn}
//             onPress={() => router.push({
//               pathname: "/medicalStaff/duties/[id]/map",
//               params: {
//                 id: duty._id || duty.id || '',
//                 hospitalName: duty.hospital,
//               },
//             })}
//           >
//             <Ionicons name="map-outline" size={16} color={COLORS.text} />
//             <Text style={styles.mapText}>Map</Text>
//           </TouchableOpacity>

//           {dutyStatus === 'assigned' && (
//             <TouchableOpacity
//               style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
//               activeOpacity={0.85}
//               onPress={handleMarkEnroute}
//               disabled={statusLoading}
//             >
//               {statusLoading
//                 ? <ActivityIndicator color="#fff" size="small" />
//                 : <Text style={styles.startBtnText}>Mark as Enroute</Text>
//               }
//             </TouchableOpacity>
//           )}

//           {dutyStatus === 'enroute' && (
//             <TouchableOpacity
//               style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
//               activeOpacity={0.85}
//               onPress={handleMarkInProgress}
//               disabled={statusLoading}
//             >
//               {statusLoading
//                 ? <ActivityIndicator color="#fff" size="small" />
//                 : <Text style={styles.startBtnText}>Mark as In-Progress</Text>
//               }
//             </TouchableOpacity>
//           )}

//           {dutyStatus === 'in-progress' && (
//             <TouchableOpacity
//               style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
//               activeOpacity={0.85}
//               onPress={handleMarkCompleted}
//               disabled={statusLoading}
//             >
//               {statusLoading
//                 ? <ActivityIndicator color="#fff" size="small" />
//                 : <Text style={styles.startBtnText}>Mark as Completed</Text>
//               }
//             </TouchableOpacity>
//           )}

//           {dutyStatus === 'completed' && (
//             <View style={[styles.startBtn, { backgroundColor: '#10B981' }]}>
//               <Ionicons name="checkmark-circle" size={14} color="#fff" />
//               <Text style={styles.startBtnText}>Completed</Text>
//             </View>
//           )}
//         </View>
//       )}
//     </View>
//   );
// }

// function InfoItem({ icon, text, bold }: { icon: string; text: string; bold?: boolean }) {
//   return (
//     <View style={styles.infoItem}>
//       <Ionicons name={icon as any} size={14} color={COLORS.subText} />
//       <Text style={[styles.infoText, bold && styles.infoBold]}>{String(text || 'N/A')}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: { backgroundColor: COLORS.white, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, flex: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
//   cardMobile: { width: "100%" },
//   cardDesktop: { width: "48%" },
//   header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
//   title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
//   hospital: { fontSize: 13, color: COLORS.subText, marginTop: 3 },
//   tags: { flexDirection: "row", gap: 6, marginLeft: 8, flexShrink: 0 },
//   badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//   urgentBadge: { backgroundColor: "#FEE2E2" },
//   nightBadge: { backgroundColor: "#DBEAFE" },
//   badgeText: { fontSize: 11, fontWeight: "700" },
//   urgentText: { color: "#EF4444" },
//   nightText: { color: "#2563EB" },
//   acceptedTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//   acceptedText: { color: "#fff", fontSize: 11, fontWeight: "700" },
//   infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, rowGap: 10 },
//   infoItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
//   infoText: { fontSize: 13, color: "#475569" },
//   infoBold: { fontWeight: "700", color: COLORS.text },
//   divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
//   buttons: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
//   declineBtn: { paddingVertical: 10, paddingHorizontal: 16 },
//   declineText: { color: COLORS.subText, fontSize: 14, fontWeight: "500" },
//   acceptBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
//   acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
//   mapBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: COLORS.border, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
//   mapText: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
//   startBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10 },
//   startBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
// });




import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { dutyAPI } from "../../../../service/api";

interface Props {
  duty: {
    _id?: string;
    id?: string;
    title?: string;
    hospital?: string;
    distance?: string;
    time?: string;
    price?: string;
    date?: string;
    tag?: string;
    status?: string;
    startTime?: string;
    endTime?: string;
  };
  onAccept: () => void;
  onPress: (id: string) => void; // ✅ Prop properly received
  isMobile?: boolean;
}

// Helper functions (canStartInProgress, canCompleteDuty) remain the same...
const canStartInProgress = (dutyStartTime?: string) => {
  if (!dutyStartTime) return false;
  const now = new Date();
  const dutyStart = new Date(dutyStartTime);
  const windowStart = new Date(dutyStart.getTime() - 15 * 60 * 1000);
  const windowEnd = new Date(dutyStart.getTime() + 15 * 60 * 1000);
  return now >= windowStart && now <= windowEnd;
};

const canCompleteDuty = (dutyEndTime?: string) => {
  if (!dutyEndTime) return false;
  const now = new Date();
  const dutyEnd = new Date(dutyEndTime);
  const completionWindowEnd = new Date(dutyEnd.getTime() + 15 * 60 * 1000);
  return now >= dutyEnd && now <= completionWindowEnd;
};

export default function DutyCard({ duty, onAccept, onPress, isMobile }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(duty.status || 'available');
  const [statusLoading, setStatusLoading] = useState(false);

  const router = useRouter();
  const isUrgent = duty.tag === "URGENT";
  const isNight = duty.tag === "NIGHT SHIFT";

  // Auto-completion logic
  useEffect(() => {
    if (dutyStatus === 'in-progress' && duty.endTime) {
      const endTime = duty.endTime;
      const checkAutoComplete = () => {
        const now = new Date();
        const dutyEnd = new Date(endTime);
        const autoCompleteTime = new Date(dutyEnd.getTime() + 16 * 60 * 1000);
        if (now >= autoCompleteTime) handleMarkCompleted();
      };
      const interval = setInterval(checkAutoComplete, 60000);
      return () => clearInterval(interval);
    }
  }, [dutyStatus, duty.endTime]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await dutyAPI.acceptDuty(duty._id || duty.id);
      setAccepted(true);
      setDutyStatus('assigned');
      onAccept();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to accept duty.");
    } finally {
      setAccepting(false);
    }
  };

  const handleMarkEnroute = async () => {
    setStatusLoading(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id || duty.id, 'enroute');
      setDutyStatus('enroute');
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as enroute.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    if (!canStartInProgress(duty.startTime)) {
      alert("You can only mark duty as in-progress within 15 minutes of start time.");
      return;
    }
    setStatusLoading(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id || duty.id, 'in-progress');
      setDutyStatus('in-progress');
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as in-progress.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!canCompleteDuty(duty.endTime)) {
      alert("You can only complete duty within 15 minutes after end time.");
      return;
    }
    setStatusLoading(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id || duty.id, 'completed');
      setDutyStatus('completed');
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as completed.");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      // ✅ Navigates to duty details page
      onPress={() => onPress((duty._id || duty.id) as string)}
      style={[styles.card, isMobile ? styles.cardMobile : styles.cardDesktop]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{duty.title || 'Medical Duty'}</Text>
          <Text style={styles.hospital}>{duty.hospital || 'Hospital'}</Text>
        </View>
        <View style={styles.tags}>
          {accepted && (
            <View style={styles.acceptedTag}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.acceptedText}>ACCEPTED</Text>
            </View>
          )}
          {duty.tag && (
            <View style={[styles.badge, isUrgent && styles.urgentBadge, isNight && styles.nightBadge]}>
              <Text style={[styles.badgeText, isUrgent && styles.urgentText, isNight && styles.nightText]}>
                {duty.tag}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <InfoItem icon="navigate-outline" text={duty.distance || 'N/A'} />
        <InfoItem icon="time-outline" text={duty.time || 'N/A'} />
        <InfoItem icon="card-outline" text={duty.price || 'N/A'} bold />
        <InfoItem icon="calendar-outline" text={duty.date || 'N/A'} />
      </View>

      <View style={styles.divider} />

      {/* Buttons */}
      {!accepted ? (
        <View style={styles.buttons}>
          <TouchableOpacity 
             style={styles.declineBtn} 
             disabled={accepting}
             onPress={(e) => e.stopPropagation()} // ✅ Prevent card press
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, accepting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={(e) => {
               e.stopPropagation(); // ✅ Prevent card press
               handleAccept();
            }}
            disabled={accepting}
          >
            {accepting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.acceptBtnText}>Accept Duty</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={(e) => {
              e.stopPropagation(); // ✅ Prevent card press
              router.push({
                pathname: "/medicalStaff/duties/[id]/map" as any,
                params: {
                  id: duty._id || duty.id || '',
                  hospitalName: duty.hospital,
                },
              });
            }}
          >
            <Ionicons name="map-outline" size={16} color={COLORS.text} />
            <Text style={styles.mapText}>Map</Text>
          </TouchableOpacity>

          {dutyStatus === 'assigned' && (
            <TouchableOpacity
              style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
              onPress={(e) => {
                 e.stopPropagation(); // ✅ Prevent card press
                 handleMarkEnroute();
              }}
              disabled={statusLoading}
            >
              {statusLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.startBtnText}>Mark as Enroute</Text>}
            </TouchableOpacity>
          )}

          {/* ... Apply e.stopPropagation() to other status buttons below ... */}
          {dutyStatus === 'enroute' && (
            <TouchableOpacity
              style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
              onPress={(e) => {
                 e.stopPropagation();
                 handleMarkInProgress();
              }}
              disabled={statusLoading}
            >
              {statusLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.startBtnText}>Mark as In-Progress</Text>}
            </TouchableOpacity>
          )}

          {dutyStatus === 'in-progress' && (
            <TouchableOpacity
              style={[styles.startBtn, statusLoading && { opacity: 0.7 }]}
              onPress={(e) => {
                 e.stopPropagation();
                 handleMarkCompleted();
              }}
              disabled={statusLoading}
            >
              {statusLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.startBtnText}>Mark as Completed</Text>}
            </TouchableOpacity>
          )}

          {dutyStatus === 'completed' && (
            <View style={[styles.startBtn, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.startBtnText}>Completed</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// InfoItem and Styles remain same as your original provided code...
function InfoItem({ icon, text, bold }: { icon: string; text: string; bold?: boolean }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={14} color={COLORS.subText} />
      <Text style={[styles.infoText, bold && styles.infoBold]}>{String(text || 'N/A')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, flex: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  cardMobile: { width: "100%" },
  cardDesktop: { width: "48%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, color: COLORS.subText, marginTop: 3 },
  tags: { flexDirection: "row", gap: 6, marginLeft: 8, flexShrink: 0 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentBadge: { backgroundColor: "#FEE2E2" },
  nightBadge: { backgroundColor: "#DBEAFE" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  urgentText: { color: "#EF4444" },
  nightText: { color: "#2563EB" },
  acceptedTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  acceptedText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, rowGap: 10 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
  infoText: { fontSize: 13, color: "#475569" },
  infoBold: { fontWeight: "700", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  buttons: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  declineBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  declineText: { color: COLORS.subText, fontSize: 14, fontWeight: "500" },
  acceptBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: COLORS.border, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  mapText: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  startBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10 },
  startBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});