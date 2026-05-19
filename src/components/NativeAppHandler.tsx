import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useDeepLinkAuth } from '@/hooks/useDeepLinkAuth';
import { useNotificationHandler } from '@/hooks/useNotificationHandler';
import { useScheduledPayments } from '@/hooks/useScheduledPayments';
import { useScheduledPaymentExecution } from '@/hooks/useScheduledPaymentExecution';
import { useAuth } from '@/hooks/useAuth';

export const NativeAppHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize deep link handling (only runs on native)
  useDeepLinkAuth();
  
  // Initialize notification handling (only runs on native)
  const { scheduleLocalNotification } = useNotificationHandler();
  
  // Get scheduled payments and execution hook
  const { scheduledPayments } = useScheduledPayments();
  const { executeDuePayments } = useScheduledPaymentExecution();

  // Check for due scheduled payments on app launch
  useEffect(() => {
    if (!user) return;

    const checkDuePayments = async () => {
      const today = new Date().toISOString().split('T')[0];
      const duePayments = scheduledPayments.filter(
        (p) => p.is_active && p.next_date <= today && p.wallet_id
      );

      if (duePayments.length > 0) {
        console.log(`Found ${duePayments.length} due scheduled payments`);
        
        // Show notification about due payments
        if (Capacitor.isNativePlatform()) {
          scheduleLocalNotification({
            title: '📅 Scheduled Payments Due',
            body: `You have ${duePayments.length} scheduled payment(s) ready to execute`,
            type: 'scheduled_payment_reminder',
            route: '/finance/scheduled-payments',
          });
        }
      }
    };

    // Check after a small delay to ensure data is loaded
    const timeout = setTimeout(checkDuePayments, 2000);

    return () => clearTimeout(timeout);
  }, [user, scheduledPayments, scheduleLocalNotification]);

  return <>{children}</>;
};

export default NativeAppHandler;
