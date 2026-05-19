
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Tv, Film, Receipt, Settings, Globe, Home, Package, Zap, Bug, Trophy } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';

interface AppSelectorProps {
  onAppSelect: (appId: string) => void;
}

const AppSelector: React.FC<AppSelectorProps> = ({ onAppSelect }) => {
  const { settings, isLoading } = useAppSettings();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const apps = [
    {
      id: 'public',
      name: 'Public',
      description: 'Browse public shows and universes',
      icon: Globe,
      color: 'bg-blue-500',
      enabled: user ? settings.enabledApps.public : true, // Always show when logged out
      requiresAuth: false
    },
    {
      id: 'movies',
      name: 'Movies',
      description: 'Track your movie watchlist and ratings',
      icon: Film,
      color: 'bg-blue-500',
      enabled: user ? settings.enabledApps.movies : true, // Always show when logged out
      requiresAuth: true
    },
    {
      id: 'tv-shows',
      name: 'TV Shows',
      description: 'Track your favorite TV shows and episodes',
      icon: Tv,
      color: 'bg-purple-500',
      enabled: user ? settings.enabledApps.tvShows : true, // Always show when logged out
      requiresAuth: true
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Personal finance tracking and management',
      icon: DollarSign,
      color: 'bg-green-500',
      enabled: user ? settings.enabledApps.finance : true, // Always show when logged out
      requiresAuth: true
    },
    {
      id: 'settlebill',
      name: 'SettleBill',
      description: 'Split bills and manage expenses with friends',
      icon: Receipt,
      color: 'bg-rose-500',
      enabled: user ? settings.enabledApps.settlebill : true,
      requiresAuth: true
    },
    {
      id: 'household',
      name: 'Household Ledger',
      description: 'Manage shared household and roommate expenses',
      icon: Home,
      color: 'bg-sky-500',
      enabled: user ? settings.enabledApps.household : true,
      requiresAuth: true
    },
    {
      id: 'inventory',
      name: 'Inventory',
      description: 'Track physical inventory, stock levels, and consumption',
      icon: Package,
      color: 'bg-teal-500',
      enabled: user ? settings.enabledApps.inventory : true,
      requiresAuth: true
    },
    {
      id: 'quick-commerce',
      name: 'QuickCommerce',
      description: '10-minute delivery e-commerce powered by your inventory',
      icon: Zap,
      color: 'bg-amber-500',
      enabled: user ? settings.enabledApps.quickCommerce : false,
      requiresAuth: true
    },
    {
      id: 'qa',
      name: 'QA Bug Tracker',
      description: 'Track, prioritize, and resolve bugs with Kanban boards',
      icon: Bug,
      color: 'bg-red-500',
      enabled: user ? settings.enabledApps.qa : true,
      requiresAuth: true
    },
    {
      id: 'prediction',
      name: 'Prediction',
      description: 'FIFA World Cup 2026 prediction league',
      icon: Trophy,
      color: 'bg-green-500',
      enabled: user ? settings.enabledApps.prediction : true,
      requiresAuth: true
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Administrative tools and settings',
      icon: Settings,
      color: 'bg-gray-500',
      enabled: user ? settings.enabledApps.admin : false,
      requiresAuth: true
    }
  ];

  // When logged out, show all apps except admin
  // When logged in, show only enabled apps
  const visibleApps = apps.filter(app => {
    if (!user) {
      // Show all apps except admin when logged out
      return app.id !== 'admin';
    }
    // Show only enabled apps when logged in
    return app.enabled;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            TrackerHub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choose an application to get started
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.id}
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 hover:border-gray-300 dark:hover:border-gray-600"
                onClick={() => onAppSelect(app.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${app.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{app.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {app.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {visibleApps.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No applications are currently enabled. Please enable apps in Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSelector;
