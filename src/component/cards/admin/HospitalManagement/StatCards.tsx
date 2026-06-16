import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useWindowDimensions } from 'react-native';

interface StatCardProps {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  description: string;
  actionLabel: string;
  actionColor: string;
  onAction?: () => void;
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  description,
  actionLabel,
  actionColor,
  onAction,
}: StatCardProps) {
  return (
    <View style={card.wrap}>
      <View style={[card.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={card.iconText}>{icon}</Text>
      </View>
      <Text style={card.label}>{label}</Text>
      <Text style={card.value}>{value}</Text>
      <Text style={card.desc}>{description}</Text>
      <TouchableOpacity onPress={onAction} style={card.actionRow}>
        <Text style={[card.actionLabel, { color: actionColor }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E9ECF0',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  iconCircle:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  iconText:    { fontSize: 18 },
  label:       { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase' },
  value:       { fontSize: 32, fontWeight: '800', color: '#0F172A', letterSpacing: -1, lineHeight: 38 },
  desc:        { fontSize: 11, color: '#64748B', lineHeight: 16, marginTop: 2 },
  actionRow:   { marginTop: 10 },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});

const CARDS: StatCardProps[] = [
  {
    icon:        '📋',
    iconBg:      '#EFF6FF',
    label:       'Verification Queue',
    value:       '12',
    description: 'Hospitals awaiting document audit',
    actionLabel: 'Review Queue →',
    actionColor: '#2563EB',
  },
  {
    icon:        '⚠️',
    iconBg:      '#FFFBEB',
    label:       'Expiring Licenses',
    value:       '05',
    description: 'Facilities with licenses expiring within 30 days',
    actionLabel: 'Send Notifications 🔔',
    actionColor: '#D97706',
  },
  // {
  //   icon:        '⚡',
  //   iconBg:      '#F0FDF4',
  //   label:       'System Capacity',
  //   value:       '94%',
  //   description: 'Integration efficiency across all nodes',
  //   actionLabel: 'View Performance Data →',
  //   actionColor: '#16A34A',
  // },
];

export default function StatCards() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View style={[s.row, isMobile && s.rowMobile]}>
      {CARDS.map((c, i) => (
        <StatCard key={i} {...c} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rowMobile: { flexDirection: 'column' },
});
