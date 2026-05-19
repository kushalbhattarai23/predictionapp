import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Heart, Globe, Lock, Users, Receipt, Wallet, Tag, ArrowLeftRight, Target, FileBarChart, Settings, CreditCard, Calculator, Bell, Film, Star, Play, Search, Tv, BookOpen, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppSettings } from '@/hooks/useAppSettings';

export const SecondaryBottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { settings } = useAppSettings();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  // Don't show on login/signup pages or landing page
  if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/landing') {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Define routes for each app section with their colors
  const getSecondaryNavItems = () => {
    const pathname = location.pathname;

    // TV Shows section - purple theme
    if (pathname.startsWith('/tv-shows') && settings.enabledApps.tvShows) {
      return {
        items: [
          { path: '/tv-shows', icon: BarChart3, label: 'Dashboard' },
          { path: '/tv-shows/my-shows', icon: Heart, label: 'My Shows' },
          { path: '/tv-shows/universes', icon: Users, label: 'Universes' },
          { path: '/tv-shows/public-shows', icon: Globe, label: 'Browse' }
        ],
        color: 'purple'
      };
    }

    // Finance section - green theme
    if (pathname.startsWith('/finance') && settings.enabledApps.finance) {
      return {
        items: [
          { path: '/finance', icon: BarChart3, label: 'Dashboard' },
          { path: '/finance/wallets', icon: Wallet, label: 'Wallets' },
          { path: '/finance/transactions', icon: Receipt, label: 'Transactions' },
          { path: '/finance/categories', icon: Tag, label: 'Categories' }
        ],
        color: 'green'
      };
    }

    // SettleBill section - orange theme with red text (only show if enabled)
    if (pathname.startsWith('/settlebill') && settings.enabledApps.settlebill) {
      return {
        items: [
          { path: '/settlebill', icon: BarChart3, label: 'Overview' },
          { path: '/settlebill/networks', icon: Users, label: 'Networks' },
          { path: '/settlebill/bills', icon: Receipt, label: 'Bills' },
        ],
        color: 'orange'
      };
    }

    // Movies section - blue theme
    if (pathname.startsWith('/movies') && pathname !== '/' && settings.enabledApps.movies) {
      return {
        items: [
          { path: '/movies', icon: Film, label: 'Watchlist' },
          { path: '/movies/watched', icon: Play, label: 'Watched' },
          { path: '/movies/ratings', icon: Star, label: 'Ratings' },
          { path: '/movies/discover', icon: Search, label: 'Discover' }
        ],
        color: 'blue'
      };
    }

    // Household section - sky theme
    if (pathname.startsWith('/household') && settings.enabledApps.household) {
      // Extract household ID from path
      const match = pathname.match(/^\/household\/([^/]+)/);
      const hId = match ? match[1] : null;
      if (hId) {
        return {
          items: [
            { path: `/household/${hId}`, icon: BarChart3, label: 'Overview' },
            { path: `/household/${hId}/ledger`, icon: BookOpen, label: 'Ledger' },
            { path: `/household/${hId}/balance`, icon: Wallet, label: 'Balance' },
            { path: `/household/${hId}/recurring`, icon: RefreshCw, label: 'Recurring' },
            { path: `/household/${hId}/settings`, icon: Settings, label: 'Settings' },
          ],
          color: 'sky'
        };
      }
      return { items: [], color: 'sky' };
    }

    // Public section - purple theme (default)
    if (pathname.startsWith('/public') && settings.enabledApps.public) {
      return {
        items: [
          { path: '/public/universes', icon: Globe, label: 'Universes' },
          { path: '/public/shows', icon: Heart, label: 'Shows' }
        ],
        color: 'purple'
      };
    }

    // Admin section - gray theme
    if (pathname.startsWith('/admin') && settings.enabledApps.admin) {
      return {
        items: [
          { path: '/admin', icon: BarChart3, label: 'Dashboard' },
          { path: '/admin/users', icon: Users, label: 'Users' },
          { path: '/admin/add-show', icon: Tv, label: 'Add Show' },
          { path: '/admin/public', icon: Globe, label: 'Public' }
        ],
        color: 'gray'
      };
    }

    return { items: [], color: 'purple' };
  };

  const { items: secondaryNavItems, color } = getSecondaryNavItems();

  // Don't render if no secondary nav items or user not authenticated for protected routes
  if (secondaryNavItems.length === 0) {
    return null;
  }

  // Check if user needs to be authenticated for certain sections
  if ((location.pathname.startsWith('/tv-shows') || location.pathname.startsWith('/finance') || location.pathname.startsWith('/settlebill') || location.pathname.startsWith('/movies') || location.pathname.startsWith('/household')) && !user) {
    return null;
  }

  // Define color classes based on the section with improved dark mode support
  const getColorClasses = (isActive: boolean) => {
    if (color === 'green') {
      return isActive
        ? 'text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-800/80'
        : 'text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-800/40';
    } else if (color === 'orange') {
      return isActive
        ? 'text-orange-800 bg-orange-200 dark:text-orange-200 dark:bg-orange-800/80'
        : 'text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-800/40';
    } else if (color === 'rose') {
      return isActive
        ? 'text-rose-800 bg-rose-200 dark:text-rose-200 dark:bg-rose-800/80'
        : 'text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-800/40';
    } else if (color === 'blue') {
      return isActive
        ? 'text-blue-800 bg-blue-200 dark:text-blue-200 dark:bg-blue-800/80'
        : 'text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800/40';
    } else if (color === 'gray') {
      return isActive
        ? 'text-gray-800 bg-gray-200 dark:text-gray-200 dark:bg-gray-800/80'
        : 'text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/40';
    } else if (color === 'sky') {
      return isActive
        ? 'text-sky-800 bg-sky-200 dark:text-sky-200 dark:bg-sky-800/80'
        : 'text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-800/40';
    } else {
      return isActive
        ? 'text-purple-800 bg-purple-200 dark:text-purple-200 dark:bg-purple-800/80'
        : 'text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800/40';
    }
  };

  const backgroundClass = color === 'green' 
    ? 'bg-green-50 dark:bg-green-950/80 border-green-300 dark:border-green-700'
    : color === 'orange'
    ? 'bg-orange-50 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700'
    : color === 'rose'
    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700'
    : color === 'blue'
    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700'
    : color === 'gray'
    ? 'bg-gray-50 dark:bg-gray-950/80 border-gray-300 dark:border-gray-700'
    : color === 'sky'
    ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700'
    : 'bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700';

  return (
    <div className={`fixed bottom-16 left-0 right-0 ${backgroundClass} border-t z-40 md:hidden`}>
      <div className="flex justify-around items-center py-1 px-2">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${getColorClasses(active)}`}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
