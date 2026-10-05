// Firebase Cloud Messaging Service
// For use with Expo Development Build

import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

interface DeviceInfoType {
  deviceId: string;
  platform: 'ios' | 'android';
  deviceName: string;
  osVersion: string;
}

export const fcmService = {
  /**
   * Request notification permission from device
   */
  async requestPermission(): Promise<boolean> {
    // Android 13+ shows nothing until POST_NOTIFICATIONS is granted at runtime
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted');
      return true;
    }
    
    console.log('❌ Notification permission denied');
    return false;
  },

  /**
   * Get FCM token from Firebase
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('🔑 FCM Token:', token);
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  },

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DeviceInfoType> {
    const deviceId = Platform.OS === 'android' 
      ? Application.getAndroidId() || 'unknown'
      : await Application.getIosIdForVendorAsync() || 'unknown';
    
    const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
    const osVersion = Device.osVersion || 'Unknown';

    return {
      deviceId,
      platform: Platform.OS as 'ios' | 'android',
      deviceName,
      osVersion,
    };
  },
};
