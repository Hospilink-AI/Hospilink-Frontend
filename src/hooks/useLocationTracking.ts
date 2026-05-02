import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { socketService } from '../service/socket';

// ─── Types ──────────────────────────────────────────────────────────────
interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  altitude?: number | null;
  heading?: number | null;
}

interface UseLocationTrackingProps {
  staffId: string;
  dutyId?: string;
  hospitalId?: string;
  enabled?: boolean;
  updateInterval?: number; // milliseconds
}

interface UseLocationTrackingReturn {
  isTracking: boolean;
  currentLocation: LocationCoordinates | null;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  requestPermission: () => Promise<boolean>;
}

// ─── Constants ──────────────────────────────────────────────────────────
const DEFAULT_UPDATE_INTERVAL = 2000; // 2 seconds
const LOCATION_ACCURACY = Location.Accuracy.BestForNavigation;

// ─── Hook ───────────────────────────────────────────────────────────────
export function useLocationTracking({
  staffId,
  dutyId,
  hospitalId,
  enabled = false,
  updateInterval = DEFAULT_UPDATE_INTERVAL,
}: UseLocationTrackingProps): UseLocationTrackingReturn {
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationCoordinates | null>(null);
  const isTrackingRef = useRef(false);

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('📍 [LocationTracking] Requesting location permission...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Location permission denied. Please enable location access in settings.');
        console.error('🔴 [LocationTracking] Permission denied');
        return false;
      }

      console.log('✅ [LocationTracking] Permission granted');
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      console.error('🔴 [LocationTracking] Permission error:', err);
      return false;
    }
  }, []);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: LOCATION_ACCURACY,
        timeInterval: updateInterval,
      });

      const coords: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
      };

      return coords;
    } catch (err) {
      console.error('🔴 [LocationTracking] Error getting location:', err);
      return null;
    }
  }, [updateInterval]);

  /**
   * Send location update via WebSocket
   */
  const sendLocationUpdate = useCallback((coords: LocationCoordinates) => {
    if (!socketService.isConnected()) {
      console.warn('⚠️ [LocationTracking] Socket not connected, skipping location update');
      return;
    }

    socketService.sendLocationUpdate({
      staffId,
      dutyId,
      hospitalId,
      coordinates: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      accuracy: coords.accuracy,
      speed: coords.speed || undefined,
      timestamp: Date.now(),
    });

    console.log('📍 [LocationTracking] Location sent:', {
      lat: coords.latitude.toFixed(6),
      lng: coords.longitude.toFixed(6),
      accuracy: coords.accuracy?.toFixed(2),
    });
  }, [staffId, dutyId, hospitalId]);

  /**
   * Start location tracking
   */
  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) {
      console.log('⚠️ [LocationTracking] Already tracking');
      return;
    }

    console.log('🚀 [LocationTracking] Starting location tracking...');

    // Check permission
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return;
    }

    // Connect to socket if not connected
    if (!socketService.isConnected()) {
      console.log('🔌 [LocationTracking] Connecting to socket...');
      await socketService.connect();
      
      // Wait for connection
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (socketService.isConnected()) {
            clearInterval(checkConnection);
            resolve(true);
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          resolve(false);
        }, 10000);
      });
    }

    if (!socketService.isConnected()) {
      setError('Failed to connect to tracking server');
      console.error('🔴 [LocationTracking] Socket connection failed');
      return;
    }

    try {
      // Get initial location
      const initialLocation = await getCurrentLocation();
      if (!initialLocation) {
        setError('Failed to get initial location');
        return;
      }

      setCurrentLocation(initialLocation);
      lastLocationRef.current = initialLocation;

      // Start tracking session on server
      if (dutyId && hospitalId) {
        socketService.startTracking({
          staffId,
          dutyId,
          hospitalId,
          coordinates: {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
          },
        });
      }

      // Send initial location
      sendLocationUpdate(initialLocation);

      // Start location subscription for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: LOCATION_ACCURACY,
          timeInterval: updateInterval,
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          const coords: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            speed: location.coords.speed,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
          };

          setCurrentLocation(coords);
          lastLocationRef.current = coords;
        }
      );

      // Start interval to send location updates every 2 seconds
      updateIntervalRef.current = setInterval(() => {
        if (lastLocationRef.current && isTrackingRef.current) {
          sendLocationUpdate(lastLocationRef.current);
        }
      }, updateInterval);

      isTrackingRef.current = true;
      setIsTracking(true);
      setError(null);
      console.log('✅ [LocationTracking] Tracking started successfully');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(errorMsg);
      console.error('🔴 [LocationTracking] Start tracking error:', err);
      stopTracking();
    }
  }, [staffId, dutyId, hospitalId, updateInterval, requestPermission, getCurrentLocation, sendLocationUpdate]);

  /**
   * Stop location tracking
   */
  const stopTracking = useCallback(() => {
    console.log('🛑 [LocationTracking] Stopping location tracking...');

    // Clear interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Remove location subscription
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // End tracking session on server
    if (socketService.isConnected()) {
      socketService.endTracking(staffId, 'manual');
    }

    isTrackingRef.current = false;
    setIsTracking(false);
    console.log('✅ [LocationTracking] Tracking stopped');
  }, [staffId]);

  /**
   * Auto-start tracking when enabled
   */
  useEffect(() => {
    if (enabled && !isTrackingRef.current) {
      startTracking();
    } else if (!enabled && isTrackingRef.current) {
      stopTracking();
    }
  }, [enabled, startTracking, stopTracking]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        stopTracking();
      }
    };
  }, [stopTracking]);

  /**
   * Handle app state changes (pause tracking when app goes to background)
   */
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && isTrackingRef.current) {
        console.log('⏸️ [LocationTracking] App in background, pausing updates');
        // Keep tracking but reduce frequency
      } else if (nextAppState === 'active' && isTrackingRef.current) {
        console.log('▶️ [LocationTracking] App active, resuming updates');
      }
    };

    // Note: AppState listener would be added here for React Native
    // For now, we'll keep it simple

    return () => {
      // Cleanup listener
    };
  }, []);

  return {
    isTracking,
    currentLocation,
    error,
    permissionStatus,
    startTracking,
    stopTracking,
    requestPermission,
  };
}

export default useLocationTracking;
