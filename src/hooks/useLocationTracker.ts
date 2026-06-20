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
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoordsRef = useRef<Location.LocationObjectCoords | null>(null);
  const trackingStarted = useRef(false);

  const getCurrentPosition = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    return coords;
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    lastCoordsRef.current = null;
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
      lastCoordsRef.current = coords;

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

      // Keep lastCoordsRef updated with the device's live position as it
      // changes, instead of requesting a brand-new GPS fix on every emit
      // (which can take several seconds and lag behind the real position).
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          lastCoordsRef.current = location.coords;
        }
      );

      socket.once('tracking_started', () => {
        console.log('✅ [TRACKING] Started successfully');
        trackingStarted.current = true;

        intervalRef.current = setInterval(() => {
          if (!lastCoordsRef.current) return;

          const { latitude, longitude, accuracy, speed } = lastCoordsRef.current;
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
        }, 2000);
      });
    };

    start();

    return () => {
      stopTracking();
    };
  }, [socket, active, dutyId, staffId, hospitalId]);
}