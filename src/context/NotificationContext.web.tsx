// Web: no browser push. Notifications arrive in-app (pop-ups and the bell, see InAppNotificationsContext).
import React, { createContext, useContext } from 'react';
import { useInAppNotifications } from './InAppNotificationsContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { unread, refreshUnread } = useInAppNotifications();
  return (
    <NotificationContext.Provider value={{ unreadCount: unread, refreshUnreadCount: refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
