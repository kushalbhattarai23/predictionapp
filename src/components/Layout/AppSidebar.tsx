import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Home, 
  Tv, 
  DollarSign, 
  Receipt, 
  Settings, 
  Globe,
  Building,
  PieChart,
  TrendingUp,
  CreditCard,
  ArrowUpDown,
  Target,
  Tag,
  Wallet,
  Film,
  Users,
  BarChart3,
  Calculator,
  LogIn,
  UserPlus,
  Shield,
  FileText,
  Map,
  Moon,
  Sun,
  ListOrdered,
  ScanLine,
  CalendarClock,
  Bell,
  Calendar,
  UserCircle,
  BookOpen,
  RefreshCw,
  Activity,
  CalendarRange,
  Package,
  ClipboardList,
  Layers,
  Plus,
  Zap,
  ShoppingCart,
  Truck,
  Bike,
  LogOut,
  Image as ImageIcon,
  Bug,
  FolderKanban,
  Trophy
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { theme, toggleTheme } = useTheme();
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Determine which app is currently active
  const getCurrentApp = () => {
    const path = location.pathname;
    if (path.startsWith('/tv-shows')) return 'tv-shows';
    if (path.startsWith('/finance')) return 'finance';
    if (path.startsWith('/movies')) return 'movies';
    if (path.startsWith('/settlebill')) return 'settlebill';
    if (path.startsWith('/household')) return 'household';
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/shared-universe')) return 'shared-universe';
    if (path.startsWith('/store') || path.startsWith('/rider')) return 'quick-commerce';
    if (path.startsWith('/images')) return 'images';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/qa')) return 'qa';
    if (path.startsWith('/prediction')) return 'prediction';
    if (path.startsWith('/admin')) return 'admin';
    return null;
  };

  // Check if we're in the finance section
  const isInFinanceSection = location.pathname.startsWith('/finance');

  // Extract household network ID from path for dynamic sub-routes
  const householdMatch = location.pathname.match(/^\/household\/([^/]+)/);
  const currentHouseholdId = householdMatch ? householdMatch[1] : null;

  // Set default open accordion based on current route
  useEffect(() => {
    const currentApp = getCurrentApp();
    if (currentApp && !openAccordions.includes(currentApp)) {
      setOpenAccordions([currentApp]);
    }
  }, [location.pathname]);

  const handleAccordionChange = (value: string[]) => {
    setOpenAccordions(value);
  };

  const publicRoutes = [
    { name: 'Shows', href: '/public/shows', icon: Tv },
    { name: 'Universes', href: '/public/universes', icon: Globe },
  ];

  const tvShowsRoutes = user && settings.enabledApps.tvShows ? [
    { name: 'Dashboard', href: '/tv-shows', icon: BarChart3 },
    { name: 'My Shows', href: '/tv-shows/my-shows', icon: Tv },
    { name: 'Universes', href: '/tv-shows/universes', icon: Globe },
    { name: 'Public Shows', href: '/tv-shows/public', icon: Globe },
    { name: 'Public Universes', href: '/tv-shows/public/universes', icon: Globe },
    { name: 'Private Universes', href: '/tv-shows/private/universes', icon: Globe },
  ] : [];

  const financeRoutes = user && settings.enabledApps.finance ? [
    { name: 'Dashboard', href: '/finance', icon: PieChart },
    { name: 'Transactions', href: '/finance/transactions', icon: ArrowUpDown },
    { name: 'Multiple Transactions', href: '/finance/multiple-transactions', icon: ScanLine },
    { name: 'Scheduled Payments', href: '/finance/scheduled-payments', icon: CalendarClock },
    { name: 'Categories', href: '/finance/categories', icon: Tag },
    { name: 'Wallets', href: '/finance/wallets', icon: Wallet },
    { name: 'Budgets', href: '/finance/budgets', icon: Target },
    { name: 'Companies', href: '/finance/companies', icon: Building },
    { name: 'Credits', href: '/finance/credits', icon: CreditCard },
    { name: 'Transfers', href: '/finance/transfers', icon: TrendingUp },
    { name: 'Reports', href: '/finance/reports', icon: BarChart3 },
    { name: 'Nepali Date Report', href: '/finance/nepali-report', icon: Calendar },
    { name: 'Month vs Month', href: '/finance/month-vs-month', icon: ArrowUpDown },
    { name: 'Balances', href: '/finance/balances', icon: Wallet },
    { name: 'Balance Check', href: '/finance/balance-check', icon: Calculator },
    { name: 'Balance Month', href: '/finance/balance-month', icon: CalendarRange },
    { name: 'Wallet Analytics', href: '/finance/wallet-analytics', icon: BarChart3 },
    { name: 'Daily Transactions', href: '/finance/daily-transactions', icon: Activity },
    { name: 'Calendar Heatmap', href: '/finance/calendar-heatmap', icon: Calendar },
    { name: 'Weekly Heatmap', href: '/finance/weekly-heatmap', icon: Calendar },
    { name: 'Monthly Heatmap', href: '/finance/monthly-heatmap', icon: Calendar },
    { name: 'Wallet Heatmap', href: '/finance/wallet-calendar-heatmap', icon: Wallet },
    { name: 'Savings Rate', href: '/finance/savings-rate', icon: TrendingUp },
    { name: 'Burn Rate', href: '/finance/burn-rate', icon: Activity },
    { name: 'Tools', href: '/finance/tools', icon: Settings },
    { name: 'Settings', href: '/finance/settings', icon: Settings },
  ] : [];

  const notificationsRoutes = user ? [
    { name: 'All Notifications', href: '/notifications', icon: Bell },
  ] : [];

  const movieRoutes = user && settings.enabledApps.movies ? [
    { name: 'Dashboard', href: '/movies', icon: BarChart3 },
    { name: 'My Movies', href: '/movies/my-movies', icon: Film },
    { name: 'Universes', href: '/movies/universes', icon: Globe },
    { name: 'Public Movies', href: '/movies/public', icon: Globe },
    { name: 'Analytics', href: '/movies/analytics', icon: BarChart3 },
    { name: 'Import', href: '/movies/import', icon: Film },
  ] : [];

  const settlebillRoutes = user && settings.enabledApps.settlebill ? [
    { name: 'Overview', href: '/settlebill', icon: Receipt },
    { name: 'Networks', href: '/settlebill/networks', icon: Users },
    { name: 'Members', href: '/settlebill/members', icon: Users },
    { name: 'Bills', href: '/settlebill/bills', icon: Receipt },
    { name: 'Bill Split', href: '/settlebill/bills/itemized', icon: ListOrdered },
    
    { name: 'Final Calculations', href: '/settlebill/final-calculations', icon: Calculator },
    { name: 'Settings', href: '/settlebill/settings', icon: Settings },
  ] : [];

  const householdRoutes = user && settings.enabledApps.household ? [
    { name: 'Dashboard', href: '/household', icon: Home },
    ...(currentHouseholdId ? [
      { name: 'Ledger', href: `/household/${currentHouseholdId}/ledger`, icon: BookOpen },
      { name: 'Balance', href: `/household/${currentHouseholdId}/balance`, icon: Wallet },
      { name: 'Recurring', href: `/household/${currentHouseholdId}/recurring`, icon: RefreshCw },
      { name: 'Categories', href: `/household/${currentHouseholdId}/categories`, icon: Tag },
      { name: 'Members', href: `/household/${currentHouseholdId}/members`, icon: Users },
      { name: 'Activity', href: `/household/${currentHouseholdId}/activity`, icon: Activity },
      { name: 'Analytics', href: `/household/${currentHouseholdId}/analytics`, icon: BarChart3 },
      { name: 'Settings', href: `/household/${currentHouseholdId}/settings`, icon: Settings },
    ] : []),
  ] : [];

  const inventoryRoutes = user && settings.enabledApps.inventory ? [
    { name: 'Dashboard', href: '/inventory', icon: Package },
    { name: 'Stores', href: '/inventory/stores', icon: Building },
    { name: 'Items', href: '/inventory/items', icon: ClipboardList },
    { name: 'Categories', href: '/inventory/categories', icon: Tag },
    { name: 'Transactions', href: '/inventory/transactions', icon: ArrowUpDown },
    { name: 'Analytics', href: '/inventory/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/inventory/settings', icon: Settings },
  ] : [];

  const sharedUniverseRoutes = user && settings.enabledApps.sharedUniverse ? [
    { name: 'Dashboard', href: '/shared-universe', icon: Layers },
    { name: 'Create', href: '/shared-universe/create', icon: Plus },
    { name: 'Public Universes', href: '/public/shared-universes', icon: Globe },
  ] : [];

  const quickCommerceRoutes = user && settings.enabledApps.quickCommerce ? [
    { name: 'Store', href: '/store', icon: ShoppingCart },
    { name: 'My Orders', href: '/store/orders', icon: Package },
    { name: 'Rider Dashboard', href: '/rider/dashboard', icon: Bike },
  ] : [];

  const imagesRoutes = user && settings.enabledApps.images ? [
    { name: 'Gallery', href: '/images', icon: ImageIcon },
    { name: 'Albums', href: '/images/albums', icon: Layers },
    { name: 'Favorites', href: '/images/favorites', icon: Activity },
  ] : [];

  const qaRoutes = user && settings.enabledApps.qa ? [
    { name: 'Dashboard', href: '/qa', icon: BarChart3 },
    { name: 'Workspaces', href: '/qa/workspaces', icon: FolderKanban },
    { name: 'Test Cases', href: '/qa/test-cases', icon: ClipboardList },
    { name: 'Test Coverage', href: '/qa/test-coverage', icon: Target },
  ] : [];
  const predictionRoutes = user && settings.enabledApps.prediction ? [
    { name: 'Dashboard', href: '/prediction', icon: Trophy },
    { name: 'Matches', href: '/prediction/matches', icon: Calendar },
    { name: 'Leaderboard', href: '/prediction/leaderboard', icon: ListOrdered },
    { name: 'Rooms', href: '/prediction/rooms', icon: Users },
    { name: 'Rules', href: '/prediction/rules', icon: BookOpen },
    { name: 'Admin', href: '/prediction/admin', icon: Shield },
  ] : [];


  const adminRoutes = user && settings.enabledApps.admin ? [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content', href: '/admin/content', icon: Settings },
    { name: 'Add Show', href: '/admin/add-show', icon: Tv },
    { name: 'Import Movies', href: '/admin/import-movies', icon: Film },
    { name: 'Public Pages', href: '/admin/public', icon: Globe },
    { name: 'SEO Settings', href: '/admin/seo', icon: FileText },
    { name: 'QC Orders', href: '/admin/qc-orders', icon: Package },
    { name: 'QC Riders', href: '/admin/qc-riders', icon: Bike },
    { name: 'QC Dispatch', href: '/admin/qc-dispatch', icon: Truck },
    { name: 'QC Store Settings', href: '/admin/qc-store-settings', icon: Settings },
    { name: 'QC Analytics', href: '/admin/qc-analytics', icon: BarChart3 },
  ] : [];

  // Order apps based on current active app (active app first)
  const currentApp = getCurrentApp();
  const appSections: { id: string; title: string; routes: typeof publicRoutes }[] = [];

  const allSections = [
    { id: 'settlebill', title: 'SettleBill', routes: settlebillRoutes },
    { id: 'tv-shows', title: 'TV Shows', routes: tvShowsRoutes },
    { id: 'finance', title: 'Finance', routes: financeRoutes },
    { id: 'movies', title: 'Movies', routes: movieRoutes },
    { id: 'shared-universe', title: 'Shared Universe', routes: sharedUniverseRoutes },
    { id: 'quick-commerce', title: 'QuickCommerce', routes: quickCommerceRoutes },
    { id: 'notifications', title: 'Notifications', routes: notificationsRoutes },
    { id: 'household', title: 'Household Ledger', routes: householdRoutes },
    { id: 'inventory', title: 'Inventory', routes: inventoryRoutes },
    { id: 'images', title: 'Images', routes: imagesRoutes },
    { id: 'qa', title: 'QA Bug Tracker', routes: qaRoutes },
    { id: 'prediction', title: 'Prediction', routes: predictionRoutes },
    { id: 'admin', title: 'Admin', routes: adminRoutes },
  ];

  // Current app first, then the rest
  for (const section of allSections) {
    if (section.routes.length > 0 && section.id === currentApp) {
      appSections.push(section);
    }
  }
  for (const section of allSections) {
    if (section.routes.length > 0 && section.id !== currentApp) {
      appSections.push(section);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        {user && isInFinanceSection && (
          <div className="p-4 border-b">
            <OrganizationSwitcher />
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/') && location.pathname === '/'}>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Public</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicRoutes.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && appSections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Applications</SidebarGroupLabel>
            <SidebarGroupContent>
              <Accordion 
                type="multiple" 
                value={openAccordions} 
                onValueChange={handleAccordionChange}
                className="w-full"
              >
                {appSections.map((section) => (
                  <AccordionItem key={section.id} value={section.id} className="border-none">
                    <AccordionTrigger className="hover:no-underline py-2 px-2 hover:bg-sidebar-accent rounded-md">
                      <span className="text-sm font-medium">{section.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <SidebarMenu>
                        {section.routes.map((item) => {
                          const Icon = item.icon;
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive(item.href)} className="ml-4">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
                    <Link to="/profile">
                      <UserCircle className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/settings')}>
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Legal & Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/requests')}>
                  <Link to="/requests">
                    <Shield className="h-4 w-4" />
                    <span>Request</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/privacy-policy')}>
                  <Link to="/privacy-policy">
                    <Shield className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/terms-of-service')}>
                  <Link to="/terms-of-service">
                    <FileText className="h-4 w-4" />
                    <span>Terms of Service</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/sitemap')}>
                  <Link to="/sitemap">
                    <Map className="h-4 w-4" />
                    <span>Sitemap</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center space-x-2">
                {theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <Label htmlFor="theme-toggle" className="text-sm font-medium">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </Label>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </SidebarMenuItem>
          
          {user ? (
            <SidebarMenuItem>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  try {
                    const { useAuth } = await import('@/hooks/useAuth');
                  } catch (e) {}
                  const { supabase } = await import('@/integrations/supabase/client');
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link to="/signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
