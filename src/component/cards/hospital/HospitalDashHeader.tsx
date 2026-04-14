import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function HospitalDashHeader() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* Left Side: Text */}
      <View>
        <Text style={styles.title}>Hospital Overview</Text>
        <Text style={styles.subtitle}>Real-time status of hospital duties and staff.</Text>
      </View>

      {/* Right Side: Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={() => router.push('/hospital/create-duty')}
        >
          <Ionicons name="add-circle" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Create Duty</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn}
        onPress={() => router.push('/hospital/live-tracking')}
        >
          <Ionicons name="map-outline" size={16} color="#4B5563" />
          <Text style={styles.outlineBtnText}>View Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.dangerBtnText}>Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827' 
  },
  subtitle: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 2 
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Adds spacing between the buttons
  },
  primaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#3B82F6', 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 6 
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 13 
  },
  outlineBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 6 
  },
  outlineBtnText: { 
    color: '#4B5563', 
    fontWeight: '600', 
    fontSize: 13 
  },
  dangerBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#EF4444',
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 6 
  },
  dangerBtnText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 13 
  },
});