
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Settings } from 'lucide-react';

interface RequireSettleBillEnabledProps {
  children: React.ReactNode;
}

export const RequireSettleBillEnabled: React.FC<RequireSettleBillEnabledProps> = ({ children }) => {
  const { user } = useAuth();
  const { settings, isLoading } = useAppSettings();
  const location = useLocation();

  // Redirect to home if user is not logged in
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Receipt className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading SettleBill...</p>
        </div>
      </div>
    );
  }

  // Check if SettleBill is enabled
  if (!settings.enabledApps.settlebill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto border-rose-200 dark:border-rose-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-rose-700 dark:text-rose-300">
              SettleBill Disabled
            </CardTitle>
            <CardDescription>
              The SettleBill application is currently disabled in your settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              To access SettleBill and manage your shared expenses, please enable it in your application settings first.
            </p>
            <Button 
              onClick={() => window.location.href = '/settings'}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
