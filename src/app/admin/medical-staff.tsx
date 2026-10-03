import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminAPI } from '@/service/api';
import { SafeAreaView } from 'react-native';

import MedicalStaffList from '@/component/cards/admin/MedicalStaff/MedicalStaffList';
import StatCards from '@/component/cards/admin/MedicalStaff/StatCards';
import VerificationAlertCard from '@/component/cards/admin/MedicalStaff/VerificationAlertCard';

export default function MedicalStaff() {
  const router = useRouter();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    adminAPI
      .getMedicalStaffStats()
      .then((res: any) => setPending(Number(res?.data?.pendingVerification) || 0))
      .catch(() => setPending(0));
  }, []);
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <StatCards
          onExport={() => Alert.alert('Export Staff Logs', 'Logs queued for export. Check your email.')}
        />

        <MedicalStaffList />

        <VerificationAlertCard pendingCount={pending} onReviewQueue={() => router.push('/admin/document-verification' as any)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  screen: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
});
