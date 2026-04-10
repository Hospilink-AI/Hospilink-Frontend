// src/hooks/useLocationTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useSocket } from '@/context/SocketContext';

interface TrackerOptions {
  dutyId: string;
  staffId: string;
  hospitalId: string;
  /** Only track when status is 'enroute' or 'in-progress' */
  active: boolean;
}

export function useLocationTracker({ dutyId, staffId, hospitalId, active }: TrackerOptions) {
  const { socket } = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingStarted = useRef(false);

  console.log('📍 [useLocationTracker] Hook initialized with:', { dutyId, staffId, hospitalId, active, socketConnected: !!socket });

  const getCurrentPosition = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return coords;
  }, []);

  const stopTracking = useCallback(() => {
    console.log('🛑 [useLocationTracker] Stopping tracking...');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('✅ [useLocationTracker] Interval cleared');
    }
    if (trackingStarted.current && socket) {
      console.log('📤 [useLocationTracker] Emitting tracking_end event');
      socket.emit('tracking_end', { staffId, reason: 'manual' });
      trackingStarted.current = false;
    }
  }, [socket, staffId]);

  useEffect(() => {
    console.log('🔄 [useLocationTracker] Effect triggered - Socket:', !!socket, 'Active:', active);
    
    if (!socket || !active) {
      console.log('⚠️ [useLocationTracker] Conditions not met for tracking');
      stopTracking();
      return;
    }

    const start = async () => {
      console.log('🚀 [useLocationTracker] Starting location tracking...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 [useLocationTracker] Permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ [useLocationTracker] Location permission denied');
        return;
      }

      console.log('📍 [useLocationTracker] Getting initial position...');
      const coords = await getCurrentPosition();
      console.log('✅ [useLocationTracker] Initial position:', coords.latitude, coords.longitude);

      const trackingData = {
        staffId,
        dutyId,
        hospitalId,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
      };
      console.log('📤 [useLocationTracker] Emitting tracking_start:', trackingData);
      socket.emit('tracking_start', trackingData);

      socket.once('tracking_started', () => {
        console.log('✅ [useLocationTracker] Received tracking_started confirmation from server');
        trackingStarted.current = true;

        console.log('⏱️ [useLocationTracker] Starting 2-second interval for location updates');
        intervalRef.current = setInterval(async () => {
          try {
            const { latitude, longitude, accuracy, speed } = await getCurrentPosition();
            const updateData = {
              staffId,
              coordinates: { latitude, longitude },
              accuracy: accuracy ?? undefined,
              speed: speed ?? undefined,
            };
            console.log('📤 [useLocationTracker] Emitting location_update:', updateData);
            socket.emit('location_update', updateData);
          } catch (e) {
            console.warn('⚠️ [useLocationTracker] GPS error:', e);
          }
        }, 2000);
      });
    };

    start();

    return () => {
      console.log('🧹 [useLocationTracker] Cleanup - stopping tracking');
      stopTracking();
    };
  }, [socket, active, dutyId, staffId, hospitalId]);
}