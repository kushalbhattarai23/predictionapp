import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationProvider';

import RequireAuth from '@/components/Auth/RequireAuth';
import RequireAdmin from '@/components/Auth/RequireAdmin';
import RedirectIfAuth from '@/components/Auth/RedirectIfAuth';
import RequireAppEnabled from '@/components/Auth/RequireAppEnabled';

import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Landing from '@/pages/Landing';

import Login from '@/apps/authentication/pages/Login';
import SignUp from '@/apps/authentication/pages/SignUp';
import Profile from '@/pages/Profile';
import Settings from '@/apps/authentication/pages/Settings';

import AdminDashboard from '@/apps/admin/pages/Dashboard';
import AdminUsers from '@/apps/admin/pages/Users';
import AdminContent from '@/apps/admin/pages/Content';

import PredictionDashboard from '@/apps/prediction/pages/PredictionDashboard';
import PredictionMatches from '@/apps/prediction/pages/PredictionMatches';
import PredictionLeaderboard from '@/apps/prediction/pages/PredictionLeaderboard';
import PredictionRooms from '@/apps/prediction/pages/PredictionRooms';
import PredictionRoomDetail from '@/apps/prediction/pages/PredictionRoomDetail';
import PredictionRules from '@/apps/prediction/pages/PredictionRules';
import PredictionAdmin from '@/apps/prediction/pages/PredictionAdmin';

import NativeAppHandler from '@/components/NativeAppHandler';
import { AppLayout } from '@/components/Layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
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
                  <Routes>
                    <Route path="/landing" element={<Landing />} />
                    <Route path="/" element={<Index />} />

                    <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
                    <Route path="/signup" element={<RedirectIfAuth><SignUp /></RedirectIfAuth>} />

                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

                    <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminDashboard /></RequireAdmin></RequireAuth>} />
                    <Route path="/admin/users" element={<RequireAuth><RequireAdmin><AdminUsers /></RequireAdmin></RequireAuth>} />
                    <Route path="/admin/content" element={<RequireAuth><RequireAdmin><AdminContent /></RequireAdmin></RequireAuth>} />

                    <Route path="/prediction" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionDashboard /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/matches" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionMatches /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/leaderboard" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionLeaderboard /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/rooms" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionRooms /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/rooms/:roomId" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionRoomDetail /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/rules" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionRules /></RequireAppEnabled></RequireAuth>} />
                    <Route path="/prediction/admin" element={<RequireAuth><RequireAppEnabled appKey="prediction"><PredictionAdmin /></RequireAppEnabled></RequireAuth>} />

                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Toaster />
              </NativeAppHandler>
            </Router>
          </OrganizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
