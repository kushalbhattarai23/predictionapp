import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Trophy, CalendarDays, ListOrdered, Users2, BookOpen, ShieldCheck, Home } from 'lucide-react';
import { predTheme } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';
import { usePredictionProfile, usePredictionRole } from '../hooks/usePrediction';

export const PredictionLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: profile } = usePredictionProfile();
  const { data: role } = usePredictionRole();
  const isAdmin = !!role?.isAdmin;
  const loc = useLocation();

  const nav = [
    { to: '/prediction', label: 'Dashboard', icon: Home, end: true },
    { to: '/prediction/matches', label: 'Matches', icon: CalendarDays },
    { to: '/prediction/leaderboard', label: 'Leaderboard', icon: ListOrdered },
    { to: '/prediction/rooms', label: 'Rooms', icon: Users2 },
    { to: '/prediction/rules', label: 'Rules', icon: BookOpen },
    ...(isAdmin ? [{ to: '/prediction/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <div className={cn('min-h-[calc(100vh-4rem)] -m-3 sm:-m-4 lg:-m-6', predTheme.pitch, predTheme.text, predTheme.body)}>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {profile && !profile.is_active ? (
          <div className={cn('p-6 border', predTheme.border, predTheme.radius, 'bg-[oklch(0.20_0.03_250)]')}>
            <h2 className={cn('text-2xl mb-2', predTheme.heading)}>Account deactivated</h2>
            <p className={predTheme.textMuted}>
              Your predictor account is currently inactive. Please contact the league admin to be reactivated.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};
