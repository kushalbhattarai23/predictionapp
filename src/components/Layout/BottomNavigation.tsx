
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Tv, DollarSign, Receipt, User, Film, Globe, Settings, Package, Image as ImageIcon, Bug, Zap, Layers, MoreHorizontal, X, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppSettings } from '@/hooks/useAppSettings';
import { cn } from '@/lib/utils';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { settings } = useAppSettings();
  const [showMore, setShowMore] = useState(false);

  if (!isMobile || location.pathname === '/landing') return null;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const guestNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/public/universes', icon: Globe, label: 'Public' },
    { path: '/login', icon: User, label: 'Login' },
  ];

  const authenticatedNavItems = [
    { path: '/', icon: Home, label: 'Home', show: true },
    { path: '/public/universes', icon: Globe, label: 'Public', show: settings.enabledApps.public },
    { path: '/movies', icon: Film, label: 'Movies', show: settings.enabledApps.movies },
    { path: '/tv-shows', icon: Tv, label: 'TV Shows', show: settings.enabledApps.tvShows },
    { path: '/finance', icon: DollarSign, label: 'Finance', show: settings.enabledApps.finance },
    { path: '/settlebill', icon: Receipt, label: 'Bills', show: settings.enabledApps.settlebill },
    { path: '/household', icon: Home, label: 'Household', show: settings.enabledApps.household },
    { path: '/inventory', icon: Package, label: 'Inventory', show: settings.enabledApps.inventory },
    { path: '/images', icon: ImageIcon, label: 'Images', show: settings.enabledApps.images },
    { path: '/store', icon: Zap, label: 'Store', show: settings.enabledApps.quickCommerce },
    { path: '/shared-universe', icon: Layers, label: 'Shared', show: settings.enabledApps.sharedUniverse },
    { path: '/qa', icon: Bug, label: 'QA', show: settings.enabledApps.qa },
    { path: '/prediction', icon: Trophy, label: 'Predict', show: settings.enabledApps.prediction },
    { path: '/admin', icon: Settings, label: 'Admin', show: settings.enabledApps.admin },
    { path: '/profile', icon: User, label: 'Profile', show: true },
  ];

  if (!user) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          {guestNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={cn("flex flex-col items-center py-1.5 px-3 rounded-xl transition-all",
                  active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const visibleItems = authenticatedNavItems.filter(item => item.show);

  // Determine which items are currently active-section relevant
  const activeItem = visibleItems.find(item => item.path !== '/' && isActive(item.path));

  // Show max 4 items + More button. Prioritize: Home, active app, Profile, then fill remaining
  const MAX_VISIBLE = 4;
  let pinnedItems: typeof visibleItems = [];
  const homeItem = visibleItems.find(i => i.path === '/');
  const profileItem = visibleItems.find(i => i.path === '/profile');
  const otherItems = visibleItems.filter(i => i.path !== '/' && i.path !== '/profile');

  if (homeItem) pinnedItems.push(homeItem);

  // If there's an active app, make sure it's pinned
  if (activeItem && activeItem.path !== '/' && activeItem.path !== '/profile') {
    pinnedItems.push(activeItem);
  }

  // Fill remaining slots (excluding already pinned + profile which goes last)
  const remaining = otherItems.filter(i => !pinnedItems.includes(i));
  const slotsLeft = MAX_VISIBLE - pinnedItems.length - (profileItem ? 1 : 0);
  pinnedItems.push(...remaining.slice(0, Math.max(0, slotsLeft)));
  if (profileItem) pinnedItems.push(profileItem);

  const overflowItems = visibleItems.filter(i => !pinnedItems.includes(i));
  const hasOverflow = overflowItems.length > 0;

  return (
    <>
      {/* Overflow drawer */}
      {showMore && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl border-t border-border p-4 pb-20 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">More Apps</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-accent">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center py-3 px-2 rounded-xl transition-all",
                      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}>
                    <Icon className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border z-50 md:hidden">
        <div className="flex justify-around items-center py-1.5 px-1">
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex flex-col items-center py-1.5 px-2 rounded-xl transition-all min-w-0 flex-1",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  active && "bg-primary/15 scale-110"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-0.5 truncate max-w-full",
                  active && "font-semibold"
                )}>{item.label}</span>
              </Link>
            );
          })}
          {hasOverflow && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex flex-col items-center py-1.5 px-2 rounded-xl transition-all min-w-0 flex-1",
                showMore ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                showMore && "bg-primary/15"
              )}>
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">More</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
