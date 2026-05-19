import React from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { useGlobalLeaderboard } from '../hooks/usePrediction';
import { cn } from '@/lib/utils';
import { predTheme } from '../lib/predictionTheme';
import { Trophy, Medal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PredictionLeaderboard() {
  const { data: lb = [], isLoading } = useGlobalLeaderboard();
  const { user } = useAuth();

  const podium = lb.slice(0, 3);
  const rest = lb.slice(3);

  return (
    <PredictionLayout>
      <h1 className={cn('text-4xl mb-6', predTheme.heading)}>Global leaderboard</h1>

      {isLoading ? (
        <div className={predTheme.textMuted}>Loading…</div>
      ) : lb.length === 0 ? (
        <div className={cn('p-6 border', predTheme.border, predTheme.radius, predTheme.surface, predTheme.textMuted)}>
          No predictions scored yet.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {[1, 0, 2].map((i) => {
              const row = podium[i];
              if (!row) return <div key={i} />;
              const place = i + 1;
              const isFirst = place === 1;
              const Icon = place === 1 ? Trophy : Medal;
              return (
                <div
                  key={row.user_id}
                  className={cn(
                    'p-6 border text-center',
                    predTheme.border,
                    predTheme.radius,
                    predTheme.surface,
                    isFirst && 'md:scale-105 ring-1 ring-[oklch(0.84_0.15_85/.5)]',
                  )}
                >
                  <Icon className={cn('mx-auto h-10 w-10 mb-2', place === 1 ? predTheme.gold : 'text-white/60')} />
                  <div className={cn('text-5xl', predTheme.heading, predTheme.gold)}>#{place}</div>
                  <div className="mt-1 font-semibold">{row.username}</div>
                  <div className={cn('text-xs', predTheme.textMuted)}>{row.full_name}</div>
                  <div className={cn('mt-2 text-2xl', predTheme.heading)}>{row.points} pts</div>
                </div>
              );
            })}
          </div>

          <div className={cn('border overflow-hidden', predTheme.border, predTheme.radius, predTheme.surface)}>
            {rest.map((row: any, i: number) => {
              const rank = i + 4;
              const isMe = user?.id === row.user_id;
              return (
                <div key={row.user_id} className={cn('flex items-center justify-between px-4 py-3', i > 0 && 'border-t', predTheme.border, isMe && 'bg-[oklch(0.78_0.20_145/.10)]')}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-white/70">#{rank}</span>
                    <div>
                      <div className="font-medium">{row.username} {isMe && <span className={cn('text-xs ml-1', predTheme.primaryText)}>(you)</span>}</div>
                      {row.full_name && <div className={cn('text-xs', predTheme.textMuted)}>{row.full_name}</div>}
                    </div>
                  </div>
                  <div className={cn('tabular-nums', predTheme.gold)}>{row.points} pts</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PredictionLayout>
  );
}
