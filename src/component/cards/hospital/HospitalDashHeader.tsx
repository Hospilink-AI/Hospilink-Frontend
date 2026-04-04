import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function HospitalDashHeader() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Hospital Overview</Text>
        <Text style={styles.subtitle}>Real-time status of hospital duties and staff.</Text>
      </View>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="add" size={16} color="#fff" />
        <Text onPress={() => router.push('/hospital/create-duty')}  style={styles.btnText}>Create Duty</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:     { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnText:   { color: '#fff', fontWeight: '600', fontSize: 13 },
});