import { AppSettings } from '@/hooks/useAppSettings';

export interface AppConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  routes: {
    path: string;
    name: string;
    icon?: string;
  }[];
}

export const apps: AppConfig[] = [
  {
    id: 'prediction',
    name: 'Prediction',
    description: 'FIFA World Cup 2026 prediction league',
    icon: 'Trophy',
    color: 'green',
    routes: [
      { path: '/prediction', name: 'Dashboard' },
      { path: '/prediction/matches', name: 'Matches' },
      { path: '/prediction/leaderboard', name: 'Leaderboard' },
      { path: '/prediction/rooms', name: 'Rooms' },
      { path: '/prediction/rules', name: 'Rules' },
      { path: '/prediction/admin', name: 'Admin' }
    ]
  }
];

export const getEnabledApps = (settings: AppSettings) => {
  return apps.filter(app => settings.enabledApps[app.id as keyof typeof settings.enabledApps]);
};
