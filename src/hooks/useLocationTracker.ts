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

  const getCurrentPosition = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return coords;
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (trackingStarted.current && socket) {
      socket.emit('tracking_end', { staffId, reason: 'manual' });
      trackingStarted.current = false;
    }
  }, [socket, staffId]);

  useEffect(() => {
    if (!socket || !active) {
      stopTracking();
      return;
    }

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ [Location] Permission denied');
        return;
      }

      const coords = await getCurrentPosition();

      const trackingData = {
        staffId,
        dutyId,
        hospitalId,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
      };
      
      console.log('🗺️ [TRACKING START]:', {
        staffId,
        dutyId,
        hospitalId,
        coordinates: { latitude: coords.latitude, longitude: coords.longitude },
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('tracking_start', trackingData);

      socket.once('tracking_started', () => {
        console.log('✅ [TRACKING] Started successfully');
        trackingStarted.current = true;

        intervalRef.current = setInterval(async () => {
          try {
            const { latitude, longitude, accuracy, speed } = await getCurrentPosition();
            const updateData = {
              staffId,
              coordinates: { latitude, longitude },
              accuracy: accuracy ?? undefined,
              speed: speed ?? undefined,
            };
            
            console.log('🗺️ [LOCATION UPDATE]:', {
              staffId,
              coordinates: { latitude, longitude },
              accuracy,
              speed,
              timestamp: new Date().toISOString()
            });
            
            socket.emit('location_update', updateData);
          } catch (e) {
            console.warn('⚠️ [GPS] Error:', e);
          }
        }, 2000);
      });
    };

    start();

    return () => {
      stopTracking();
    };
  }, [socket, active, dutyId, staffId, hospitalId]);
}