import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { HospitalDashHeader } from '@/component/cards/hospital/HospitalDashHeader';
import { HospitalDashStatCards } from '@/component/cards/hospital/HospitalDashStatCard';
import { ActiveDutyTable } from '@/component/cards/hospital/HospitalDashActivityDutyTable';
import { RightSidebarWidgets } from '@/component/cards/hospital/HospitalDashStaffDistributionTable';
import { ActiveEmergencyRequests } from '@/component/cards/hospital/HospitalDashActiveEmergencyRequests';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 1024; // Adjusted breakpoint for a broader side-by-side view

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HospitalDashHeader />
      <HospitalDashStatCards isTablet={isTablet} />
      
      <View style={[styles.mainLayout, isTablet && styles.mainLayoutTablet]}>
        {/* Left Column (Main Tables) */}
        <View style={styles.leftColumn}>
          <ActiveDutyTable isTablet={isTablet} />
          <ActiveEmergencyRequests isTablet={isTablet} />
        </View>

        {/* Right Column (Sidebar Widgets) */}
        <View style={[styles.rightColumn, isTablet && { width: 320 }]}>
          <RightSidebarWidgets isTablet={isTablet} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 32 
  },
  mainLayout: { 
    marginTop: 16, 
    flexDirection: 'column', 
    gap: 16 
  },
  mainLayoutTablet: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  leftColumn: { 
    flex: 1, 
    gap: 16 
  },
  rightColumn: { 
    gap: 16, 
    width: '100%' 
  },
});