import React from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native';

import MedicalStaffList from '@/component/cards/admin/MedicalStaff/MedicalStaffList';
import StatCards from '@/component/cards/admin/MedicalStaff/StatCards';
import VerificationAlertCard from '@/component/cards/admin/MedicalStaff/VerificationAlertCard';

const STATS = {
  totalStaff: 1284,
  pendingVerification: 42,
  approvedClinicians: 1210,
  onDuty: 156,
};

export default function MedicalStaff() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <StatCards
          onExport={() => Alert.alert('Export Staff Logs', 'Logs queued for export. Check your email.')}
        />

        <MedicalStaffList />

        <VerificationAlertCard
          pendingCount={STATS.pendingVerification}
          onReviewQueue={() =>
            Alert.alert('Review Queue', `${STATS.pendingVerification} specialists awaiting verification.`, [
              { text: 'Start Review' },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  screen: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
});
