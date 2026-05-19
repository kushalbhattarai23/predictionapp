
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings as SettingsIcon, Palette, Shield, Bell, Grid3X3 } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useAppSettings();
  const { theme, toggleTheme } = useTheme();

  const handleAppToggle = (appId: keyof typeof settings.enabledApps) => {
    updateSettings({
      enabledApps: {
        ...settings.enabledApps,
        [appId]: !settings.enabledApps[appId]
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your preferences and application settings</p>
        </div>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Application Preferences
            </CardTitle>
            <CardDescription>
              Choose which applications you want to use in TrackerHub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { id: 'tvShows' as const, label: 'TV Shows', desc: 'Track your favorite TV shows and episodes' },
              { id: 'finance' as const, label: 'Finance', desc: 'Manage your personal finances and budgets' },
              { id: 'movies' as const, label: 'Movies', desc: 'Track your movie watchlist and ratings' },
              { id: 'settlebill' as const, label: 'SettleBill', desc: 'Split bills and manage expenses with friends' },
              { id: 'household' as const, label: 'Household Ledger', desc: 'Manage shared household expenses with roommates or family' },
              { id: 'inventory' as const, label: 'Inventory', desc: 'Track and manage your inventory items and stores' },
              { id: 'quickCommerce' as const, label: 'Quick Commerce', desc: 'Manage quick commerce orders and deliveries' },
              { id: 'images' as const, label: 'Images', desc: 'Store and organize your image albums' },
              { id: 'sharedUniverse' as const, label: 'Shared Universe', desc: 'Create and explore shared content universes' },
              { id: 'qa' as const, label: 'QA Bug Tracker', desc: 'Track bugs and test cases with Kanban boards' },
              { id: 'notifications' as const, label: 'Notifications', desc: 'View and manage your notifications' },
              { id: 'public' as const, label: 'Public Content', desc: 'Access public shows and universes' },
            ]).map(app => (
              <div key={app.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={app.id}>{app.label}</Label>
                  <p className="text-sm text-muted-foreground">{app.desc}</p>
                </div>
                <Switch
                  id={app.id}
                  checked={settings.enabledApps[app.id]}
                  onCheckedChange={() => handleAppToggle(app.id)}
                />
              </div>
            ))}

            {settings.enabledApps.admin && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="admin">Admin Tools</Label>
                  <p className="text-sm text-muted-foreground">Administrative tools and settings</p>
                </div>
                <Switch
                  id="admin"
                  checked={settings.enabledApps.admin}
                  onCheckedChange={() => handleAppToggle('admin')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how TrackerHub looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme across the application</p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your privacy and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve TrackerHub by sharing usage data</p>
              </div>
              <Switch id="analytics" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive updates and promotional content</p>
              </div>
              <Switch id="marketing" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button>Save All Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
