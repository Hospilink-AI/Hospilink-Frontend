// src/hooks/useTrackingReceiver.ts
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';

interface LiveLocation {
  latitude: number;
  longitude: number;
  distanceToHospital?: number;
  estimatedArrival?: number;
  timestamp?: number;
}

interface UseTrackingReceiverOptions {
  /** Pass dutyId to watch a specific staff member */
  dutyId?: string;
  /** Pass hospitalId to watch all staff heading to a hospital */
  hospitalId?: string;
}

/**
 * Returns a map of staffId → latest LiveLocation.
 * Re-renders only when coordinates actually change.
 */
export function useTrackingReceiver({ dutyId, hospitalId }: UseTrackingReceiverOptions) {
  const { socket, isConnected } = useSocket();
  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});

  console.log('📡 [useTrackingReceiver] Hook initialized with:', { dutyId, hospitalId, socketConnected: !!socket, isConnected });

  const handleUpdate = useCallback((data: any) => {
    console.log('📥 [useTrackingReceiver] Received staff_location_update:', data);
    console.log('🔍 [ADMIN LOCATION SOURCE CHECK] Raw data from backend:', {
      hasStaffId: !!data?.staffId,
      hasCoordinates: !!data?.coordinates,
      dataSource: data?.source || 'UNKNOWN',
      isFromRedis: data?.fromRedis || false,
      isFromProfile: data?.fromProfile || false,
      timestamp: data?.timestamp,
      fullData: data
    });
    
    // Server emits: { staffId, coordinates, distanceToHospital, estimatedArrival, timestamp }
    if (!data?.staffId || !data?.coordinates) {
      console.log('⚠️ [useTrackingReceiver] Invalid data received, missing staffId or coordinates');
      return;
    }
    const locationData = {
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
      distanceToHospital: data.distanceToHospital,
      estimatedArrival: data.estimatedArrival,
      timestamp: data.timestamp,
    };
    console.log('✅ [useTrackingReceiver] Updating location for staffId:', data.staffId, locationData);
    console.log('🗺️ [ADMIN COORDINATE SOURCE]:', {
      source: data?.source || (data?.fromRedis ? 'REDIS_CACHE' : data?.fromProfile ? 'PROFILE_DB' : 'WEBSOCKET_LIVE'),
      coordinates: locationData,
      staffId: data.staffId
    });
    setLocations(prev => ({
      ...prev,
      [data.staffId]: locationData,
    }));
  }, []);

  useEffect(() => {
    console.log('🔄 [useTrackingReceiver] Effect triggered - Socket:', !!socket, 'Connected:', isConnected);
    
    if (!socket || !isConnected) {
      console.log('⚠️ [useTrackingReceiver] Socket not ready, skipping room join');
      return;
    }

    // Join the right room
    if (dutyId) {
      console.log('📤 [useTrackingReceiver] Joining admin tracking room for dutyId:', dutyId);
      socket.emit('join_admin_tracking', { dutyId });
      
      // Listen for confirmation
      socket.once('admin_tracking_joined', (data: any) => {
        console.log('✅ [useTrackingReceiver] Successfully joined admin tracking room:', data);
      });
    }
    if (hospitalId) {
      console.log('📤 [useTrackingReceiver] Joining hospital tracking room for hospitalId:', hospitalId);
      socket.emit('join_hospital_tracking', { hospitalId });
    }

    console.log('🎯 [useTrackingReceiver] Registering event listeners');
    
    // Listen for ALL possible event names to debug
    socket.on('staff_location_update', handleUpdate);
    socket.on('location_update', (data: any) => {
      console.log('📥 [useTrackingReceiver] Received location_update (alternative event):', data);
      handleUpdate(data);
    });
    socket.on('staff_arrived', (data: any) => {
      console.log('🎯 [useTrackingReceiver] Staff arrived:', data);
    });

    // Debug: Log all socket events
    const originalOnevent = socket.onevent;
    socket.onevent = function(packet: any) {
      console.log('🔔 [Socket Debug] Received event:', packet.data);
      originalOnevent.call(this, packet);
    };

    return () => {
      console.log('🧹 [useTrackingReceiver] Cleanup - removing event listeners');
      socket.off('staff_location_update', handleUpdate);
      socket.off('location_update');
      socket.off('staff_arrived');
      socket.onevent = originalOnevent;
    };
  }, [socket, isConnected, dutyId, hospitalId, handleUpdate]);

  console.log('📊 [useTrackingReceiver] Current locations state:', locations);
  return locations;
}