import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// On web, Metro automatically serves live-tracking.web.tsx instead of this file.
// This file is the native (iOS/Android) fallback only.
export default function StaffTrackingDashboard() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Live tracking is available on web only.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  text: { fontSize: 14, color: '#6B7280' },
});
