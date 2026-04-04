// import React, { useState } from 'react';
// import {
//   ScrollView,
//   StyleSheet,
//   View,
//   Text,
//   Alert,
//   Modal,
//   TouchableOpacity,
//   SafeAreaView,
// } from 'react-native';

// import MedicalStaffList,{ StaffMember } from '@/component/cards/admin/MedicalStaff/MedicalStaffList';
// import StatCards from '@/component/cards/admin/MedicalStaff/StatCards';
// import VerificationAlertCard from '@/component/cards/admin/MedicalStaff/VerificationAlertCard';

// // ─── Mock Data ───────────────────────────────────────────────────────────────
// const MOCK_STAFF: StaffMember[] = [
//   {
//     id: '1',
//     name: 'Dr. Julian Thorne',
//     email: 'julian.t@hospilink.com',
//     role: 'SPECIALIST',
//     joinedDate: 'Oct 12, 2023',
//     totalDuties: 312,
//     status: 'Verified',
//   },
//   {
//     id: '2',
//     name: 'Nurse Elena Rossi',
//     email: 'elena.rossi@hospilink.com',
//     role: 'NURSE',
//     joinedDate: 'Jan 05, 2024',
//     totalDuties: 84,
//     status: 'Pending',
//   },
//   {
//     id: '3',
//     name: 'Dr. Aris Varma',
//     email: 'a.varma@hospilink.com',
//     role: 'DOCTOR',
//     joinedDate: 'Feb 18, 2024',
//     totalDuties: 12,
//     status: 'Verified',
//   },
//   {
//     id: '4',
//     name: 'Nurse Sarah Jenkins',
//     email: 's.jenkins@hospilink.com',
//     role: 'NURSE',
//     joinedDate: 'Nov 30, 2022',
//     totalDuties: 521,
//     status: 'Verified',
//   },
//   {
//     id: '5',
//     name: 'Dr. Marcus Lee',
//     email: 'm.lee@hospilink.com',
//     role: 'DOCTOR',
//     joinedDate: 'Mar 01, 2024',
//     totalDuties: 67,
//     status: 'Pending',
//   },
//   {
//     id: '6',
//     name: 'Nurse Priya Patel',
//     email: 'p.patel@hospilink.com',
//     role: 'NURSE',
//     joinedDate: 'Dec 10, 2023',
//     totalDuties: 198,
//     status: 'Verified',
//   },
//   {
//     id: '7',
//     name: 'Dr. Sara Okonkwo',
//     email: 's.okonkwo@hospilink.com',
//     role: 'SPECIALIST',
//     joinedDate: 'Aug 22, 2023',
//     totalDuties: 5,
//     status: 'Rejected',
//   },
//   {
//     id: '8',
//     name: 'Dr. Tomás Rivera',
//     email: 't.rivera@hospilink.com',
//     role: 'DOCTOR',
//     joinedDate: 'Sep 14, 2023',
//     totalDuties: 243,
//     status: 'Verified',
//   },
//   {
//     id: '9',
//     name: 'Nurse Amy Chen',
//     email: 'a.chen@hospilink.com',
//     role: 'NURSE',
//     joinedDate: 'Jul 05, 2024',
//     totalDuties: 31,
//     status: 'Pending',
//   },
// ];

// const STATS = {
//   totalStaff: 1284,
//   pendingVerification: 42,
//   approvedClinicians: 1210,
//   onDuty: 156,
// };

// // ─── Profile Modal ────────────────────────────────────────────────────────────
// const ProfileModal = ({
//   member,
//   visible,
//   onClose,
// }: {
//   member: StaffMember | null;
//   visible: boolean;
//   onClose: () => void;
// }) => (
//   <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//     <View style={modalStyles.overlay}>
//       <View style={modalStyles.sheet}>
//         <View style={modalStyles.handle} />
//         {member && (
//           <>
//             <View style={modalStyles.avatarBlock}>
//               <View style={modalStyles.bigAvatar}>
//                 <Text style={modalStyles.bigAvatarText}>
//                   {member.name
//                     .split(' ')
//                     .map((n) => n[0])
//                     .slice(0, 2)
//                     .join('')}
//                 </Text>
//               </View>
//               <Text style={modalStyles.name}>{member.name}</Text>
//               <Text style={modalStyles.email}>{member.email}</Text>
//             </View>
//             <View style={modalStyles.detailGrid}>
//               {[
//                 { label: 'Role', value: member.role },
//                 { label: 'Status', value: member.status },
//                 { label: 'Joined', value: member.joinedDate },
//                 { label: 'Total Duties', value: String(member.totalDuties) },
//               ].map((item) => (
//                 <View key={item.label} style={modalStyles.detailItem}>
//                   <Text style={modalStyles.detailLabel}>{item.label}</Text>
//                   <Text style={modalStyles.detailValue}>{item.value}</Text>
//                 </View>
//               ))}
//             </View>
//           </>
//         )}
//         <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
//           <Text style={modalStyles.closeBtnText}>Close</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   </Modal>
// );

