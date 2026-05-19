import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type MatchRow = {
  id: string;
  team_a: string;
  team_b: string;
  team_a_flag: string | null;
  team_b_flag: string | null;
  group_name: string | null;
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final';
  kickoff_at: string;
  stadium: string | null;
  city: string | null;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  score_a: number | null;
  score_b: number | null;
  pen_a: number | null;
  pen_b: number | null;
};

export type Pick = 'team_a' | 'team_b' | 'draw';

export function usePredictionProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pred-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('football_profiles')
        .select('id, username, full_name, is_active')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
}

export function usePredictionRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pred-role', user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false };
      const { data } = await supabase
        .from('football_user_roles')
        .select('role')
        .eq('user_id', user.id);
      return { isAdmin: !!data?.some((r: any) => r.role === 'admin') };
    },
    enabled: !!user,
  });
}

export function useMatches() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['pred-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('football_matches')
        .select('*')
        .order('kickoff_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MatchRow[];
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel('pred-matches-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'football_matches' }, () =>
        qc.invalidateQueries({ queryKey: ['pred-matches'] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return query;
}

export function useMyPredictions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['pred-my', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('football_predictions')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('pred-my-rt-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'football_predictions', filter: `user_id=eq.${user.id}` }, () =>
        qc.invalidateQueries({ queryKey: ['pred-my', user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, user]);
  return query;
}

export function useSubmitPrediction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { match_id: string; pick: Pick; score_a?: number | null; score_b?: number | null; pen_winner?: 'team_a' | 'team_b' | null }) => {
      if (!user) throw new Error('not signed in');
      const { data, error } = await supabase
        .from('football_predictions')
        .upsert({
          user_id: user.id,
          match_id: p.match_id,
          pick: p.pick,
          score_a: p.score_a ?? null,
          score_b: p.score_b ?? null,
          pen_winner: p.pen_winner ?? null,
        }, { onConflict: 'user_id,match_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Prediction saved');
      qc.invalidateQueries({ queryKey: ['pred-my'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save prediction'),
  });
}

export function useGlobalLeaderboard() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['pred-leaderboard'],
    queryFn: async () => {
      const { data: preds, error } = await supabase
        .from('football_predictions')
        .select('user_id, points_awarded');
      if (error) throw error;
      const totals = new Map<string, number>();
      (preds ?? []).forEach((p: any) => {
        totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + (p.points_awarded ?? 0));
      });
      const ids = Array.from(totals.keys());
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from('football_profiles')
        .select('id, username, full_name')
        .in('id', ids);
      const byId = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
      return Array.from(totals.entries())
        .map(([id, pts]) => ({
          user_id: id,
          username: byId.get(id)?.username ?? 'Player',
          full_name: byId.get(id)?.full_name ?? null,
          points: pts,
        }))
        .sort((a, b) => b.points - a.points);
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel('pred-lb-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'football_predictions' }, () =>
        qc.invalidateQueries({ queryKey: ['pred-leaderboard'] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return query;
}

export function useRooms() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['pred-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('football_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
  return query;
}

export function useCreateRoom() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; points_outcome?: number; points_exact_bonus?: number; points_goal_diff_bonus?: number; knockout_multiplier?: number }) => {
      if (!user) throw new Error('not signed in');
      const { data, error } = await supabase
        .from('football_rooms')
        .insert({ owner_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      // Owner is auto-member by helper, but also add a row so members list shows them
      await supabase.from('football_room_members').insert({ room_id: data.id, user_id: user.id }).then(() => {}, () => {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pred-rooms'] }),
  });
}

export function useRoom(roomId?: string) {
  return useQuery({
    queryKey: ['pred-room', roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data } = await supabase.from('football_rooms').select('*').eq('id', roomId).maybeSingle();
      return data;
    },
    enabled: !!roomId,
  });
}

export function useRoomMembers(roomId?: string) {
  return useQuery({
    queryKey: ['pred-room-members', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data: members } = await supabase
        .from('football_room_members')
        .select('*')
        .eq('room_id', roomId);
      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from('football_profiles')
        .select('id, username, full_name')
        .in('id', ids);
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (members ?? []).map((m: any) => ({
        ...m,
        username: byId.get(m.user_id)?.username ?? 'Player',
        full_name: byId.get(m.user_id)?.full_name ?? null,
      }));
    },
    enabled: !!roomId,
  });
}

export function useRoomLeaderboard(roomId?: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['pred-room-lb', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data: preds } = await supabase
        .from('football_room_predictions')
        .select('user_id, points_awarded')
        .eq('room_id', roomId);
      const totals = new Map<string, number>();
      (preds ?? []).forEach((p: any) => totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + (p.points_awarded ?? 0)));
      // include all members, even with 0
      const { data: members } = await supabase
        .from('football_room_members')
        .select('user_id')
        .eq('room_id', roomId);
      (members ?? []).forEach((m: any) => { if (!totals.has(m.user_id)) totals.set(m.user_id, 0); });
      const ids = Array.from(totals.keys());
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from('football_profiles')
        .select('id, username, full_name')
        .in('id', ids);
      const byId = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
      return Array.from(totals.entries())
        .map(([id, pts]) => ({ user_id: id, username: byId.get(id)?.username ?? 'Player', full_name: byId.get(id)?.full_name ?? null, points: pts }))
        .sort((a, b) => b.points - a.points);
    },
    enabled: !!roomId,
  });
  useEffect(() => {
    if (!roomId) return;
    const ch = supabase
      .channel('pred-room-rt-' + roomId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'football_room_predictions', filter: `room_id=eq.${roomId}` }, () =>
        qc.invalidateQueries({ queryKey: ['pred-room-lb', roomId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, roomId]);
  return query;
}

export function useMyRoomPredictions(roomId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pred-room-my', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user) return [];
      const { data } = await supabase
        .from('football_room_predictions')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id);
      return data ?? [];
    },
    enabled: !!roomId && !!user,
  });
}

export function useSubmitRoomPrediction(roomId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { match_id: string; pick: Pick; score_a?: number | null; score_b?: number | null; pen_winner?: 'team_a' | 'team_b' | null }) => {
      if (!user) throw new Error('not signed in');
      const { data, error } = await supabase
        .from('football_room_predictions')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          match_id: p.match_id,
          pick: p.pick,
          score_a: p.score_a ?? null,
          score_b: p.score_b ?? null,
          pen_winner: p.pen_winner ?? null,
        }, { onConflict: 'room_id,user_id,match_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Room prediction saved');
      qc.invalidateQueries({ queryKey: ['pred-room-my', roomId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save prediction'),
  });
}

// Lookup a user_id by email via the security-definer RPC.
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('football_find_user_id_by_email' as any, { _email: email });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export function useInviteMember(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const id = await findUserIdByEmail(email.trim());
      if (!id) throw new Error('No predictor account found for that email');
      const { error } = await supabase.from('football_room_members').insert({ room_id: roomId, user_id: id });
      if (error) {
        if ((error as any).code === '23505') return { duplicate: true };
        throw error;
      }
      return { duplicate: false };
    },
    onSuccess: (res: any) => {
      if (res?.duplicate) toast.message('Member already in this room');
      else toast.success('Member invited');
      qc.invalidateQueries({ queryKey: ['pred-room-members', roomId] });
      qc.invalidateQueries({ queryKey: ['pred-room-lb', roomId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Invite failed'),
  });
}

export function useRemoveMember(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('football_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['pred-room-members', roomId] });
      qc.invalidateQueries({ queryKey: ['pred-room-lb', roomId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Remove failed'),
  });
}

export function useSyncGlobalToRoom(roomId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not signed in');
      const nowIso = new Date().toISOString();
      const { data: matches } = await supabase
        .from('football_matches')
        .select('id')
        .eq('status', 'scheduled')
        .gt('kickoff_at', nowIso);
      const ids = (matches ?? []).map((m: any) => m.id);
      if (ids.length === 0) return { copied: 0 };
      const { data: globals } = await supabase
        .from('football_predictions')
        .select('match_id, pick, score_a, score_b, pen_winner')
        .eq('user_id', user.id)
        .in('match_id', ids);
      if (!globals || globals.length === 0) return { copied: 0 };
      const rows = globals.map((g: any) => ({
        room_id: roomId,
        user_id: user.id,
        match_id: g.match_id,
        pick: g.pick,
        score_a: g.score_a,
        score_b: g.score_b,
        pen_winner: g.pen_winner,
      }));
      const { error } = await supabase
        .from('football_room_predictions')
        .upsert(rows, { onConflict: 'room_id,user_id,match_id' });
      if (error) throw error;
      return { copied: rows.length };
    },
    onSuccess: (r: any) => {
      toast.success(`Synced ${r.copied} prediction(s) into the room`);
      qc.invalidateQueries({ queryKey: ['pred-room-my', roomId] });
      qc.invalidateQueries({ queryKey: ['pred-room-lb', roomId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Sync failed'),
  });
}

// Admin
export function useAdminUsers() {
  return useQuery({
    queryKey: ['pred-admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('football_list_users_with_email' as any);
      if (error) throw error;
      return data as Array<{ id: string; username: string; full_name: string | null; is_active: boolean; email: string | null; is_admin: boolean }>;
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('football_profiles')
        .update({ is_active: p.is_active })
        .eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['pred-admin-users'] }); },
    onError: (e: any) => toast.error(e?.message ?? 'Update failed'),
  });
}

export function useAdminCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<MatchRow> & { team_a: string; team_b: string; kickoff_at: string }) => {
      const { error } = await supabase.from('football_matches').insert(m as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Match created'); qc.invalidateQueries({ queryKey: ['pred-matches'] }); },
    onError: (e: any) => toast.error(e?.message ?? 'Create failed'),
  });
}

export function useAdminSaveResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; score_a: number; score_b: number; pen_a?: number | null; pen_b?: number | null }) => {
      const { error } = await supabase
        .from('football_matches')
        .update({ score_a: p.score_a, score_b: p.score_b, pen_a: p.pen_a ?? null, pen_b: p.pen_b ?? null, status: 'finished' })
        .eq('id', p.id);
      if (error) throw error;
      const { error: rerr } = await supabase.rpc('football_recalculate_match_points' as any, { _match_id: p.id });
      if (rerr) throw rerr;
    },
    onSuccess: () => {
      toast.success('Result saved & points recalculated');
      qc.invalidateQueries({ queryKey: ['pred-matches'] });
      qc.invalidateQueries({ queryKey: ['pred-leaderboard'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Save failed'),
  });
}
