import React from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator ,TouchableOpacity} from 'react-native';
 
// ─── Types ────────────────────────────────────────────────────────────────────
interface StatItem {
  label: string;
  count: number;
  color: string;
}
 
interface VerificationStatsProps {
  stats: StatItem[];
  total: number;
  loading?: boolean;
  error?: string;        
  onRetry?: () => void;    
}
 
// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ stats, total, size = 150 }: { stats: StatItem[]; total: number; size?: number }) {
  const stroke = size * 0.13;
 
  // Calculate rotation angles from percentages
  const statsWithPct = stats.map(stat => ({
    ...stat,
    pct: total > 0 ? Math.round((stat.count / total) * 100) : 0,
    degrees: total > 0 ? (stat.count / total) * 360 : 0,
  }));
 
  // Calculate rotation start for each segment
  let currentRotation = -90;
  const segments = statsWithPct.map(stat => {
    const rotation = currentRotation;
    currentRotation += stat.degrees;
    return { ...stat, rotation };
  });
 
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Base ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: '#E2E8F0',
      }} />
 
      {/* Dynamic segments */}
      {[...segments].reverse().map((seg, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute', width: size, height: size, borderRadius: size / 2,
            borderWidth: stroke,
            borderTopColor: seg.color,
            borderRightColor: seg.degrees > 90 ? seg.color : 'transparent',
            borderBottomColor: seg.degrees > 180 ? seg.color : 'transparent',
            borderLeftColor: seg.degrees > 270 ? seg.color : 'transparent',
            transform: [{ rotate: `${seg.rotation}deg` }],
          }}
        />
      ))}
 
      {/* Center label */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.17, fontWeight: '800', color: '#0F172A' }}>
          {total.toLocaleString()}
        </Text>
        <Text style={{ fontSize: size * 0.085, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          TOTAL DOCS
        </Text>
      </View>
    </View>
  );
}
 
// ─── Legend Row ───────────────────────────────────────────────────────────────
function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <View style={lg.row}>
      <View style={[lg.dot, { backgroundColor: color }]} />
      <Text style={lg.label}>{label}</Text>
      <Text style={lg.pct}>{pct}%</Text>
    </View>
  );
}
 
const lg = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 99 },
  label: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  pct: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
});
 
// ─── Main Component ───────────────────────────────────────────────────────────
export default function VerificationStats({ stats, total, loading, error, onRetry }: VerificationStatsProps) {

  // Calculate percentage for each stat
  const statsWithPct = stats.map(stat => ({
    ...stat,
    pct: total > 0 ? Math.round((stat.count / total) * 100) : 0,
  }));
 
 if (loading || total == 0) {
  return (
    <View style={s.card}>
      <Text style={s.title}>Verification Stats</Text>
      <View style={s.donutWrap}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    </View>
  );
}

if (error) {
  return (
    <View style={s.card}>
      <Text style={s.title}>Verification Stats</Text>
      <View style={s.errorBox}>
        <Text style={s.errorText}>⚠️ {error}</Text>
        {onRetry && (
          <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
 
  return (
    <View style={s.card}>
      <Text style={s.title}>Verification Stats</Text>
      <View style={s.donutWrap}>
        <DonutChart stats={stats} total={total} size={150} />
      </View>
      {statsWithPct.map(stat => (
        <LegendRow key={stat.label} color={stat.color} label={stat.label} pct={stat.pct} />
      ))}
    </View>
  );
}
 
const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  donutWrap: { alignItems: 'center', marginBottom: 20 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
});