// // ─── Main Dashboard ───────────────────────────────────────────────────────────
// export default function Dashboard() {
//   const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   const handleViewProfile = (member: StaffMember) => {
//     setSelectedMember(member);
//     setModalVisible(true);
//   };

//   const handleViewHistory = (member: StaffMember) => {
//     Alert.alert(
//       'Duty History',
//       `${member.name} has completed ${member.totalDuties} duties since joining on ${member.joinedDate}.`,
//       [{ text: 'OK' }]
//     );
//   };

//   const handleExport = () => {
//     Alert.alert('Export Staff Logs', 'Staff logs have been queued for export. You will receive an email shortly.', [
//       { text: 'OK' },
//     ]);
//   };

//   const handleReviewQueue = () => {
//     Alert.alert('Review Queue', `${STATS.pendingVerification} specialists are awaiting credential verification.`, [
//       { text: 'Start Review', style: 'default' },
//       { text: 'Cancel', style: 'cancel' },
//     ]);
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView
//         style={styles.screen}
//         contentContainerStyle={styles.content}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── TOP: Stats + Search ── */}
//         <StatCards
//           totalStaff={STATS.totalStaff}
//           pendingVerification={STATS.pendingVerification}
//           approvedClinicians={STATS.approvedClinicians}
//           onDuty={STATS.onDuty}
//           onExport={handleExport}
//         />

//         {/* ── MIDDLE: Staff Table ── */}
//         <MedicalStaffList
//           staffList={MOCK_STAFF}
//           onViewHistory={handleViewHistory}
//           onViewProfile={handleViewProfile}
//         />

//         {/* ── BOTTOM: Alerts + Onboarding ── */}
//         <VerificationAlertCard
//           pendingCount={12}
//           onReviewQueue={handleReviewQueue}
//         />
//       </ScrollView>

//       {/* Profile Modal */}
//       <ProfileModal
//         member={selectedMember}
//         visible={modalVisible}
//         onClose={() => setModalVisible(false)}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: '#F3F4F6' },
//   screen: { flex: 1 },
//   content: { padding: 14, paddingBottom: 40 },
// });

// const modalStyles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'flex-end',
//   },
//   sheet: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 24,
//     paddingBottom: 36,
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#D1D5DB',
//     alignSelf: 'center',
//     marginBottom: 20,
//   },
//   avatarBlock: { alignItems: 'center', marginBottom: 20 },
//   bigAvatar: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     backgroundColor: '#DBEAFE',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//   },
//   bigAvatarText: { fontSize: 24, fontWeight: '800', color: '#1D4ED8' },
//   name: { fontSize: 20, fontWeight: '800', color: '#111827' },
//   email: { fontSize: 13, color: '#6B7280', marginTop: 3 },
//   detailGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 24,
//   },
//   detailItem: {
//     width: '47%',
//     backgroundColor: '#F9FAFB',
//     borderRadius: 10,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   detailLabel: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#9CA3AF',
//     letterSpacing: 0.3,
//     marginBottom: 4,
//   },
//   detailValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
//   closeBtn: {
//     backgroundColor: '#1D4ED8',
//     borderRadius: 12,
//     paddingVertical: 14,
//     alignItems: 'center',
//   },
//   closeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
// });


