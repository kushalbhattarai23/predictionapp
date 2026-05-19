import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema, ActionPerformed } from '@capacitor/local-notifications';
import { usePushNotifications } from './usePushNotifications';

export interface NotificationPayload {
  id?: number;
  title: string;
  body: string;
  route?: string;
  type?: string;
  data?: Record<string, any>;
}

export const useNotificationHandler = () => {
  const navigate = useNavigate();
  const { isRegistered: isPushRegistered, pushToken, register: registerPush } = usePushNotifications();

  const handleNotificationAction = useCallback((route?: string, type?: string, data?: Record<string, any>) => {
    console.log('Handling notification action:', { route, type, data });

    if (route) {
      navigate(route);
      return;
    }

    // Handle based on type
    switch (type) {
      case 'scheduled_payment':
      case 'scheduled_payment_executed':
        navigate('/finance/scheduled-payments');
        break;
      case 'scheduled_payment_reminder':
        navigate('/finance/scheduled-payments');
        break;
      case 'transaction_added':
        navigate('/finance/transactions');
        break;
      case 'network_invite':
        navigate('/settlebill/networks');
        break;
      case 'bill_created':
      case 'bill_reminder':
        if (data?.billId) {
          navigate(`/settlebill/bills/${data.billId}`);
        } else {
          navigate('/settlebill/bills');
        }
        break;
      case 'payment_reminder':
        navigate('/settlebill');
        break;
      default:
        navigate('/finance/notifications');
    }
  }, [navigate]);

  const scheduleLocalNotification = useCallback(async (notification: NotificationPayload) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.body });
      }
      return;
    }

    try {
      const id = notification.id || Date.now();
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: notification.title,
            body: notification.body,
            sound: 'default',
            extra: {
              route: notification.route,
              type: notification.type,
              ...notification.data,
            },
          },
        ],
      });

      console.log('Local notification scheduled:', id);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }, []);

  const scheduleNotificationAt = useCallback(async (notification: NotificationPayload, at: Date) => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Scheduled notifications not supported on web');
      return;
    }

    try {
      const id = notification.id || Date.now();

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: notification.title,
            body: notification.body,
            schedule: { at },
            sound: 'default',
            extra: {
              route: notification.route,
              type: notification.type,
              ...notification.data,
            },
          },
        ],
      });

      console.log('Local notification scheduled for:', at.toISOString());
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, []);

  const cancelNotification = useCallback(async (id: number) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log('Notification cancelled:', id);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Request permissions for local notifications
    const requestPermissions = async () => {
      const permission = await LocalNotifications.requestPermissions();
      console.log('Local notification permission:', permission);
    };

    requestPermissions();

    // Listen for local notification received (foreground)
    const receivedListener = LocalNotifications.addListener(
      'localNotificationReceived',
      (notification: LocalNotificationSchema) => {
        console.log('Local notification received:', notification);
      }
    );

    // Listen for notification action (user tapped)
    const actionListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Local notification action performed:', action);
        const extra = action.notification.extra;
        handleNotificationAction(extra?.route, extra?.type, extra);
      }
    );

    return () => {
      receivedListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [handleNotificationAction]);

  return {
    isPushRegistered,
    pushToken,
    registerPush,
    scheduleLocalNotification,
    scheduleNotificationAt,
    cancelNotification,
    cancelAllNotifications,
    handleNotificationAction,
  };
};
