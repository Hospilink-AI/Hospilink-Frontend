import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../service/socket';

// ─── Types ──────────────────────────────────────────────────────────────
interface StaffLocation {
  staffId: string;
  dutyId: string;
  latitude: number;
  longitude: number;
  distance?: number;
  eta?: number;
  speed?: number;
  timestamp: number;
  lastUpdate: Date;
}

interface UseLocationListenerProps {
  hospitalId: string;
  enabled?: boolean;
}

interface UseLocationListenerReturn {
  staffLocations: Map<string, StaffLocation>;
  arrivedStaff: Set<string>;
  isConnected: boolean;
  error: string | null;
  getStaffLocation: (staffId: string) => StaffLocation | undefined;
  hasStaffArrived: (staffId: string) => boolean;
  clearStaffLocation: (staffId: string) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────
export function useLocationListener({
  hospitalId,
  enabled = true,
}: UseLocationListenerProps): UseLocationListenerReturn {
  
  const [staffLocations, setStaffLocations] = useState<Map<string, StaffLocation>>(new Map());
  const [arrivedStaff, setArrivedStaff] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffLocationsRef = useRef<Map<string, StaffLocation>>(new Map());
  const arrivedStaffRef = useRef<Set<string>>(new Set());

  /**
   * Handle connection status changes
   */
  const handleConnectionStatus = useCallback((data: { connected: boolean; error?: string; reason?: string }) => {
    setIsConnected(data.connected);
    
    if (!data.connected) {
      if (data.error) {
        setError(data.error);
        console.error('🔴 [LocationListener] Connection error:', data.error);
      } else if (data.reason) {
        console.log('⚠️ [LocationListener] Disconnected:', data.reason);
      }
    } else {
      setError(null);
      console.log('✅ [LocationListener] Connected to tracking server');
    }
  }, []);

  /**
   * Handle staff location updates
   */
  const handleStaffLocationUpdate = useCallback((data: StaffLocation) => {
    console.log('📍 [LocationListener] Staff location update:', {
      staffId: data.staffId,
      lat: data.latitude.toFixed(6),
      lng: data.longitude.toFixed(6),
      distance: data.distance ? `${(data.distance / 1000).toFixed(2)} km` : 'N/A',
      eta: data.eta ? `${Math.round(data.eta / 60)} min` : 'N/A',
    });

    const locationData: StaffLocation = {
      ...data,
      lastUpdate: new Date(),
    };

    // Update ref
    staffLocationsRef.current.set(data.staffId, locationData);
    
    // Update state
    setStaffLocations(new Map(staffLocationsRef.current));
  }, []);

  /**
   * Handle staff arrival
   */
  const handleStaffArrived = useCallback((data: { staffId: string; dutyId: string }) => {
    console.log('🎯 [LocationListener] Staff arrived:', data);

    // Add to arrived set
    arrivedStaffRef.current.add(data.staffId);
    setArrivedStaff(new Set(arrivedStaffRef.current));

    // Remove from active tracking
    staffLocationsRef.current.delete(data.staffId);
    setStaffLocations(new Map(staffLocationsRef.current));
  }, []);

  /**
   * Handle tracking errors
   */
  const handleTrackingError = useCallback((errorData: { message: string; staffId?: string }) => {
    console.error('🔴 [LocationListener] Tracking error:', errorData);
    setError(errorData.message);
  }, []);

  /**
   * Get specific staff location
   */
  const getStaffLocation = useCallback((staffId: string): StaffLocation | undefined => {
    return staffLocationsRef.current.get(staffId);
  }, []);

  /**
   * Check if staff has arrived
   */
  const hasStaffArrived = useCallback((staffId: string): boolean => {
    return arrivedStaffRef.current.has(staffId);
  }, []);

  /**
   * Clear specific staff location
   */
  const clearStaffLocation = useCallback((staffId: string) => {
    staffLocationsRef.current.delete(staffId);
    setStaffLocations(new Map(staffLocationsRef.current));
    
    arrivedStaffRef.current.delete(staffId);
    setArrivedStaff(new Set(arrivedStaffRef.current));
  }, []);

  /**
   * Initialize socket connection and listeners
   */
  useEffect(() => {
    if (!enabled) return;

    console.log('🔌 [LocationListener] Initializing for hospital:', hospitalId);

    // Connect to socket
    const initializeSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        // Wait for connection
        const waitForConnection = new Promise<boolean>((resolve) => {
          const checkInterval = setInterval(() => {
            if (socketService.isConnected()) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 500);

          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 10000);
        });

        const connected = await waitForConnection;
        
        if (connected) {
          // Join hospital tracking room
          socketService.joinTrackingRoom(hospitalId);
          console.log('✅ [LocationListener] Joined hospital tracking room');
        } else {
          setError('Failed to connect to tracking server');
          console.error('🔴 [LocationListener] Connection timeout');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize socket';
        setError(errorMsg);
        console.error('🔴 [LocationListener] Initialization error:', err);
      }
    };

    initializeSocket();

    // Register event listeners
    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('staff_location_update', handleStaffLocationUpdate);
    socketService.on('staff_arrived', handleStaffArrived);
    socketService.on('tracking_error', handleTrackingError);

    // Cleanup
    return () => {
      console.log('🧹 [LocationListener] Cleaning up...');
      
      // Leave tracking room
      if (socketService.isConnected()) {
        socketService.leaveTrackingRoom(hospitalId);
      }

      // Unregister event listeners
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('staff_location_update', handleStaffLocationUpdate);
      socketService.off('staff_arrived', handleStaffArrived);
      socketService.off('tracking_error', handleTrackingError);
    };
  }, [enabled, hospitalId, handleConnectionStatus, handleStaffLocationUpdate, handleStaffArrived, handleTrackingError]);

  /**
   * Clean up stale locations (older than 5 minutes)
   */
  useEffect(() => {
    if (!enabled) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      let hasStaleData = false;

      staffLocationsRef.current.forEach((location, staffId) => {
        if (now - location.lastUpdate.getTime() > staleThreshold) {
          console.log('🧹 [LocationListener] Removing stale location:', staffId);
          staffLocationsRef.current.delete(staffId);
          hasStaleData = true;
        }
      });

      if (hasStaleData) {
        setStaffLocations(new Map(staffLocationsRef.current));
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [enabled]);

  return {
    staffLocations,
    arrivedStaff,
    isConnected,
    error,
    getStaffLocation,
    hasStaffArrived,
    clearStaffLocation,
  };
}

export default useLocationListener;
