import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { HospitalDashHeader } from '@/component/cards/hospital/HospitalDashHeader';
import { HospitalDashStatCards } from '@/component/cards/hospital/HospitalDashStatCard';
import { ActiveDutyTable } from '@/component/cards/hospital/HospitalDashActivityDutyTable';
import { StaffDistribution } from '@/component/cards/hospital/HospitalDashStaffDistributionTable';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HospitalDashHeader />
      <HospitalDashStatCards isTablet={isTablet} />
      <View style={[styles.bottom, isTablet && { flexDirection: 'row', gap: 16 }]}>
        <ActiveDutyTable isTablet={isTablet} />
        <StaffDistribution isTablet={isTablet} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F9FAFB' },
  content:  { padding: 16, paddingBottom: 32 },
  bottom:   { gap: 16 },
});