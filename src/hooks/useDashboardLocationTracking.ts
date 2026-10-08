import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useSocket } from '@/context/SocketContext';
import { profileAPI } from '@/service/api';

// enabled: false until the doctor has seen why the app asks for location
export function useDashboardLocationTracking({ enabled = true }: { enabled?: boolean } = {}) {
  const { socket, isConnected } = useSocket();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestAndSendLocation = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const permissionStatus = await navigator.permissions?.query({ 
          name: 'geolocation' as PermissionName 
        });

        if (permissionStatus?.state === 'granted' || permissionStatus?.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              console.log('✅ Dashboard location obtained:', { latitude, longitude });
              
              // Step 1: Send HTTP request (only permission status)
              await profileAPI.sendDashboardLocationPermission(true);
              console.log('✅ HTTP API call completed');
              
              // Step 2: Send WebSocket event with coordinates
              if (socket && isConnected) {
                console.log('📍 [Socket] Sending dashboard location:', { latitude, longitude });
                socket.emit('dashboard:location:grant', { latitude, longitude });
              } else {
                console.warn('⚠️ Socket not connected, skipping WebSocket emit');
              }
              
              setPermissionGranted(true);
            },
            async (error) => {
              console.log('❌ Location permission denied:', error);
              await profileAPI.sendDashboardLocationPermission(false);
              setPermissionGranted(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          console.log('❌ Location permission not granted');
          await profileAPI.sendDashboardLocationPermission(false);
          setPermissionGranted(false);
        }
      } else {
        // React Native (Expo)
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          const { latitude, longitude } = location.coords;
          
          console.log('✅ Dashboard location obtained:', { latitude, longitude });
          
          // Step 1: Send HTTP request (only permission status)
          await profileAPI.sendDashboardLocationPermission(true);
          console.log('✅ HTTP API call completed');
          
          // Step 2: Send WebSocket event with coordinates
          if (socket && isConnected) {
            console.log('📍 [Socket] Sending dashboard location:', { latitude, longitude });
            socket.emit('dashboard:location:grant', { latitude, longitude });
          } else {
            console.warn('⚠️ Socket not connected, skipping WebSocket emit');
          }
          
          setPermissionGranted(true);
        } else {
          console.log('❌ Location permission denied');
          await profileAPI.sendDashboardLocationPermission(false);
          setPermissionGranted(false);
        }
      }
    } catch (error) {
      console.error('❌ Error sending dashboard location:', error);
      await profileAPI.sendDashboardLocationPermission(false);
      setPermissionGranted(false);
    }
  }, [socket, isConnected]);

  // Listen for confirmation from server
  useEffect(() => {
    if (!socket) return;

    const handleConfirmation = (data: any) => {
      console.log('✅ [Dashboard] Location confirmed by server:', data);
    };

    socket.on('dashboard:location:confirmed', handleConfirmation);

    return () => {
      socket.off('dashboard:location:confirmed', handleConfirmation);
    };
  }, [socket]);

  // Initial request on mount
  useEffect(() => {
    if (isConnected && enabled) {
      console.log('🔄 Initial location request...');
      requestAndSendLocation();
    }
  }, [isConnected, enabled, requestAndSendLocation]);

  // Periodic updates every 30 seconds
  useEffect(() => {
    if (permissionGranted && isConnected && enabled) {
      console.log('⏰ Starting 30-second interval for location updates');
      intervalRef.current = setInterval(() => {
        console.log('🔄 30-second update triggered');
        requestAndSendLocation();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        console.log('🛑 Clearing location update interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [permissionGranted, isConnected, enabled, requestAndSendLocation]);

  return { permissionGranted, requestAndSendLocation };
}
