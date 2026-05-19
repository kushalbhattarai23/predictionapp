import React from 'react';
import { cn } from '@/lib/utils';
import { predTheme, stages } from '../lib/predictionTheme';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';
import type { MatchRow } from '../hooks/usePrediction';

interface Props {
  match: MatchRow;
  prediction?: { pick: string; score_a: number | null; score_b: number | null; pen_winner: string | null; points_awarded?: number } | null;
  onPredict?: () => void;
  canPredict?: boolean;
  hidePoints?: boolean;
}

export const MatchCard: React.FC<Props> = ({ match, prediction, onPredict, canPredict, hidePoints }) => {
  const ko = new Date(match.kickoff_at);
  const locked = match.status !== 'scheduled' || ko.getTime() <= Date.now();

  return (
    <div className={cn('p-4 border', predTheme.border, predTheme.radius, predTheme.surface)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn('text-xs uppercase tracking-wider', predTheme.gold)}>
          {stages[match.stage]} {match.group_name ? `· ${match.group_name}` : ''}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {match.status === 'live' && (
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse', predTheme.liveBg)}>LIVE</span>
          )}
          {match.status === 'finished' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10">FT</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div className="text-lg font-semibold">{match.team_a_flag ?? '⚽'} {match.team_a}</div>
        </div>
        <div className="text-center">
          {match.status === 'scheduled' ? (
            <div className={cn('text-2xl', predTheme.heading)}>vs</div>
          ) : (
            <div className={cn('text-3xl tabular-nums', predTheme.heading, predTheme.gold)}>
              {match.score_a ?? 0} – {match.score_b ?? 0}
              {match.pen_a !== null && match.pen_b !== null && (
                <div className={cn('text-xs', predTheme.textMuted)}>
                  pens {match.pen_a}–{match.pen_b}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-left">
          <div className="text-lg font-semibold">{match.team_b} {match.team_b_flag ?? '⚽'}</div>
        </div>
      </div>

      <div className={cn('mt-3 flex flex-wrap items-center gap-3 text-xs', predTheme.textMuted)}>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{ko.toLocaleString()}</span>
        {match.stadium && (
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{match.stadium}{match.city ? `, ${match.city}` : ''}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          {prediction ? (
            <span className={predTheme.textMuted}>
              Your pick: <span className="text-white font-medium">
                {prediction.pick === 'team_a' ? match.team_a : prediction.pick === 'team_b' ? match.team_b : 'Draw'}
              </span>
              {prediction.score_a !== null && prediction.score_b !== null && (
                <> · {prediction.score_a}–{prediction.score_b}</>
              )}
              {!hidePoints && match.status === 'finished' && typeof prediction.points_awarded === 'number' && (
                <> · <span className={predTheme.gold}>{prediction.points_awarded} pts</span></>
              )}
            </span>
          ) : (
            <span className={predTheme.textMuted}>No prediction yet</span>
          )}
        </div>
        {canPredict && (
          <Button
            size="sm"
            disabled={locked}
            onClick={onPredict}
            className={cn(locked ? 'opacity-60 cursor-not-allowed bg-white/10' : predTheme.primary)}
          >
            {locked ? 'Locked' : prediction ? 'Edit pick' : 'Predict'}
          </Button>
        )}
      </div>
    </div>
  );
};
