import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PredictionLayout } from '../components/PredictionLayout';
import {
  useMatches,
  useMyRoomPredictions,
  useRemoveMember,
  useRoom,
  useRoomLeaderboard,
  useRoomMembers,
  useSubmitRoomPrediction,
  useSyncGlobalToRoom,
  useInviteMember,
  type MatchRow,
} from '../hooks/usePrediction';
import { predTheme, stages } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MatchCard } from '../components/MatchCard';
import { PredictionDialog } from '../components/PredictionDialog';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, RefreshCw, Trash2, UserPlus, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PredictionRoomDetail() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room } = useRoom(roomId);
  const { data: members = [] } = useRoomMembers(roomId);
  const { data: lb = [] } = useRoomLeaderboard(roomId);
  const { data: matches = [] } = useMatches();
  const { data: myPreds = [] } = useMyRoomPredictions(roomId);
  const submit = useSubmitRoomPrediction(roomId);
  const invite = useInviteMember(roomId);
  const remove = useRemoveMember(roomId);
  const sync = useSyncGlobalToRoom(roomId);

  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<MatchRow | null>(null);

  const isOwner = room?.owner_id === user?.id;
  const predByMatch = useMemo(() => {
    const m = new Map<string, any>();
    myPreds.forEach((p: any) => m.set(p.match_id, p));
    return m;
  }, [myPreds]);

  const now = Date.now();
  const upcoming = matches.filter((m) => m.status === 'scheduled' && new Date(m.kickoff_at).getTime() > now);
  const finished = matches.filter((m) => m.status === 'finished');

  const handleLeave = async () => {
    if (!user) return;
    if (isOwner) { toast.error('Owners cannot leave their own room'); return; }
    const { error } = await supabase
      .from('football_room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Left the room');
    navigate('/prediction/rooms');
  };

  if (!room) {
    return <PredictionLayout><div className={predTheme.textMuted}>Loading room…</div></PredictionLayout>;
  }

  return (
    <PredictionLayout>
      <button onClick={() => navigate('/prediction/rooms')} className={cn('mb-3 inline-flex items-center gap-1 text-sm', predTheme.textMuted)}>
        <ArrowLeft className="h-4 w-4" /> Back to rooms
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className={cn('text-4xl', predTheme.heading)}>{room.name}</h1>
          {room.description && <p className={cn('text-sm mt-1', predTheme.textMuted)}>{room.description}</p>}
          <p className={cn('text-xs mt-1', predTheme.textMuted)}>
            {room.points_outcome} outcome · +{room.points_exact_bonus} exact · +{room.points_goal_diff_bonus} GD · KO×{room.knockout_multiplier}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => sync.mutate()} disabled={sync.isPending} className={cn('border', predTheme.border, predTheme.text)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Sync my global picks
          </Button>
          {!isOwner && (
            <Button variant="ghost" onClick={handleLeave} className={cn('border', predTheme.border, predTheme.text)}>
              <LogOut className="h-4 w-4 mr-1" /> Leave
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="matches">
        <TabsList className={cn('bg-white/5 border', predTheme.border)}>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <h3 className={cn('text-2xl mb-2', predTheme.heading)}>Upcoming</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predByMatch.get(m.id) ?? null}
                canPredict
                onPredict={() => setSelected(m)}
              />
            ))}
            {upcoming.length === 0 && (
              <div className={cn('p-6 border', predTheme.border, predTheme.radius, predTheme.surface, predTheme.textMuted)}>
                No upcoming matches.
              </div>
            )}
          </div>

          {finished.length > 0 && (
            <>
              <h3 className={cn('text-2xl mb-2 mt-6', predTheme.heading)}>Finished</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {finished.map((m) => (
                  <MatchCard key={m.id} match={m} prediction={predByMatch.get(m.id) ?? null} canPredict={false} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <div className={cn('border overflow-hidden', predTheme.border, predTheme.radius, predTheme.surface)}>
            {lb.map((row: any, i: number) => (
              <div key={row.user_id} className={cn('flex items-center justify-between px-4 py-3', i > 0 && 'border-t', predTheme.border)}>
                <div className="flex items-center gap-3">
                  <span className={cn('w-7 text-center font-bold', i === 0 ? predTheme.gold : 'text-white/70')}>#{i + 1}</span>
                  <div className="font-medium">{row.username}</div>
                </div>
                <div className={cn('tabular-nums', predTheme.gold)}>{row.points} pts</div>
              </div>
            ))}
            {lb.length === 0 && <div className={cn('p-4', predTheme.textMuted)}>No scores yet in this room.</div>}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          {isOwner && (
            <div className={cn('p-4 border mb-4', predTheme.border, predTheme.radius, predTheme.surface)}>
              <Label>Invite by email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@email.com"
                  className={cn(predTheme.surface, predTheme.border, 'border text-white')}
                />
                <Button
                  onClick={async () => { if (!email.trim()) return; await invite.mutateAsync(email.trim()); setEmail(''); }}
                  disabled={invite.isPending}
                  className={predTheme.primary}
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Invite
                </Button>
              </div>
            </div>
          )}
          <div className={cn('border overflow-hidden', predTheme.border, predTheme.radius, predTheme.surface)}>
            {members.map((m: any, i: number) => (
              <div key={m.user_id} className={cn('flex items-center justify-between px-4 py-3', i > 0 && 'border-t', predTheme.border)}>
                <div>
                  <div className="font-medium">{m.username} {m.user_id === room.owner_id && <span className={cn('ml-1 text-xs', predTheme.primaryText)}>(owner)</span>}</div>
                  {m.full_name && <div className={cn('text-xs', predTheme.textMuted)}>{m.full_name}</div>}
                </div>
                {isOwner && m.user_id !== room.owner_id && (
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(m.user_id)} className="text-red-300 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {members.length === 0 && <div className={cn('p-4', predTheme.textMuted)}>No members yet.</div>}
          </div>
        </TabsContent>
      </Tabs>

      {selected && (
        <PredictionDialog
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          match={selected}
          initial={predByMatch.get(selected.id) ?? undefined}
          title={`Pick for ${room.name}`}
          onSubmit={async (p) => { await submit.mutateAsync({ match_id: selected.id, ...p }); }}
        />
      )}
    </PredictionLayout>
  );
}
