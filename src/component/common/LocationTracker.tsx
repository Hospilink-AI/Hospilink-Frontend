import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { COLORS } from '../../constant/colors';

// ─── Types ──────────────────────────────────────────────────────────────
interface LocationTrackerProps {
  staffId: string;
  dutyId: string;
  hospitalId: string;
  autoStart?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────
export default function LocationTracker({
  staffId,
  dutyId,
  hospitalId,
  autoStart = false,
}: LocationTrackerProps) {
  
  const {
    isTracking,
    currentLocation,
    error,
    permissionStatus,
    startTracking,
    stopTracking,
    requestPermission,
  } = useLocationTracking({
    staffId,
    dutyId,
    hospitalId,
    enabled: false, // Manual control
    updateInterval: 2000, // 2 seconds
  });

  /**
   * Auto-start tracking if enabled
   */
  useEffect(() => {
    let mounted = true;
    
    if (autoStart && !isTracking && mounted) {
      console.log('🚀 [LocationTracker] Auto-starting tracking...');
      startTracking();
    }
    
    return () => {
      mounted = false;
    };
  }, [autoStart, isTracking, startTracking]);

  /**
   * Handle toggle tracking
   */
  const handleToggleTracking = async () => {
    if (isTracking) {
      stopTracking();
    } else {
      // Check permission first
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      startTracking();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
          <Text style={styles.headerTitle}>
            {isTracking ? 'Live Tracking Active' : 'Location Tracking'}
          </Text>
        </View>
        {isTracking && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Location Display */}
      {currentLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.locationLabel}>Latitude:</Text>
            <Text style={styles.locationValue}>
              {currentLocation.latitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.locationLabel}>Longitude:</Text>
            <Text style={styles.locationValue}>
              {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
          {currentLocation.accuracy && (
            <View style={styles.locationRow}>
              <Ionicons name="radio-outline" size={16} color="#64748B" />
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text style={styles.locationValue}>
                ±{currentLocation.accuracy.toFixed(0)}m
              </Text>
            </View>
          )}
          {currentLocation.speed !== null && currentLocation.speed !== undefined && currentLocation.speed > 0 && (
            <View style={styles.locationRow}>
              <Ionicons name="speedometer-outline" size={16} color="#64748B" />
              <Text style={styles.locationLabel}>Speed:</Text>
              <Text style={styles.locationValue}>
                {(currentLocation.speed * 3.6).toFixed(1)} km/h
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Control Button */}
      <TouchableOpacity
        style={[styles.button, isTracking && styles.buttonStop]}
        onPress={handleToggleTracking}
        activeOpacity={0.8}
      >
        {isTracking ? (
          <>
            <Ionicons name="stop-circle" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Stop Tracking</Text>
          </>
        ) : (
          <>
            <Ionicons name="play-circle" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Start Tracking</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={styles.infoText}>
        {isTracking
          ? 'Your location is being shared every 2 seconds'
          : 'Start tracking to share your live location'}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  liveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  locationInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 70,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  buttonStop: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
