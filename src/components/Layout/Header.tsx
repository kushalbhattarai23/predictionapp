
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut, Globe, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { MobileNotificationBell } from '@/components/notifications/MobileNotificationBell';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const location = useLocation();
  const { state } = useSidebar();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data?.avatar_url) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
          setAvatarUrl(urlData.publicUrl);
        }
      });
    }
  }, [user?.id]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
  };

  const getInitials = (email: string) => email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error('Logout error:', error); }
  };

  const quickLinks = user
    ? [
        ...(settings.enabledApps.prediction ? [{ path: '/prediction', icon: Globe, label: 'Prediction' }] : []),
        ...(settings.enabledApps.admin ? [{ path: '/admin', icon: Globe, label: 'Admin' }] : []),
        { path: '/settings', icon: Globe, label: 'Settings' },
      ]
    : [
        { path: '/login', icon: Globe, label: 'Sign In' },
        { path: '/signup', icon: Globe, label: 'Sign Up' },
      ];

  return (
    <header className={cn(
      "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 lg:px-6 py-3 fixed top-0 right-0 z-40 h-16",
      state === "expanded" ? "left-0 md:left-64" : "left-0"
    )}>
      <div className="flex items-center justify-between h-full gap-2">
        {/* Left: sidebar trigger + logo */}
        <div className="flex items-center gap-2 shrink-0">
          <SidebarTrigger />
          <div className="flex items-center md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-lg text-foreground">TrackerHub</span>
            </Link>
          </div>
        </div>

        {/* Center: scrollable quick links */}
        <div className="hidden md:flex items-center flex-1 min-w-0 mx-2 relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 h-8 w-6 flex items-center justify-center bg-gradient-to-r from-background to-transparent"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <TooltipProvider delayDuration={300}>
            <div
              ref={scrollRef}
              className="flex items-center gap-1 overflow-x-auto scrollbar-hide scroll-smooth px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const isLinkActive = location.pathname.startsWith(link.path);
                return (
                  <Tooltip key={link.path}>
                    <TooltipTrigger asChild>
                      <Link to={link.path}>
                        <Button
                          variant={isLinkActive ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "flex items-center gap-1.5 shrink-0 h-8 px-2.5 text-xs font-medium rounded-full transition-all",
                            isLinkActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline whitespace-nowrap">{link.label}</span>
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="xl:hidden">
                      <p>{link.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 h-8 w-6 flex items-center justify-center bg-gradient-to-l from-background to-transparent"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Right: user actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <MobileNotificationBell />
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.email || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline text-foreground">{user.email}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
