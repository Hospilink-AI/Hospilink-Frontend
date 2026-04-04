import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  badgeType: 'percent' | 'number' | 'tag';
  isTablet?: boolean;
}

export default function StatCard({
  icon,
  label,
  value,
  badge,
  badgeColor,
  badgeType,
  isTablet = false,
}: StatCardProps) {
  return (
    <View style={[
      styles.card,
      isTablet ? styles.cardTablet : styles.cardMobile,
    ]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <View style={[
          styles.badge,
          { backgroundColor: badgeColor + '15' }
        ]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {badgeType === 'percent' || badgeType === 'number' ? badge : badge}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardMobile: {
    width: '48%',
    minWidth: 150,
  },
  cardTablet: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
