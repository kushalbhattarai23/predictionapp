
import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  schedule?: {
    at?: Date;
    repeats?: boolean;
  };
}

export const useNotifications = () => {
  useEffect(() => {
    // Initialize notifications on component mount
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform, notifications will not work');
      return;
    }

    try {
      // Request permission for notifications
      const permission = await LocalNotifications.requestPermissions();
      console.log('Notification permission:', permission);
      
      if (permission.display !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Listen for notification events
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received:', notification);
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
      });

    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const showNotification = async (options: NotificationOptions) => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on native platform, showing browser notification fallback');
      // Fallback for web - show browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, { body: options.body });
      }
      return;
    }

    try {
      const notificationId = options.id || Date.now();
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: options.title,
            body: options.body,
            id: notificationId,
            schedule: options.schedule ? {
              at: options.schedule.at,
              repeats: options.schedule.repeats || false
            } : undefined,
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {}
          }
        ]
      });

      console.log('Notification scheduled successfully');
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const showTransactionNotification = async (transaction: {
    type: 'income' | 'expense';
    amount: number;
    reason: string;
  }) => {
    const isIncome = transaction.type === 'income';
    const title = isIncome ? '💰 Income Added' : '💸 Expense Added';
    const body = `${transaction.reason}: $${transaction.amount.toFixed(2)}`;

    await showNotification({
      title,
      body,
      id: Date.now()
    });
  };

  const requestNotificationPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Request browser notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    showNotification,
    showTransactionNotification,
    requestNotificationPermission,
    initializeNotifications
  };
};
