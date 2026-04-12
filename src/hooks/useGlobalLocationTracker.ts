// src/hooks/useGlobalLocationTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useSocket } from '@/context/SocketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Global location tracker that runs continuously when medical staff is logged in
 * Sends location updates every 2 seconds regardless of which page the user is on
 */
export function useGlobalLocationTracker() {
  const { socket, isConnected } = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingStarted = useRef(false);
  const staffIdRef = useRef<string | null>(null);

  const getCurrentPosition = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return coords;
  }, []);

  const getStaffId = useCallback(async () => {
    try {
      // Try to get staff ID from storage
      let staffId = await AsyncStorage.getItem('staffId');
      if (!staffId && Platform.OS === 'web') {
        staffId = localStorage.getItem('staffId');
      }
      if (!staffId) {
        staffId = await AsyncStorage.getItem('userId');
      }
      if (!staffId && Platform.OS === 'web') {
        staffId = localStorage.getItem('userId');
      }
      return staffId;
    } catch (error) {
      console.error('❌ [GlobalTracker] Error getting staff ID:', error);
      return null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (trackingStarted.current && socket && staffIdRef.current) {
      socket.emit('tracking_end', { staffId: staffIdRef.current, reason: 'logout' });
      trackingStarted.current = false;
    }
  }, [socket]);

  useEffect(() => {
    if (!socket || !isConnected) {
      stopTracking();
      return;
    }

    const startGlobalTracking = async () => {
      // Get staff ID
      const staffId = await getStaffId();
      if (!staffId) {
        console.log('⚠️ [GlobalTracker] No staff ID found, skipping tracking');
        return;
      }

      staffIdRef.current = staffId;

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ [GlobalTracker] Location permission denied');
        return;
      }

      // Get initial position
      const coords = await getCurrentPosition();

      const trackingData = {
        staffId,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
      };

      console.log('🗺️ [GLOBAL TRACKING START]:', {
        staffId,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
        timestamp: new Date().toISOString()
      });

      socket.emit('global_tracking_start', trackingData);

      // Wait for confirmation
      socket.once('global_tracking_started', () => {
        console.log('✅ [GlobalTracker] Started successfully');
        trackingStarted.current = true;

        // Start sending location updates every 2 seconds
        intervalRef.current = setInterval(async () => {
          try {
            const { latitude, longitude, accuracy, speed } = await getCurrentPosition();
            const updateData = {
              staffId,
              coordinates: { latitude, longitude },
              accuracy: accuracy ?? undefined,
              speed: speed ?? undefined,
            };

            console.log('🗺️ [GLOBAL LOCATION]:', {
              staffId,
              coordinates: { latitude, longitude },
              accuracy,
              timestamp: new Date().toISOString()
            });

            socket.emit('global_location_update', updateData);
          } catch (e) {
            console.warn('⚠️ [GlobalTracker] GPS error:', e);
          }
        }, 2000);
      });
    };

    startGlobalTracking();

    return () => {
      stopTracking();
    };
  }, [socket, isConnected, getStaffId, getCurrentPosition, stopTracking]);
}
