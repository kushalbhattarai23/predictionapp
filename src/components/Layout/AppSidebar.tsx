import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, LogIn, LogOut, Moon, Settings, Sun, Trophy, UserCircle, UserPlus, Shield } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const predictionRoutes = user && settings.enabledApps.prediction
    ? [
        { name: 'Dashboard', href: '/prediction', icon: Trophy },
        { name: 'Matches', href: '/prediction/matches', icon: Trophy },
        { name: 'Leaderboard', href: '/prediction/leaderboard', icon: Trophy },
        { name: 'Rooms', href: '/prediction/rooms', icon: Trophy },
        { name: 'Rules', href: '/prediction/rules', icon: Trophy },
      ]
    : [];

  const adminRoutes = user && settings.enabledApps.admin
    ? [
        { name: 'Admin Dashboard', href: '/admin', icon: Shield },
        { name: 'Admin Users', href: '/admin/users', icon: Shield },
        { name: 'Admin Content', href: '/admin/content', icon: Shield },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/')}>
                  <Link to="/"><Home className="h-4 w-4" /><span>Home</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {predictionRoutes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Prediction</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {predictionRoutes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link to={item.href}><Icon className="h-4 w-4" /><span>{item.name}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/profile')}>
                    <Link to="/profile"><UserCircle className="h-4 w-4" /><span>Profile</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/settings')}>
                  <Link to="/settings"><Settings className="h-4 w-4" /><span>Settings</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminRoutes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminRoutes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link to={item.href}><Icon className="h-4 w-4" /><span>{item.name}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center space-x-2">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <Label htmlFor="theme-toggle" className="text-sm font-medium">{theme === 'light' ? 'Light' : 'Dark'}</Label>
              </div>
              <Switch id="theme-toggle" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </SidebarMenuItem>
          {user ? (
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async()=>{await supabase.auth.signOut(); window.location.href='/login';}}>
                <LogOut className="h-4 w-4 mr-2" /><span>Logout</span>
              </Button>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem><Button asChild className="w-full"><Link to="/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link></Button></SidebarMenuItem>
              <SidebarMenuItem><Button asChild variant="outline" className="w-full"><Link to="/signup"><UserPlus className="h-4 w-4 mr-2" />Sign Up</Link></Button></SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
