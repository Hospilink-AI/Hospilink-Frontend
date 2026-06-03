import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Configuration ──────────────────────────────────────────────────────
// const SOCKET_URL = 'https://hospilinkv1backend.vercel.app';
const SOCKET_URL = API_URL
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 3000;

// ─── Types ──────────────────────────────────────────────────────────────
interface LocationUpdate {
  staffId: string;
  dutyId?: string;
  hospitalId?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  speed?: number;
  timestamp?: number;
}

interface TrackingStartPayload {
  staffId: string;
  dutyId: string;
  hospitalId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface StaffLocationUpdate {
  staffId: string;
  dutyId: string;
  latitude: number;
  longitude: number;
  distance?: number;
  eta?: number;
  speed?: number;
  timestamp: number;
}

// ─── Socket Service Class ───────────────────────────────────────────────
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Get authentication token from storage
   */
  private async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('hospilink_token');
      } else {
        return await AsyncStorage.getItem('hospilink_token');
      }
    } catch (error) {
      console.error('🔴 [Socket] Error getting token:', error);
      return null;
    }
  }

  /**
   * Connect to WebSocket server with authentication
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('✅ [Socket] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ [Socket] Connection in progress...');
      return;
    }

    this.isConnecting = true;

    try {
      const token = await this.getToken();

      if (!token) {
        console.error('🔴 [Socket] No authentication token found');
        this.isConnecting = false;
        return;
      }

      console.log('🔌 [Socket] Connecting to:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
        reconnectionDelay: RECONNECTION_DELAY,
        timeout: 20000,
        forceNew: false,
        upgrade: true,
      });

      this.setupEventHandlers();

    } catch (error) {
      console.error('🔴 [Socket] Connection error:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ [Socket] Connected successfully. Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit('connection_status', { connected: true });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('🔴 [Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      this.isConnecting = false;

      if (this.reconnectAttempts >= RECONNECTION_ATTEMPTS) {
        console.error('🔴 [Socket] Max reconnection attempts reached');
        this.emit('connection_status', { connected: false, error: 'Max reconnection attempts reached' });
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ [Socket] Disconnected. Reason:', reason);
      this.emit('connection_status', { connected: false, reason });
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 [Socket] Reconnection attempt ${attempt}/${RECONNECTION_ATTEMPTS}`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ [Socket] Reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true, reconnected: true });
    });

    // Tracking started confirmation
    this.socket.on('tracking_started', (data) => {
      console.log('✅ [Socket] Tracking started:', data);
      this.emit('tracking_started', data);
    });

    // Location update confirmation
    this.socket.on('location_confirmed', (data) => {
      console.log('✅ [Socket] Location confirmed:', data);
      this.emit('location_confirmed', data);
    });

    // Staff location update (for hospital/admin)
    this.socket.on('staff_location_update', (data: StaffLocationUpdate) => {
      console.log('📍 [Socket] Staff location update:', data);
      this.emit('staff_location_update', data);
    });

    // Staff arrived notification
    this.socket.on('staff_arrived', (data) => {
      console.log('🎯 [Socket] Staff arrived:', data);
      this.emit('staff_arrived', data);
    });

    // Tracking ended confirmation
    this.socket.on('tracking_ended', (data) => {
      console.log('✅ [Socket] Tracking ended:', data);
      this.emit('tracking_ended', data);
    });

    // Error handling
    this.socket.on('tracking_error', (error) => {
      console.error('🔴 [Socket] Tracking error:', error);
      this.emit('tracking_error', error);
    });

    // Dashboard location confirmed
    this.socket.on('dashboard:location:confirmed', (data) => {
      console.log('✅ [Socket] Dashboard location confirmed:', data);
      this.emit('dashboard:location:confirmed', data);
    });
  }

  /**
   * Start tracking session
   */
  startTracking(payload: TrackingStartPayload): void {
    if (!this.socket?.connected) {
      console.error('🔴 [Socket] Cannot start tracking - not connected');
      return;
    }

    console.log('🚀 [Socket] Starting tracking:', payload);
    this.socket.emit('tracking_start', payload);
  }

  /**
   * Send location update
   */
  sendLocationUpdate(payload: LocationUpdate): void {
    if (!this.socket?.connected) {
      console.error('🔴 [Socket] Cannot send location - not connected');
      return;
    }

    console.log('📍 [Socket] Sending location update:', {
      staffId: payload.staffId,
      lat: payload.coordinates.latitude.toFixed(6),
      lng: payload.coordinates.longitude.toFixed(6),
    });

    this.socket.emit('location_update', {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    });
  }

  /**
   * End tracking session
   */
  endTracking(staffId: string, reason: string = 'manual'): void {
    if (!this.socket?.connected) {
      console.error('🔴 [Socket] Cannot end tracking - not connected');
      return;
    }

    console.log('🛑 [Socket] Ending tracking:', { staffId, reason });
    this.socket.emit('tracking_end', { staffId, reason });
  }

  /**
   * Join hospital tracking room (for hospital/admin)
   */
  joinTrackingRoom(hospitalId: string): void {
    if (!this.socket?.connected) {
      console.error('🔴 [Socket] Cannot join room - not connected');
      return;
    }

    console.log('🏥 [Socket] Joining hospital tracking room:', hospitalId);
    this.socket.emit('join_tracking_room', { hospitalId });
  }

  /**
   * Leave hospital tracking room
   */
  leaveTrackingRoom(hospitalId: string): void {
    if (!this.socket?.connected) {
      console.error('🔴 [Socket] Cannot leave room - not connected');
      return;
    }

    console.log('🚪 [Socket] Leaving hospital tracking room:', hospitalId);
    this.socket.emit('leave_tracking_room', { hospitalId });
  }

  /**
 * Send dashboard location grant
 */
sendDashboardLocation(latitude: number, longitude: number): void {
  if (!this.socket?.connected) {
    console.error('🔴 [Socket] Cannot send dashboard location - not connected');
    return;
  }

  console.log('📍 [Socket] Sending dashboard location:', { latitude, longitude });
  this.socket.emit('dashboard:location:grant', { latitude, longitude });
}


  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to registered listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }



  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 [Socket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}



// ─── Export Singleton Instance ──────────────────────────────────────────
export const socketService = new SocketService();
export default socketService;
