import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationProvider';

// Layout Components
import { AppLayout } from '@/components/Layout/AppLayout';

// Auth Components  
import RequireAuth from '@/components/Auth/RequireAuth';
import RequireAdmin from '@/components/Auth/RequireAdmin';
import RedirectIfAuth from '@/components/Auth/RedirectIfAuth';
import { RequireSettleBillEnabled } from '@/components/Auth/RequireSettleBillEnabled';
import RequireAppEnabled from '@/components/Auth/RequireAppEnabled';

// Pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Landing from '@/pages/Landing';
import Requests from '@/pages/Requests';

// Authentication App Pages
import Login from '@/apps/authentication/pages/Login';
import SignUp from '@/apps/authentication/pages/SignUp';
import Profile from '@/pages/Profile';
import Settings from '@/apps/authentication/pages/Settings';

// Public App Pages
import PublicShows from '@/apps/public/pages/PublicShows';
import PublicUniverses from '@/apps/public/pages/PublicUniverses';
import PublicShowDetail from '@/apps/public/pages/PublicShowDetail';
import PublicUniverseDetail from '@/apps/public/pages/PublicUniverseDetail';

// Finance App Pages
import FinanceDashboard from '@/apps/finance/pages/Dashboard';
import Transactions from '@/apps/finance/pages/Transactions';
import MultipleTransactions from '@/apps/finance/pages/MultipleTransactions';
import ScheduledPayments from '@/apps/finance/pages/ScheduledPayments';
import FinanceNotifications from '@/apps/finance/pages/Notifications';
import FinanceTools from '@/apps/finance/pages/Tools';
import NepaliDateReport from '@/apps/finance/pages/NepaliDateReport';
import Categories from '@/apps/finance/pages/Categories';
import CategoryDetail from '@/apps/finance/pages/CategoryDetail';
import Wallets from '@/apps/finance/pages/Wallets';
import WalletDetail from '@/apps/finance/pages/WalletDetail';
import Budgets from '@/apps/finance/pages/Budgets';
import Companies from '@/apps/finance/pages/Companies';
import Credits from '@/apps/finance/pages/Credits';
import Transfers from '@/apps/finance/pages/Transfers';
import FinanceReports from '@/apps/finance/pages/Reports';
import MonthVsMonth from '@/apps/finance/pages/MonthVsMonth';
import Balances from '@/apps/finance/pages/Balances';
import BalanceCheck from '@/apps/finance/pages/BalanceCheck';
import BalanceMonth from '@/apps/finance/pages/BalanceMonth';
import WalletAnalytics from '@/apps/finance/pages/WalletAnalytics';
import FinanceSettings from '@/apps/finance/pages/Settings';
import DailyTransactions from '@/apps/finance/pages/DailyTransactions';
import CalendarHeatmap from '@/apps/finance/pages/CalendarHeatmap';
import WeeklyHeatmap from '@/apps/finance/pages/WeeklyHeatmap';
import MonthlyHeatmap from '@/apps/finance/pages/MonthlyHeatmap';
import SavingsRateTrend from '@/apps/finance/pages/SavingsRateTrend';
import CategoryBurnRate from '@/apps/finance/pages/CategoryBurnRate';
import WalletCalendarHeatmap from '@/apps/finance/pages/WalletCalendarHeatmap';

// TV Shows App Pages
import TVShowsDashboard from '@/apps/tv-shows/pages/Dashboard';
import MyShows from '@/apps/tv-shows/pages/MyShows';
import ShowDetail from '@/apps/tv-shows/pages/ShowDetail';
import Universes from '@/apps/tv-shows/pages/Universes';
import UniverseDetail from '@/apps/tv-shows/pages/UniverseDetail';
import UniverseDashboard from '@/apps/tv-shows/pages/UniverseDashboard';
import PrivateUniverses from '@/apps/tv-shows/pages/PrivateUniverses';
import PublicTVShows from '@/apps/tv-shows/pages/PublicShows';
import PublicTVUniverses from '@/apps/tv-shows/pages/PublicUniverses';

