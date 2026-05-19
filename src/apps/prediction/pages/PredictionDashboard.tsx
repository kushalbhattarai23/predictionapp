import React, { useMemo } from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { useGlobalLeaderboard, useMatches, useMyPredictions, usePredictionProfile } from '../hooks/usePrediction';
import { predTheme, stages } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';
import { Trophy, Target, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PredictionDashboard() {
  const { user } = useAuth();
  const { data: profile } = usePredictionProfile();
  const { data: matches = [] } = useMatches();
  const { data: myPreds = [] } = useMyPredictions();
  const { data: lb = [] } = useGlobalLeaderboard();

  const upcoming = useMemo(
    () => matches.filter((m) => m.status === 'scheduled' && new Date(m.kickoff_at).getTime() > Date.now()).slice(0, 5),
    [matches],
  );
  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = lb.findIndex((r: any) => r.user_id === user.id);
    return idx >= 0 ? { rank: idx + 1, points: lb[idx].points } : null;
  }, [lb, user]);

  const myPoints = useMemo(() => myPreds.reduce((s: number, p: any) => s + (p.points_awarded ?? 0), 0), [myPreds]);
  const myCount = myPreds.length;

  return (
    <PredictionLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Trophy} label="Global rank" value={myRank ? `#${myRank.rank}` : '—'} sub={myRank ? `${myRank.points} pts` : 'Make a prediction'} />
        <StatCard icon={Target} label="Predictions made" value={String(myCount)} sub={`across ${matches.length} matches`} />
        <StatCard icon={Flame} label="Total points" value={String(myPoints)} sub="Updated live" />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className={cn('text-3xl', predTheme.heading)}>Upcoming fixtures</h2>
          <Link to="/prediction/matches" className={cn('text-sm inline-flex items-center gap-1', predTheme.primaryText)}>
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className={cn('p-6 border', predTheme.border, predTheme.radius, predTheme.surface, predTheme.textMuted)}>
            No upcoming matches scheduled yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((m) => (
              <Link to="/prediction/matches" key={m.id} className={cn('block p-4 border hover:bg-white/5 transition', predTheme.border, predTheme.radius, predTheme.surface)}>
                <div className={cn('text-xs uppercase tracking-wider mb-1', predTheme.gold)}>
                  {stages[m.stage]} {m.group_name ? `· ${m.group_name}` : ''}
                </div>
                <div className="font-semibold">{m.team_a} vs {m.team_b}</div>
                <div className={cn('text-xs mt-1', predTheme.textMuted)}>{new Date(m.kickoff_at).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className={cn('text-3xl mb-3', predTheme.heading)}>Top of the table</h2>
        <div className={cn('border', predTheme.border, predTheme.radius, predTheme.surface, 'overflow-hidden')}>
          {lb.slice(0, 5).map((row: any, i: number) => (
            <div key={row.user_id} className={cn('flex items-center justify-between px-4 py-3', i > 0 && 'border-t', predTheme.border)}>
              <div className="flex items-center gap-3">
                <span className={cn('w-7 text-center font-bold', i === 0 ? predTheme.gold : 'text-white/70')}>#{i + 1}</span>
                <div>
                  <div className="font-medium">{row.username}</div>
                  {row.full_name && <div className={cn('text-xs', predTheme.textMuted)}>{row.full_name}</div>}
                </div>
              </div>
              <div className={cn('tabular-nums', predTheme.gold)}>{row.points} pts</div>
            </div>
          ))}
          {lb.length === 0 && <div className={cn('p-4', predTheme.textMuted)}>No scores yet — fixtures will populate the board once results are entered.</div>}
        </div>
      </div>

      {profile && (
        <div className={cn('mt-8 text-xs', predTheme.textMuted)}>
          Signed in as <span className="text-white font-medium">{profile.username}</span>
        </div>
      )}
    </PredictionLayout>
  );
}

const StatCard: React.FC<{ icon: any; label: string; value: string; sub: string }> = ({ icon: Icon, label, value, sub }) => (
  <div className={cn('p-5 border', predTheme.border, predTheme.radius, predTheme.surface)}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
      <Icon className={cn('h-4 w-4', predTheme.primaryText)} /> {label}
    </div>
    <div className={cn('mt-2 text-5xl', predTheme.heading, predTheme.gold)}>{value}</div>
    <div className={cn('mt-1 text-xs', predTheme.textMuted)}>{sub}</div>
  </div>
);
