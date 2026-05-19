import React, { useState } from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { useCreateRoom, useRooms } from '../hooks/usePrediction';
import { predTheme } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PredictionRooms() {
  const { user } = useAuth();
  const { data: rooms = [], isLoading } = useRooms();
  const create = useCreateRoom();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [outcome, setOutcome] = useState(3);
  const [exact, setExact] = useState(2);
  const [gd, setGd] = useState(0);
  const [koMult, setKoMult] = useState(1);

  const submit = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({
      name: name.trim(),
      description: desc.trim() || undefined,
      points_outcome: outcome,
      points_exact_bonus: exact,
      points_goal_diff_bonus: gd,
      knockout_multiplier: koMult,
    });
    setOpen(false);
    setName(''); setDesc('');
  };

  return (
    <PredictionLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className={cn('text-4xl', predTheme.heading)}>Private rooms</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={predTheme.primary}><Plus className="h-4 w-4 mr-1" /> New room</Button>
          </DialogTrigger>
          <DialogContent className={cn(predTheme.bgSoft, predTheme.text, predTheme.border, 'border')}>
            <DialogHeader>
              <DialogTitle className={cn(predTheme.heading, 'text-2xl')}>Create a room</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Outcome pts</Label>
                  <Input type="number" value={outcome} onChange={(e) => setOutcome(Number(e.target.value))} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
                </div>
                <div>
                  <Label>Exact-score bonus</Label>
                  <Input type="number" value={exact} onChange={(e) => setExact(Number(e.target.value))} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
                </div>
                <div>
                  <Label>Goal-diff bonus</Label>
                  <Input type="number" value={gd} onChange={(e) => setGd(Number(e.target.value))} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
                </div>
                <div>
                  <Label>Knockout multiplier</Label>
                  <Input type="number" step="0.25" value={koMult} onChange={(e) => setKoMult(Number(e.target.value))} className={cn(predTheme.surface, predTheme.border, 'border text-white')} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} className={predTheme.text}>Cancel</Button>
              <Button onClick={submit} className={predTheme.primary} disabled={create.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className={predTheme.textMuted}>Loading…</div>
      ) : rooms.length === 0 ? (
        <div className={cn('p-8 text-center border', predTheme.border, predTheme.radius, predTheme.surface)}>
          <Users2 className={cn('mx-auto h-10 w-10 mb-2', predTheme.primaryText)} />
          <div className={cn('text-xl', predTheme.heading)}>No rooms yet</div>
          <p className={cn('text-sm mt-1', predTheme.textMuted)}>Create one to invite friends and compete with custom scoring.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map((r: any) => (
            <Link
              key={r.id}
              to={`/prediction/rooms/${r.id}`}
              className={cn('block p-4 border hover:bg-white/5 transition', predTheme.border, predTheme.radius, predTheme.surface)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl font-semibold">{r.name}</div>
                  {r.description && <div className={cn('text-sm', predTheme.textMuted)}>{r.description}</div>}
                </div>
                {r.owner_id === user?.id && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.78_0.20_145/.18)] text-[oklch(0.92_0.18_145)]">Owner</span>
                )}
              </div>
              <div className={cn('mt-2 text-xs', predTheme.textMuted)}>
                {r.points_outcome} outcome · +{r.points_exact_bonus} exact · +{r.points_goal_diff_bonus} GD · KO×{r.knockout_multiplier}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PredictionLayout>
  );
}
