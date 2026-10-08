// Push notifications for the Android / iOS app (Firebase Cloud Messaging).
// The web app gets notifications in-app instead (see NotificationContext.web.tsx).

import React, { createContext, useCallback, useContext, useEffect } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { usePathname, useRouter } from 'expo-router';
import { notifyExplained } from '@/doctor/permissions';
import { fcmService } from '@/service/fcm';
import { inAppNotificationAPI, notificationAPI } from '@/service/api';
import { useAuth } from './AuthContext';
import { Base, routeFor } from '@/constant/inAppNotifications';
import { useInAppNotifications } from './InAppNotificationsContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

const baseFor = (role?: string): Base => (role === 'admin' ? 'admin' : role === 'hospital' ? 'hospital' : 'medicalStaff');

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const router = useRouter();
  const inOnboarding = /^\/(auth|profile)(\/|$)/.test(usePathname());
  const { unread, refreshUnread } = useInAppNotifications();

  // Push data only carries type, notificationId and dutyId: look the notification up for where it opens
  const openFromPush = useCallback(
    async (data: Record<string, any> = {}) => {
      const base = baseFor(user?.role);
      let route: string | null = null;
      try {
        if (data.notificationId) {
          const res = await inAppNotificationAPI.list(50, 0);
          const n = (res?.data ?? []).find((x: any) => String(x._id) === String(data.notificationId));
          if (n) {
            if (!n.isRead) inAppNotificationAPI.markRead(n._id).catch(() => {});
            route = routeFor(n, base);
          }
        }
      } catch {
        // fall through to the duty or the notification list
      }
      if (!route && data.dutyId) route = base === 'admin' ? '/admin/duty-overnight' : `/${base}/dutyDetails/${data.dutyId}`;
      router.push((route ?? `/${base}/notifications`) as any);
      refreshUnread();
    },
    [user?.role, router, refreshUnread]
  );

  // Token refresh
  useEffect(() => {
    if (!user || !token) return;
    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      const deviceInfo = await fcmService.getDeviceInfo();
      try {
        await notificationAPI.registerFCMToken(newToken, deviceInfo.deviceId, deviceInfo.platform);
      } catch (error) {
        console.error('Failed to register refreshed FCM token:', error);
      }
    });
    return unsubscribe;
  }, [user, token]);

  // Register, and handle messages and taps
  useEffect(() => {
    if (!user || !token) return;

    registerForPushNotifications();

    // In the foreground the socket shows the pop-up; just keep the bell count right
    const unsubscribeForeground = messaging().onMessage(async (_remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      refreshUnread();
    });

    // Tapped while the app was in the background
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      openFromPush(remoteMessage.data ?? {});
    });

    // Tapped while the app was closed: wait for the router to be ready
    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) setTimeout(() => openFromPush(remoteMessage.data ?? {}), 600);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, inOnboarding]);

  const registerForPushNotifications = async () => {
    // During onboarding doctors are asked on the "ready" screen, after we explain why
    if (user?.role === 'staff' && inOnboarding && !(await notifyExplained())) return;
    const hasPermission = await fcmService.requestPermission();
    if (!hasPermission) return;

    const fcmToken = await fcmService.getFCMToken();
    if (!fcmToken) return;

    const deviceInfo = await fcmService.getDeviceInfo();
    try {
      await notificationAPI.registerFCMToken(fcmToken, deviceInfo.deviceId, deviceInfo.platform);
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount: unread, refreshUnreadCount: refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