// Movies App Pages
import MovieDashboard from '@/apps/movies/src/pages/MovieDashboard';
import MyMovies from '@/apps/movies/src/pages/MyMovies';
import MovieDetail from '@/apps/movies/src/pages/MovieDetail';
import MovieUniverses from '@/apps/movies/src/pages/MovieUniverses';
import MovieUniverseDetail from '@/apps/movies/src/pages/MovieUniverseDetail';
import PublicMoviesPage from '@/apps/movies/src/pages/PublicMovies';
import MovieAnalytics from '@/apps/movies/src/pages/MovieAnalytics';
import ImportMovies from '@/apps/movies/src/pages/ImportMovies';
// Shared Universe App Pages
import SharedUniverseDashboard from '@/apps/shared-universe/pages/SharedUniverseDashboard';
import CreateSharedUniverse from '@/apps/shared-universe/pages/CreateSharedUniverse';
import SharedUniverseDetail from '@/apps/shared-universe/pages/SharedUniverseDetail';
import PublicSharedUniverses from '@/apps/shared-universe/pages/PublicSharedUniverses';


import { SettleBillApp } from '@/apps/settlebill/src/pages/SettleBillApp';

// Household Ledger App
import HouseholdDashboard from '@/apps/household/pages/HouseholdDashboard';
import HouseholdDetail from '@/apps/household/pages/HouseholdDetail';
import HouseholdLedger from '@/apps/household/pages/HouseholdLedger';
import HouseholdBalance from '@/apps/household/pages/HouseholdBalance';
import HouseholdRecurring from '@/apps/household/pages/HouseholdRecurring';
import HouseholdCategories from '@/apps/household/pages/HouseholdCategories';
import HouseholdMembersPage from '@/apps/household/pages/HouseholdMembersPage';
import HouseholdActivity from '@/apps/household/pages/HouseholdActivity';
import HouseholdAnalyticsPage from '@/apps/household/pages/HouseholdAnalyticsPage';
import HouseholdSettings from '@/apps/household/pages/HouseholdSettings';

// Inventory App Pages
import InventoryDashboard from '@/apps/inventory/pages/Dashboard';
import InventoryItems from '@/apps/inventory/pages/Items';
import InventoryCategories from '@/apps/inventory/pages/Categories';
import InventoryTransactions from '@/apps/inventory/pages/Transactions';
import InventoryAnalytics from '@/apps/inventory/pages/Analytics';
import InventorySettings from '@/apps/inventory/pages/Settings';
import InventoryStores from '@/apps/inventory/pages/Stores';
import InventoryStoreDetail from '@/apps/inventory/pages/StoreDetail';

// QuickCommerce App Pages
import StorePage from '@/apps/quick-commerce/pages/StorePage';
import ProductDetailPage from '@/apps/quick-commerce/pages/ProductDetailPage';
import CartPage from '@/apps/quick-commerce/pages/CartPage';
import CheckoutPage from '@/apps/quick-commerce/pages/CheckoutPage';
import OrdersPage from '@/apps/quick-commerce/pages/OrdersPage';
import OrderTrackingPage from '@/apps/quick-commerce/pages/OrderTrackingPage';
import RiderDashboard from '@/apps/quick-commerce/pages/RiderDashboard';
import RiderOrderDetail from '@/apps/quick-commerce/pages/RiderOrderDetail';
import AdminOrdersPage from '@/apps/quick-commerce/pages/AdminOrdersPage';
import AdminRidersPage from '@/apps/quick-commerce/pages/AdminRidersPage';
import DispatchPage from '@/apps/quick-commerce/pages/DispatchPage';
import StoreSettingsPage from '@/apps/quick-commerce/pages/StoreSettingsPage';
import QCAnalyticsPage from '@/apps/quick-commerce/pages/QCAnalyticsPage';

// Images App Pages
import ImagesDashboard from '@/apps/images/pages/ImagesDashboard';
import ImageAlbums from '@/apps/images/pages/ImageAlbums';

// QA Bug Tracker Pages
import QADashboard from '@/apps/qa/pages/QADashboard';
import QAWorkspacesPage from '@/apps/qa/pages/WorkspacesPage';
import QAWorkspaceDetailPage from '@/apps/qa/pages/WorkspaceDetailPage';
import QABoardPage from '@/apps/qa/pages/BoardPage';
import QATestCasesPage from '@/apps/qa/pages/TestCasesPage';
import QATestCoveragePage from '@/apps/qa/pages/TestCoveragePage';
import QATestCasesLanding from '@/apps/qa/pages/TestCasesLanding';
import QATestCoverageLanding from '@/apps/qa/pages/TestCoverageLanding';
import ImageFavorites from '@/apps/images/pages/ImageFavorites';
import { OverviewPage } from '@/apps/settlebill/src/pages/OverviewPage';
import { NetworksPage } from '@/apps/settlebill/src/pages/NetworksPage';
import { CreateNetworkPage } from '@/apps/settlebill/src/pages/CreateNetworkPage';
import { NetworkDetailPage } from '@/apps/settlebill/src/pages/NetworkDetailPage';
import { MembersPage } from '@/apps/settlebill/src/pages/MembersPage';
import { BillsPage } from '@/apps/settlebill/src/pages/BillsPage';
import { CreateBillPage } from '@/apps/settlebill/src/pages/CreateBillPage';
import { BillDetailPage } from '@/apps/settlebill/src/pages/BillDetailPage';
import { BillEditPage } from '@/apps/settlebill/src/pages/BillEditPage';

