import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HospitalListSection from '@/component/cards/admin/HospitalManagement/HospitalList';
import StatCards from '@/component/cards/admin/HospitalManagement/StatCards';

export default function HospitalManagement() {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top: Header + Filters + Hospital Table ── */}
      <HospitalListSection />

      {/* ── Bottom: Stat Cards ── */}
      <StatCards />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
});
