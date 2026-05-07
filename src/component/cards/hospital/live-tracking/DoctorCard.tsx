

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DoctorWithDistance } from '../../../../types/duty';
import { getInitials } from '../../../../utils/distanceDecoder';

interface Props {
  doctor: DoctorWithDistance;
}

const DoctorCard: React.FC<Props> = ({ doctor }) => {
  const isAvailable = doctor.available;

  return (
    <View style={styles.card}>
      {/* ── Avatar ── */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: isAvailable ? '#E8F5E9' : '#FFF3E0' },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color: isAvailable ? '#2E7D32' : '#E65100' },
          ]}
        >
          {getInitials(doctor.name)}
        </Text>
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        {/* Name + badge */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
          <View
            style={[
              styles.badge,
              isAvailable ? styles.badgeAvailable : styles.badgeBusy,
            ]}
          >
            <Text style={styles.badgeText}>
              {isAvailable ? '✅ Available' : '🟠 Busy'}
            </Text>
          </View>
        </View>

        {/* Specialty & qualification */}
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <Text style={styles.qualification}>{doctor.qualification}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>🏅 {doctor.experience} yrs</Text>
          <Text style={styles.stat}>
            ⭐ {doctor.rating} ({doctor.reviewCount})
          </Text>
          <Text style={styles.stat}>📍 {doctor.distanceKm.toFixed(1)} km</Text>
        </View>

        {/* Fee + phone */}
        <View style={styles.bottomRow}>
          <Text style={styles.fee}>₹{doctor.consultationFee} / visit</Text>
          <Text style={styles.phone}>{doctor.phone}</Text>
        </View>
      </View>
    </View>
  );
};

export default DoctorCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A237E',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeAvailable: { backgroundColor: '#E8F5E9' },
  badgeBusy: { backgroundColor: '#FFF3E0' },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  specialty: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
  },
  qualification: {
    fontSize: 12,
    color: '#777',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  stat: {
    fontSize: 12,
    color: '#555',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  fee: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  phone: {
    fontSize: 12,
    color: '#888',
  },
});

