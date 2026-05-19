import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { predTheme } from '../lib/predictionTheme';
import type { MatchRow, Pick } from '../hooks/usePrediction';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  match: MatchRow;
  initial?: { pick?: Pick; score_a?: number | null; score_b?: number | null; pen_winner?: 'team_a' | 'team_b' | null };
  onSubmit: (p: { pick: Pick; score_a: number | null; score_b: number | null; pen_winner: 'team_a' | 'team_b' | null }) => Promise<void> | void;
  title?: string;
}

const clamp = (v: number) => Math.max(0, Math.min(20, isNaN(v) ? 0 : v));

export const PredictionDialog: React.FC<Props> = ({ open, onOpenChange, match, initial, onSubmit, title }) => {
  const isKnockout = match.stage !== 'group';
  const [pick, setPick] = useState<Pick>(initial?.pick ?? (isKnockout ? 'team_a' : 'team_a'));
  const [sa, setSa] = useState<string>(initial?.score_a?.toString() ?? '');
  const [sb, setSb] = useState<string>(initial?.score_b?.toString() ?? '');
  const [penWinner, setPenWinner] = useState<'team_a' | 'team_b' | null>(initial?.pen_winner ?? null);

  useEffect(() => {
    setPick(initial?.pick ?? 'team_a');
    setSa(initial?.score_a?.toString() ?? '');
    setSb(initial?.score_b?.toString() ?? '');
    setPenWinner(initial?.pen_winner ?? null);
  }, [match.id, open]);

  const drawn = sa !== '' && sb !== '' && Number(sa) === Number(sb);

  const submit = async () => {
    const scA = sa === '' ? null : clamp(Number(sa));
    const scB = sb === '' ? null : clamp(Number(sb));
    if (isKnockout) {
      if (pick === 'draw') return;
      if (scA !== null && scB !== null && scA === scB && !penWinner) {
        // need penalty winner if drawn score given
        return;
      }
    }
    await onSubmit({ pick, score_a: scA, score_b: scB, pen_winner: isKnockout && scA !== null && scB !== null && scA === scB ? penWinner : null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-lg', predTheme.bgSoft, predTheme.text, predTheme.border, 'border')}>
        <DialogHeader>
          <DialogTitle className={cn(predTheme.heading, 'text-2xl')}>
            {title ?? 'Your prediction'}
          </DialogTitle>
          <p className={cn('text-sm', predTheme.textMuted)}>
            {match.team_a} vs {match.team_b} · {new Date(match.kickoff_at).toLocaleString()}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Outcome</Label>
            <RadioGroup value={pick} onValueChange={(v) => setPick(v as Pick)} className="grid grid-cols-3 gap-2">
              <label className={cn('flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2', predTheme.border, pick === 'team_a' && 'bg-[oklch(0.78_0.20_145/.15)]')}>
                <RadioGroupItem value="team_a" />
                <span className="truncate">{match.team_a}</span>
              </label>
              <label className={cn('flex items-center justify-center gap-2 cursor-pointer rounded-md border px-3 py-2', predTheme.border, pick === 'draw' && 'bg-[oklch(0.78_0.20_145/.15)]', isKnockout && 'opacity-40 pointer-events-none')}>
                <RadioGroupItem value="draw" disabled={isKnockout} />
                <span>Draw</span>
              </label>
              <label className={cn('flex items-center justify-end gap-2 cursor-pointer rounded-md border px-3 py-2', predTheme.border, pick === 'team_b' && 'bg-[oklch(0.78_0.20_145/.15)]')}>
                <span className="truncate">{match.team_b}</span>
                <RadioGroupItem value="team_b" />
              </label>
            </RadioGroup>
            {isKnockout && (
              <p className={cn('text-xs mt-1', predTheme.textMuted)}>Knockout match: draw not allowed.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{match.team_a} score</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={sa}
                onChange={(e) => setSa(e.target.value)}
                className={cn(predTheme.surface, predTheme.border, 'border text-white')}
              />
            </div>
            <div>
              <Label className="mb-1 block">{match.team_b} score</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={sb}
                onChange={(e) => setSb(e.target.value)}
                className={cn(predTheme.surface, predTheme.border, 'border text-white')}
              />
            </div>
          </div>

          {isKnockout && drawn && (
            <div>
              <Label className="mb-2 block">Penalty shootout winner</Label>
              <RadioGroup value={penWinner ?? ''} onValueChange={(v) => setPenWinner(v as any)} className="grid grid-cols-2 gap-2">
                <label className={cn('flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2', predTheme.border, penWinner === 'team_a' && 'bg-[oklch(0.74_0.18_50/.15)]')}>
                  <RadioGroupItem value="team_a" />
                  <span>{match.team_a}</span>
                </label>
                <label className={cn('flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2', predTheme.border, penWinner === 'team_b' && 'bg-[oklch(0.74_0.18_50/.15)]')}>
                  <RadioGroupItem value="team_b" />
                  <span>{match.team_b}</span>
                </label>
              </RadioGroup>
              {!penWinner && (
                <p className={cn('text-xs mt-1', predTheme.accentText)}>Pick a penalty winner — knockouts must have a winner.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className={predTheme.text}>Cancel</Button>
          <Button onClick={submit} className={predTheme.primary}>Save prediction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
