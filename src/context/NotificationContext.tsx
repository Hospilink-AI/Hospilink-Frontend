// Notification Context with Firebase Cloud Messaging
// For use with Expo Development Build

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import { fcmService } from '@/service/fcm';
import { notificationAPI } from '@/service/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const router = useRouter();
  const unsubscribeForeground = useRef<(() => void) | null>(null);

  // Handle FCM token refresh
  useEffect(() => {
    if (!user || !token) return;

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM token refreshed:', newToken);
      const deviceInfo = await fcmService.getDeviceInfo();
      
      try {
        await notificationAPI.registerFCMToken(
          newToken,
          deviceInfo.deviceId,
          deviceInfo.platform
        );
        console.log('✅ Refreshed FCM token registered successfully');
      } catch (error) {
        console.error('❌ Failed to register refreshed FCM token:', error);
      }
    });

    return () => unsubscribeTokenRefresh();
  }, [user, token]);

  // Register token and handle notifications
  useEffect(() => {
    if (!user || !token) return;

    registerForPushNotifications();

    // Foreground notification handler
    unsubscribeForeground.current = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('📱 Foreground notification:', remoteMessage);
        setUnreadCount((prev) => prev + 1);
      }
    );

    // Handle notification tap when app is in background
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('👆 Notification opened app from background:', remoteMessage);
        if (remoteMessage.data) {
          handleNotificationTap(remoteMessage.data);
        }
      }
    );

    // Handle notification tap when app was closed/killed
    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          console.log('🚀 App opened from notification (killed state):', remoteMessage);
          if (remoteMessage.data) {
            handleNotificationTap(remoteMessage.data);
          }
        }
      });

    return () => {
      if (unsubscribeForeground.current) {
        unsubscribeForeground.current();
      }
      unsubscribeNotificationOpened();
    };
  }, [user, token]);

  const registerForPushNotifications = async () => {
    const hasPermission = await fcmService.requestPermission();
    if (!hasPermission) {
      console.log('⚠️ Notification permission denied');
      return;
    }

    const fcmToken = await fcmService.getFCMToken();
    if (!fcmToken) {
      console.log('⚠️ Failed to get FCM token');
      return;
    }

    const deviceInfo = await fcmService.getDeviceInfo();

    try {
      await notificationAPI.registerFCMToken(
        fcmToken,
        deviceInfo.deviceId,
        deviceInfo.platform
      );
      console.log('✅ FCM token registered successfully');
    } catch (error) {
      console.error('❌ Failed to register FCM token:', error);
    }
  };

  const handleNotificationTap = (data: any) => {
    const { type, dutyId } = data;

    console.log('🔔 Handling notification tap:', { type, dutyId });

    switch (type) {
      case 'NEW_DUTY_OFFER':
      case 'EMERGENCY_DUTY_REQUEST':
        if (dutyId) router.push(`/medicalStaff/duty-details?id=${dutyId}` as any);
        break;
      case 'DUTY_CONFIRMED':
      case 'STAFF_ASSIGNED':
        router.push('/medicalStaff/my-duties' as any);
        break;
      case 'NAVIGATE_TO_DUTY':
        if (dutyId) router.push(`/medicalStaff/navigation?dutyId=${dutyId}` as any);
        break;
      case 'DUTY_CANCELLED_BY_HOSPITAL':
      case 'DUTY_CANCELLED_BY_STAFF':
      case 'DUTY_EDITED':
        if (dutyId) router.push(`/medicalStaff/duty-details?id=${dutyId}` as any);
        break;
      case 'DOCUMENT_VERIFIED':
      case 'DOCUMENT_REJECTED':
        router.push('/profile/document-upload' as any);
        break;
      default:
        router.push('/medicalStaff/notifications' as any);
    }
  };

  const refreshUnreadCount = async () => {
    // TODO: Implement API call to get unread count
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
