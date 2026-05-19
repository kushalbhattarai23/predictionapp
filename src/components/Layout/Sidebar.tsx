
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { 
  Menu, 
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
  Calculator
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAppSettings();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const publicRoutes = [
    {
      title: 'Public',
      items: [
        { name: 'Shows', href: '/public/shows', icon: Tv },
        { name: 'Universes', href: '/public/universes', icon: Globe },
      ]
    }
  ];

  const tvShowsRoutes = user ? [
    {
      title: 'TV Shows',
      items: [
        { name: 'Dashboard', href: '/tv-shows', icon: BarChart3 },
        { name: 'My Shows', href: '/tv-shows/my-shows', icon: Tv },
        { name: 'Universes', href: '/tv-shows/universes', icon: Globe },
        { name: 'Public Shows', href: '/tv-shows/public', icon: Globe },
        { name: 'Public Universes', href: '/tv-shows/public/universes', icon: Globe },
      ]
    }
  ] : [];

  const financeRoutes = user ? [
    {
      title: 'Finance',
      items: [
        { name: 'Dashboard', href: '/finance', icon: PieChart },
        { name: 'Transactions', href: '/finance/transactions', icon: ArrowUpDown },
        { name: 'Categories', href: '/finance/categories', icon: Tag },
        { name: 'Wallets', href: '/finance/wallets', icon: Wallet },
        { name: 'Budgets', href: '/finance/budgets', icon: Target },
        { name: 'Companies', href: '/finance/companies', icon: Building },
        { name: 'Credits', href: '/finance/credits', icon: CreditCard },
        { name: 'Transfers', href: '/finance/transfers', icon: TrendingUp },
        { name: 'Reports', href: '/finance/reports', icon: BarChart3 },
        { name: 'Settings', href: '/finance/settings', icon: Settings },
      ]
    }
  ] : [];

  const movieRoutes = user ? [
    {
      title: 'Movies',
      items: [
        { name: 'My Movies', href: '/movies', icon: Film },
      ]
    }
  ] : [];

  const settlebillRoutes = user ? [
    {
      title: 'SettleBill',
      items: [
        { name: 'Overview', href: '/settlebill', icon: Receipt },
        { name: 'Networks', href: '/settlebill/networks', icon: Users },
        { name: 'Bills', href: '/settlebill/bills', icon: Receipt },
        
        { name: 'Final Calculations', href: '/settlebill/final-calculations', icon: Calculator },
        { name: 'Settings', href: '/settlebill/settings', icon: Settings },
      ]
    }
  ] : [];

  const adminRoutes = user && settings.enabledApps.admin ? [
    {
      title: 'Admin',
      items: [
        { name: 'Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Content', href: '/admin/content', icon: Settings },
      ]
    }
  ] : [];

  const allRoutes = [
    ...publicRoutes,
    ...(user && settings.enabledApps.tvShows ? tvShowsRoutes : []),
    ...(user && settings.enabledApps.finance ? financeRoutes : []),
    ...(user && settings.enabledApps.movies ? movieRoutes : []),
    ...(user && settings.enabledApps.settlebill ? settlebillRoutes : []),
    ...adminRoutes,
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">T</span>
          </div>
          <span className="font-semibold text-lg">TrackerHub</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <Link to="/">
              <Button
                variant={isActive('/') && location.pathname === '/' ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>

          {allRoutes.map((section) => (
            <div key={section.title} className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} to={item.href}>
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {!user && (
            <div className="px-3 py-2">
              <div className="space-y-1">
                <Link to="/login">
                  <Button variant="ghost" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed top-4 left-4 z-40 lg:hidden"
            size="icon"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-gray-50/40 lg:pt-5">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