import { SettleBillSettingsPage } from '@/apps/settlebill/src/pages/SettingsPage';
import { ItemizedBillPage } from '@/apps/settlebill/src/pages/ItemizedBillPage';
import { PublicFinalCalculationPage } from '@/apps/settlebill/src/pages/PublicFinalCalculationPage';
import { FinalCalculationsPage } from '@/apps/settlebill/src/pages/FinalCalculationsPage';

// Admin Pages
import AdminDashboard from '@/apps/admin/pages/Dashboard';
import AdminUsers from '@/apps/admin/pages/Users';
import AdminContent from '@/apps/admin/pages/Content';
import AdminAddShow from '@/pages/admin/AdminAddShow';
import AdminMovieImport from '@/pages/AdminMovieImport';
import AdminPublic from './pages/admin/AdminPublic';
import AdminSEO from './pages/admin/AdminSEO';

// Legal Pages
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Sitemap from '@/pages/Sitemap';

// Prediction App Pages
import PredictionDashboard from '@/apps/prediction/pages/PredictionDashboard';
import PredictionMatches from '@/apps/prediction/pages/PredictionMatches';
import PredictionLeaderboard from '@/apps/prediction/pages/PredictionLeaderboard';
import PredictionRooms from '@/apps/prediction/pages/PredictionRooms';
import PredictionRoomDetail from '@/apps/prediction/pages/PredictionRoomDetail';
import PredictionRules from '@/apps/prediction/pages/PredictionRules';
import PredictionAdmin from '@/apps/prediction/pages/PredictionAdmin';