import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import MedicalStaffList,{ StaffMember } from '@/component/cards/admin/MedicalStaff/MedicalStaffList';
import StatCards from '@/component/cards/admin/MedicalStaff/StatCards';
import VerificationAlertCard from '@/component/cards/admin/MedicalStaff/VerificationAlertCard';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STAFF: StaffMember[] = [
  { id: '1', name: 'Dr. Julian Thorne',   email: 'julian.t@hospilink.com',    role: 'SPECIALIST', joinedDate: 'Oct 12, 2023', totalDuties: 312, status: 'Verified' },
  { id: '2', name: 'Nurse Elena Rossi',   email: 'elena.rossi@hospilink.com', role: 'NURSE',      joinedDate: 'Jan 05, 2024', totalDuties: 84,  status: 'Pending'  },
  { id: '3', name: 'Dr. Aris Varma',      email: 'a.varma@hospilink.com',     role: 'DOCTOR',     joinedDate: 'Feb 18, 2024', totalDuties: 12,  status: 'Verified' },
  { id: '4', name: 'Nurse Sarah Jenkins', email: 's.jenkins@hospilink.com',   role: 'NURSE',      joinedDate: 'Nov 30, 2022', totalDuties: 521, status: 'Verified' },
  { id: '5', name: 'Dr. Marcus Lee',      email: 'm.lee@hospilink.com',       role: 'DOCTOR',     joinedDate: 'Mar 01, 2024', totalDuties: 67,  status: 'Pending'  },
  { id: '6', name: 'Nurse Priya Patel',   email: 'p.patel@hospilink.com',     role: 'NURSE',      joinedDate: 'Dec 10, 2023', totalDuties: 198, status: 'Verified' },
  { id: '7', name: 'Dr. Sara Okonkwo',    email: 's.okonkwo@hospilink.com',   role: 'SPECIALIST', joinedDate: 'Aug 22, 2023', totalDuties: 5,   status: 'Rejected' },
  { id: '8', name: 'Dr. Tomás Rivera',    email: 't.rivera@hospilink.com',    role: 'DOCTOR',     joinedDate: 'Sep 14, 2023', totalDuties: 243, status: 'Verified' },
  { id: '9', name: 'Nurse Amy Chen',      email: 'a.chen@hospilink.com',      role: 'NURSE',      joinedDate: 'Jul 05, 2024', totalDuties: 31,  status: 'Pending'  },
];

const STATS = {
  totalStaff:          1284,
  pendingVerification: 42,
  approvedClinicians:  1210,
  onDuty:              156,
};

// ─── Profile Modal ─────────────────────────────────────────────────────────────
const ProfileModal = ({
  member, visible, onClose,
}: { member: StaffMember | null; visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={ms.overlay}>
      <View style={ms.sheet}>
        <View style={ms.handle} />
        {member && (
          <>
            <View style={ms.avatarBlock}>
              <View style={ms.bigAvatar}>
                <Text style={ms.bigAvatarText}>
                  {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <Text style={ms.name}>{member.name}</Text>
              <Text style={ms.email}>{member.email}</Text>
            </View>
            <View style={ms.detailGrid}>
              {[
                { label: 'Role',         value: member.role },
                { label: 'Status',       value: member.status },
                { label: 'Joined',       value: member.joinedDate },
                { label: 'Total Duties', value: String(member.totalDuties) },
              ].map(item => (
                <View key={item.label} style={ms.detailItem}>
                  <Text style={ms.detailLabel}>{item.label}</Text>
                  <Text style={ms.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <TouchableOpacity style={ms.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={ms.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function MedicalStaff() {
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [modalVisible,   setModalVisible]   = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── TOP ── */}
        <StatCards
          totalStaff={STATS.totalStaff}
          pendingVerification={STATS.pendingVerification}
          approvedClinicians={STATS.approvedClinicians}
          onDuty={STATS.onDuty}
          onExport={() =>
            Alert.alert('Export Staff Logs', 'Logs queued for export. Check your email.')
          }
        />

        {/* ── MIDDLE ── */}
        <MedicalStaffList
          staffList={MOCK_STAFF}
          onViewHistory={m =>
            Alert.alert('Duty History', `${m.name} completed ${m.totalDuties} duties (joined ${m.joinedDate}).`)
          }
          onViewProfile={m => { setSelectedMember(m); setModalVisible(true); }}
        />

        {/* ── BOTTOM ── */}
        <VerificationAlertCard
          pendingCount={12}
          onReviewQueue={() =>
            Alert.alert('Review Queue', `${STATS.pendingVerification} specialists awaiting verification.`, [
              { text: 'Start Review' },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        />

      </ScrollView>

      <ProfileModal
        member={selectedMember}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F3F4F6' },
  screen:  { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 20 },
  avatarBlock: { alignItems: 'center', marginBottom: 20 },
  bigAvatar:   { width: 72, height: 72, borderRadius: 36, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bigAvatarText: { fontSize: 24, fontWeight: '800', color: '#1D4ED8' },
  name:  { fontSize: 20, fontWeight: '800', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  detailItem: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.3, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  closeBtn:     { backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
