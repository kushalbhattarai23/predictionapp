
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
    id: 'public',
    name: 'Public',
    description: 'Public shows and universes',
    icon: 'Globe',
    color: 'blue',
    routes: [
      { path: '/public/shows', name: 'Public Shows' },
      { path: '/public/universes', name: 'Public Universes' }
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Personal finance tracking and management',
    icon: 'DollarSign',
    color: 'green',
    routes: [
      { path: '/finance', name: 'Dashboard' },
      { path: '/finance/transactions', name: 'Transactions' },
      { path: '/finance/wallets', name: 'Wallets' },
      { path: '/finance/categories', name: 'Categories' },
      { path: '/finance/transfers', name: 'Transfers' },
      { path: '/finance/budgets', name: 'Budgets' },
      { path: '/finance/reports', name: 'Reports' },
      { path: '/finance/scheduled-payments', name: 'Scheduled Payments' },
      { path: '/finance/settings', name: 'Settings' }
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'System notifications and audit history',
    icon: 'Bell',
    color: 'orange',
    routes: [
      { path: '/notifications', name: 'All Notifications' }
    ]
  },
  {
    id: 'tv-shows',
    name: 'TV Shows',
    description: 'Track your favorite TV shows and episodes',
    icon: 'Tv',
    color: 'purple',
    routes: [
      { path: '/tv-shows', name: 'Dashboard' },
      { path: '/tv-shows/my-shows', name: 'My Shows' },
      { path: '/tv-shows/universes', name: 'Universes' },
      { path: '/tv-shows/public-shows', name: 'Public Shows' },
      { path: '/tv-shows/public-universes', name: 'Public Universes' }
    ]
  },
  {
    id: 'movies',
    name: 'Movies',
    description: 'Track your movie watchlist and ratings',
    icon: 'Film',
    color: 'blue',
    routes: [
      { path: '/movies', name: 'Movies' }
    ]
  },
  {
    id: 'settlebill',
    name: 'SettleBill',
    description: 'Split bills and manage expenses with friends',
    icon: 'Receipt',
    color: 'orange',
    routes: [
      { path: '/settlebill', name: 'Dashboard' }
    ]
  },
  {
    id: 'household',
    name: 'Household Ledger',
    description: 'Manage shared household expenses with roommates or family',
    icon: 'Home',
    color: 'teal',
    routes: [
      { path: '/household', name: 'Dashboard' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Track physical inventory, stock levels, and consumption',
    icon: 'Package',
    color: 'cyan',
    routes: [
      { path: '/inventory', name: 'Dashboard' },
      { path: '/inventory/items', name: 'Items' },
      { path: '/inventory/categories', name: 'Categories' },
      { path: '/inventory/transactions', name: 'Transactions' },
      { path: '/inventory/analytics', name: 'Analytics' },
      { path: '/inventory/settings', name: 'Settings' }
    ]
  },
  {
    id: 'quickCommerce',
    name: 'QuickCommerce',
    description: '10-minute delivery e-commerce powered by inventory',
    icon: 'Zap',
    color: 'emerald',
    routes: [
      { path: '/store', name: 'Store' },
      { path: '/store/orders', name: 'My Orders' },
      { path: '/rider/dashboard', name: 'Rider Dashboard' }
    ]
  },
  {
    id: 'images',
    name: 'Images',
    description: 'Personal media gallery with albums, tags, and sharing',
    icon: 'Image',
    color: 'pink',
    routes: [
      { path: '/images', name: 'Gallery' },
      { path: '/images/albums', name: 'Albums' },
      { path: '/images/favorites', name: 'Favorites' }
    ]
  },
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
  },
  {
    id: 'qa',
    name: 'QA Bug Tracker',
    description: 'Track, prioritize, and resolve bugs with Kanban boards',
    icon: 'Bug',
    color: 'red',
    routes: [
      { path: '/qa', name: 'Dashboard' },
      { path: '/qa/workspaces', name: 'Workspaces' }
    ]
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative tools and settings',
    icon: 'Settings',
    color: 'amber',
    routes: [
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/users', name: 'Users' },
      { path: '/admin/content', name: 'Content' }
    ]
  }
];

export const getEnabledApps = (settings: AppSettings) => {
  return apps.filter(app => settings.enabledApps[app.id as keyof typeof settings.enabledApps]);
};