// Native App Handler
import NativeAppHandler from '@/components/NativeAppHandler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OrganizationProvider>
            <Router>
              <NativeAppHandler>
              <div className="min-h-screen bg-background">
                {/* Landing Page */}
                <Routes>
                  <Route path="/landing" element={<Landing />} />
                  
                  {/* Legal Pages */}
                  <Route path="/terms-of-service" element={
                    <AppLayout>
                      <TermsOfService />
                    </AppLayout>
                  } />
                  <Route path="/privacy-policy" element={
                    <AppLayout>
                      <PrivacyPolicy />
                    </AppLayout>
                  } />
                  <Route path="/sitemap" element={
                    <AppLayout>
                      <Sitemap />
                    </AppLayout>
                  } />
                  <Route path="/requests" element={
                    <AppLayout>
                      <Requests />
                    </AppLayout>
                  } />

                  {/* Auth Routes */}
                  <Route path="/login" element={
                    <AppLayout>
                      <RedirectIfAuth><Login /></RedirectIfAuth>
                    </AppLayout>
                  } />
                  <Route path="/signup" element={
                    <AppLayout>
                      <RedirectIfAuth><SignUp /></RedirectIfAuth>
                    </AppLayout>
                  } />

                  {/* Public Routes that don't require auth */}
                  <Route path="/public/shows" element={
                    <AppLayout>
                      <PublicShows />
                    </AppLayout>
                  } />
                  <Route path="/public/shows/:slug" element={
                    <AppLayout>
                      <PublicShowDetail />
                    </AppLayout>
                  } />
                  <Route path="/public/show/:slug" element={
                    <AppLayout>
                      <PublicShowDetail />
                    </AppLayout>
                  } />
                  <Route path="/public/universes" element={
                    <AppLayout>
                      <PublicUniverses />
                    </AppLayout>
                  } />
                  <Route path="/public/universes/:slug" element={
                    <AppLayout>
                      <PublicUniverseDetail />
                    </AppLayout>
                  } />
                  <Route path="/public/universe/:slug" element={
                    <AppLayout>
                      <PublicUniverseDetail />
                    </AppLayout>
                  } />
                  <Route path="/final-calculation/:shareId" element={<PublicFinalCalculationPage />} />

                  {/* Protected Routes */}
                  <Route path="/" element={
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  } />
                  
                  <Route path="/profile" element={
                    <RequireAuth>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </RequireAuth>
                  } />
                  
                  <Route path="/settings" element={
                    <RequireAuth>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </RequireAuth>
                  } />

                  {/* Requests route moved to legal/public section above */}

                  {/* Finance App Routes */}
                  <Route path="/finance" element={
                    <RequireAuth>
                      <RequireAppEnabled appKey="finance">
                      <AppLayout>
                        <FinanceDashboard />
                      </AppLayout>
                      </RequireAppEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/finance/transactions" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Transactions /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/multiple-transactions" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><MultipleTransactions /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/scheduled-payments" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><ScheduledPayments /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  {/* Notifications App Route */}
                  <Route path="/notifications" element={
                    <RequireAuth><RequireAppEnabled appKey="notifications"><AppLayout><FinanceNotifications /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/categories" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Categories /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/categories/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><CategoryDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/wallets" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Wallets /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/wallets/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><WalletDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/wallet/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><WalletDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/budgets" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Budgets /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/companies" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Companies /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/credits" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Credits /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/transfers" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Transfers /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/reports" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><FinanceReports /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/month-vs-month" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><MonthVsMonth /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/balances" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><Balances /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/balance-check" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><BalanceCheck /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/settings" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><FinanceSettings /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/balance-month" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><BalanceMonth /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/wallet-analytics" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><WalletAnalytics /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/daily-transactions" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><DailyTransactions /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/calendar-heatmap" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><CalendarHeatmap /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/weekly-heatmap" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><WeeklyHeatmap /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/monthly-heatmap" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><MonthlyHeatmap /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/savings-rate" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><SavingsRateTrend /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/burn-rate" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><CategoryBurnRate /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />
                   <Route path="/finance/wallet-calendar-heatmap" element={
                     <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><WalletCalendarHeatmap /></AppLayout></RequireAppEnabled></RequireAuth>
                   } />

                   {/* TV Shows App Routes */}
                  <Route path="/tv-shows" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><TVShowsDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/my-shows" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><MyShows /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/shows/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><ShowDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/show/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><ShowDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/universes" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><PrivateUniverses /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/universes/:slug" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><UniverseDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/universe/:slug" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><UniverseDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/universes/:slug/dashboard" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><UniverseDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/public" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><PublicTVShows /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/public/universes" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><PublicTVUniverses /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/tv-shows/private/universes" element={
                    <RequireAuth><RequireAppEnabled appKey="tvShows"><AppLayout><PrivateUniverses /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Movies App Routes */}
                  <Route path="/movies" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MovieDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/my-movies" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MyMovies /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/detail/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MovieDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/universes" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MovieUniverses /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/universes/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MovieUniverseDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/public" element={
                    <AppLayout><PublicMoviesPage /></AppLayout>
                  } />
                  <Route path="/movies/analytics" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><MovieAnalytics /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/movies/import" element={
                    <RequireAuth><RequireAppEnabled appKey="movies"><AppLayout><ImportMovies /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Shared Universe App Routes */}
                  <Route path="/shared-universe" element={
                    <RequireAuth><RequireAppEnabled appKey="sharedUniverse"><AppLayout><SharedUniverseDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/shared-universe/create" element={
                    <RequireAuth><RequireAppEnabled appKey="sharedUniverse"><AppLayout><CreateSharedUniverse /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/shared-universe/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="sharedUniverse"><AppLayout><SharedUniverseDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/public/shared-universes" element={
                    <AppLayout><PublicSharedUniverses /></AppLayout>
                  } />

                  {/* SettleBill App Routes */}
                  <Route path="/settlebill" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <OverviewPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/networks" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <NetworksPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/networks/create" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <CreateNetworkPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/networks/:id" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <NetworkDetailPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/members" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <MembersPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/bills" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <BillsPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/bills/create" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <CreateBillPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/bills/itemized" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <ItemizedBillPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/bills/:id" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <BillDetailPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/bills/:id/edit" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <BillEditPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/settings" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <SettleBillSettingsPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />
                  <Route path="/settlebill/final-calculations" element={
                    <RequireAuth>
                      <RequireSettleBillEnabled>
                        <AppLayout>
                          <FinalCalculationsPage />
                        </AppLayout>
                      </RequireSettleBillEnabled>
                    </RequireAuth>
                  } />

                  {/* Household Ledger Routes */}
                  <Route path="/household" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/ledger" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdLedger /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/balance" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdBalance /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/recurring" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdRecurring /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/categories" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdCategories /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/members" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdMembersPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/activity" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdActivity /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/analytics" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdAnalyticsPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/household/:id/settings" element={
                    <RequireAuth><RequireAppEnabled appKey="household"><AppLayout><HouseholdSettings /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Inventory App Routes */}
                  <Route path="/inventory" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/items" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryItems /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/categories" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryCategories /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/transactions" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryTransactions /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/analytics" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryAnalytics /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/settings" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventorySettings /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/stores" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryStores /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/inventory/stores/:storeId" element={
                    <RequireAuth><RequireAppEnabled appKey="inventory"><AppLayout><InventoryStoreDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* QuickCommerce Routes */}
                  <Route path="/store" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><StorePage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/store/product/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><ProductDetailPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/store/cart" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><CartPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/store/checkout" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><CheckoutPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/store/orders" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><OrdersPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/store/order/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><OrderTrackingPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/rider/dashboard" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><RiderDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/rider/order/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="quickCommerce"><AppLayout><RiderOrderDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/admin/qc-orders" element={
                    <RequireAuth><RequireAdmin><RequireAppEnabled appKey="quickCommerce"><AppLayout><AdminOrdersPage /></AppLayout></RequireAppEnabled></RequireAdmin></RequireAuth>
                  } />
                  <Route path="/admin/qc-riders" element={
                    <RequireAuth><RequireAdmin><RequireAppEnabled appKey="quickCommerce"><AppLayout><AdminRidersPage /></AppLayout></RequireAppEnabled></RequireAdmin></RequireAuth>
                  } />
                  <Route path="/admin/qc-dispatch" element={
                    <RequireAuth><RequireAdmin><RequireAppEnabled appKey="quickCommerce"><AppLayout><DispatchPage /></AppLayout></RequireAppEnabled></RequireAdmin></RequireAuth>
                  } />
                  <Route path="/admin/qc-store-settings" element={
                    <RequireAuth><RequireAdmin><RequireAppEnabled appKey="quickCommerce"><AppLayout><StoreSettingsPage /></AppLayout></RequireAppEnabled></RequireAdmin></RequireAuth>
                  } />
                  <Route path="/admin/qc-analytics" element={
                    <RequireAuth><RequireAdmin><RequireAppEnabled appKey="quickCommerce"><AppLayout><QCAnalyticsPage /></AppLayout></RequireAppEnabled></RequireAdmin></RequireAuth>
                  } />

                  {/* Images App Routes */}
                  <Route path="/images" element={
                    <RequireAuth><RequireAppEnabled appKey="images"><AppLayout><ImagesDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/images/albums" element={
                    <RequireAuth><RequireAppEnabled appKey="images"><AppLayout><ImageAlbums /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/images/favorites" element={
                    <RequireAuth><RequireAppEnabled appKey="images"><AppLayout><ImageFavorites /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Finance Tools & Nepali Report */}
                  <Route path="/finance/tools" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><FinanceTools /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/finance/nepali-report" element={
                    <RequireAuth><RequireAppEnabled appKey="finance"><AppLayout><NepaliDateReport /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminDashboard />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/users" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminUsers />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/content" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminContent />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/add-show" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminAddShow />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/import-movies" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminMovieImport />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/public" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminPublic />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />
                  <Route path="/admin/seo" element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AppLayout>
                          <AdminSEO />
                        </AppLayout>
                      </RequireAdmin>
                    </RequireAuth>
                  } />

                  {/* QA Bug Tracker Routes */}
                  <Route path="/qa" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QADashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/dashboard" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QADashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/workspaces" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QAWorkspacesPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/workspaces/:id" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QAWorkspaceDetailPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/boards/:boardId" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QABoardPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/workspaces/:id/test-cases" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QATestCasesPage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/workspaces/:id/test-coverage" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QATestCoveragePage /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/test-cases" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QATestCasesLanding /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/qa/test-coverage" element={
                    <RequireAuth><RequireAppEnabled appKey="qa"><AppLayout><QATestCoverageLanding /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Prediction App Routes */}
                  <Route path="/prediction" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionDashboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/matches" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionMatches /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/leaderboard" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionLeaderboard /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/rooms" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionRooms /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/rooms/:roomId" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionRoomDetail /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/rules" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionRules /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />
                  <Route path="/prediction/admin" element={
                    <RequireAuth><RequireAppEnabled appKey="prediction"><AppLayout><PredictionAdmin /></AppLayout></RequireAppEnabled></RequireAuth>
                  } />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
              </NativeAppHandler>
            </Router>
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
