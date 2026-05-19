import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

type PushNotificationSchema = {
  title?: string;
  body?: string;
  data?: Record<string, any>;
};

type ActionPerformed = {
  notification: PushNotificationSchema;
};

type Token = {
  value: string;
};

type PermissionStatus = {
  receive: 'granted' | 'denied' | 'prompt';
};

type ListenerHandle = {
  remove: () => Promise<void>;
};

type PushNotificationsPlugin = {
  requestPermissions: () => Promise<PermissionStatus>;
  checkPermissions: () => Promise<PermissionStatus>;
  register: () => Promise<void>;
  addListener(
    eventName: 'registration',
    listenerFunc: (token: Token) => void,
  ): Promise<ListenerHandle>;
  addListener(
    eventName: 'registrationError',
    listenerFunc: (error: any) => void,
  ): Promise<ListenerHandle>;
  addListener(
    eventName: 'pushNotificationReceived',
    listenerFunc: (notification: PushNotificationSchema) => void,
  ): Promise<ListenerHandle>;
  addListener(
    eventName: 'pushNotificationActionPerformed',
    listenerFunc: (action: ActionPerformed) => void,
  ): Promise<ListenerHandle>;
};

let pushNotificationsPlugin: PushNotificationsPlugin | null = null;

const getPushNotificationsPlugin = async (): Promise<PushNotificationsPlugin | null> => {
  if (pushNotificationsPlugin) {
    return pushNotificationsPlugin;
  }

  try {
    const pluginModule = '@capacitor/push-notifications';
    const module = await import(/* @vite-ignore */ pluginModule);
    pushNotificationsPlugin = module.PushNotifications as PushNotificationsPlugin;
    return pushNotificationsPlugin;
  } catch (error) {
    console.warn('Push notifications plugin is not installed:', error);
    return null;
  }
};

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  data?: {
    route?: string;
    type?: string;
    [key: string]: any;
  };
}

export const usePushNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const handleNotificationTap = useCallback((notification: PushNotificationPayload) => {
    console.log('Push notification tapped:', notification);

    const route = notification.data?.route;
    if (route) {
      navigate(route);
    }

    const type = notification.data?.type;
    switch (type) {
      case 'scheduled_payment':
        navigate('/finance/scheduled-payments');
        break;
      case 'transaction':
        navigate('/finance/transactions');
        break;
      case 'network_invite':
        navigate('/settlebill/networks');
        break;
      case 'bill_reminder':
        const billId = notification.data?.billId;
        if (billId) {
          navigate(`/settlebill/bills/${billId}`);
        } else {
          navigate('/settlebill/bills');
        }
        break;
      default:
        if (!route) {
          navigate('/notifications');
        }
    }
  }, [navigate]);

  const handleForegroundNotification = useCallback((notification: PushNotificationSchema) => {
    console.log('Push notification received in foreground:', notification);
    toast({
      title: notification.title || 'New Notification',
      description: notification.body || '',
    });
  }, [toast]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const plugin = await getPushNotificationsPlugin();
      if (!plugin) return false;

      const result = await plugin.requestPermissions();
      if (result.receive === 'granted') {
        setPermissionStatus('granted');
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      return false;
    }
  }, []);

  const register = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const plugin = await getPushNotificationsPlugin();
      if (!plugin) return;

      const permStatus = await plugin.checkPermissions();
      if (permStatus.receive !== 'granted') {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      await plugin.register();
      setIsRegistered(true);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }, [requestPermissions]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let registrationListener: Promise<ListenerHandle> | null = null;
    let registrationErrorListener: Promise<ListenerHandle> | null = null;
    let foregroundListener: Promise<ListenerHandle> | null = null;
    let tapListener: Promise<ListenerHandle> | null = null;

    const setupListeners = async () => {
      const plugin = await getPushNotificationsPlugin();
      if (!plugin) return;

      registrationListener = plugin.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setPushToken(token.value);
      });

      registrationErrorListener = plugin.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
        setIsRegistered(false);
      });

      foregroundListener = plugin.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          handleForegroundNotification(notification);
        }
      );

      tapListener = plugin.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          handleNotificationTap({
            title: action.notification.title,
            body: action.notification.body,
            data: action.notification.data,
          });
        }
      );

      register();
    };

    setupListeners();

    return () => {
      registrationListener?.then((l) => l.remove());
      registrationErrorListener?.then((l) => l.remove());
      foregroundListener?.then((l) => l.remove());
      tapListener?.then((l) => l.remove());
    };
  }, [register, handleForegroundNotification, handleNotificationTap]);

  return {
    isRegistered,
    pushToken,
    permissionStatus,
    requestPermissions,
    register,
    handleNotificationTap,
  };
};
