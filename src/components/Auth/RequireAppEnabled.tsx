import React from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/Layout/AppLayout';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RequireAppEnabledProps {
  appKey: keyof ReturnType<typeof useAppSettings>['settings']['enabledApps'];
  children: React.ReactNode;
}

const RequireAppEnabled: React.FC<RequireAppEnabledProps> = ({ appKey, children }) => {
  const { settings, isLoading } = useAppSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  if (!settings.enabledApps[appKey]) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have permission to access this section. This module has been disabled for your account.
          </p>
          <p className="text-sm text-muted-foreground">
            You can enable this module from your{' '}
            <button onClick={() => navigate('/settings')} className="text-primary underline hover:no-underline">
              Settings
            </button>{' '}
            page.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
};

export default RequireAppEnabled;
