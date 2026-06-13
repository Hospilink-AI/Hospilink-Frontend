import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { adminAPI } from '@/service/api';

interface StatCardsProps {
  onExport: () => void;
}

interface StatCardItemProps {
  icon: string;
  badge: string;
  badgeColor: string;
  value: string | number;
  label: string;
  cardWidth: string;
  loading?: boolean;
}

interface StatsData {
  totalStaff: number;
  pendingVerification: number;
  approvedStaff: number;
  onDutyStaff: number;
  totalCount: number;
  availableCount: number;
  unavailableCount: number;
}

const StatCardItem = ({ icon, badge, badgeColor, value, label, cardWidth, loading }: StatCardItemProps) => (
  <View style={[styles.card, { width: cardWidth as any }]}>
    <View style={styles.cardTopRow}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardBadge, { color: badgeColor }]}>{badge}</Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color="#111827" style={styles.cardLoader} />
    ) : (
      <Text style={styles.cardValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    )}
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

export default function StatCards({ onExport }: StatCardsProps) {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 700;

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replaced raw fetch with adminAPI
      const data = await adminAPI.getMedicalStaffStats();
      
      if (data.success) {
        setStats(data.data);
      } else {
         setError(data.message ?? 'Failed to load stats.');
      }
    } catch (err : any) {
      const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to load stats. Please try again.';
    setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4 cards in one row on tablet, 2×2 on mobile
  const cardWidth = isTablet
    ? `${(100 - 3 * 2) / 4}%`   // 4 cols with ~2% gaps
    : '48%';                      // 2 cols

  // Calculate percentages for badges
  const totalStaffChange = stats ? '+12%' : '+0%';
  const verificationRate = stats && stats.totalStaff > 0 
    ? `${Math.round((stats.approvedStaff / stats.totalStaff) * 100)}% Verified`
    : '0% Verified';

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Medical Staff</Text>
          <Text style={styles.subtitle}>Oversee credentials, duty logs & verification</Text>
        </View>
       
      </View>

      

      {/* Error State */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchStats} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4-col on tablet / 2×2 on mobile */}
      <View style={styles.grid}>
        <StatCardItem 
          icon="📋"  
          badge={totalStaffChange}         
          badgeColor="#10B981" 
          value={stats?.totalStaff || 0}          
          label="TOTAL STAFF"         
          cardWidth={cardWidth}
          loading={loading}
        />
        <StatCardItem 
          icon="🗂️" 
          badge="Action Req."  
          badgeColor="#F59E0B" 
          value={stats?.pendingVerification || 0} 
          label="PENDING VERIFICATION" 
          cardWidth={cardWidth}
          loading={loading}
        />
        <StatCardItem 
          icon="✅"  
          badge={verificationRate} 
          badgeColor="#10B981" 
          value={stats?.approvedStaff || 0}  
          label="APPROVED CLINICIANS"  
          cardWidth={cardWidth}
          loading={loading}
        />
        <StatCardItem 
          icon="🕐"  
          badge="Active"        
          badgeColor="#3B82F6" 
          value={stats?.onDutyStaff || 0}              
          label="ON-DUTY CURRENTLY"    
          cardWidth={cardWidth}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleBlock: { flex: 1, paddingRight: 10 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  exportText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },

  /* Error */
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: { fontSize: 22 },
  cardBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardLoader: {
    marginBottom: 4,
    height: 30,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.4,
  },
});