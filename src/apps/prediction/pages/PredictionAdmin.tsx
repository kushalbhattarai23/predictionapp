import React, { useMemo, useState } from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { predTheme, stages } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useAdminCreateMatch,
  useAdminSaveResult,
  useAdminUsers,
  useMatches,
  usePredictionRole,
  useSetUserActive,
} from '../hooks/usePrediction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PredictionAdmin() {
  const { data: role, isLoading: roleLoading } = usePredictionRole();
  if (roleLoading) return <PredictionLayout><div className={predTheme.textMuted}>Loading…</div></PredictionLayout>;
  if (!role?.isAdmin) {
    return (
      <PredictionLayout>
        <div className={cn('p-6 border', predTheme.border, predTheme.radius, predTheme.surface)}>
          <h2 className={cn('text-2xl', predTheme.heading)}>Admin only</h2>
          <p className={predTheme.textMuted}>You do not have admin access to the predictor league.</p>
        </div>
      </PredictionLayout>
    );
  }
  return (
    <PredictionLayout>
      <h1 className={cn('text-4xl mb-6', predTheme.heading)}>Admin console</h1>
      <Tabs defaultValue="users">
        <TabsList className={cn('bg-white/5 border', predTheme.border)}>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="matches" className="mt-4"><MatchesTab /></TabsContent>
        <TabsContent value="results" className="mt-4"><ResultsTab /></TabsContent>
      </Tabs>
    </PredictionLayout>
  );
}

const UsersTab: React.FC = () => {
  const { data: users = [], refetch, isLoading } = useAdminUsers();
  const setActive = useSetUserActive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  const createUser = async () => {
    if (!email || !password || !username) { toast.error('Email, password, username required'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('prediction-admin-create-user', {
        body: { email, password, username, full_name: fullName || null, makeAdmin },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('User created');
      setEmail(''); setPassword(''); setUsername(''); setFullName(''); setMakeAdmin(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? 'Create failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className={cn('p-5 border', predTheme.border, predTheme.radius, predTheme.surface)}>
        <h3 className={cn('text-2xl mb-3', predTheme.heading)}>Provision a new player</h3>
        <div className="grid gap-3">
          <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
          <Field label="Password"><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className={inputCls} /></Field>
          <Field label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} /></Field>
          <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm mt-1">
            <Switch checked={makeAdmin} onCheckedChange={setMakeAdmin} /> Grant admin role
          </label>
          <Button onClick={createUser} disabled={busy} className={predTheme.primary}>Create user</Button>
        </div>
      </div>

      <div className={cn('border overflow-hidden', predTheme.border, predTheme.radius, predTheme.surface)}>
        <div className="px-4 py-3 border-b text-sm font-semibold flex items-center justify-between" style={{ borderColor: 'inherit' }}>
          <span>Players ({users.length})</span>
          {isLoading && <span className={predTheme.textMuted}>Loading…</span>}
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {users.map((u, i) => (
            <div key={u.id} className={cn('flex items-center justify-between px-4 py-3', i > 0 && 'border-t', predTheme.border)}>
              <div>
                <div className="font-medium">{u.username} {u.is_admin && <span className={cn('ml-1 text-xs', predTheme.accentText)}>admin</span>}</div>
                <div className={cn('text-xs', predTheme.textMuted)}>{u.email ?? '—'} · {u.full_name ?? '—'}</div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                Active <Switch checked={u.is_active} onCheckedChange={(v) => setActive.mutate({ id: u.id, is_active: v })} />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MatchesTab: React.FC = () => {
  const create = useAdminCreateMatch();
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [flagA, setFlagA] = useState('');
  const [flagB, setFlagB] = useState('');
  const [stage, setStage] = useState<any>('group');
  const [group, setGroup] = useState('');
  const [stadium, setStadium] = useState('');
  const [city, setCity] = useState('');
  const [kickoff, setKickoff] = useState('');

  const submit = async () => {
    if (!teamA || !teamB || !kickoff) { toast.error('Teams and kickoff are required'); return; }
    await create.mutateAsync({
      team_a: teamA,
      team_b: teamB,
      team_a_flag: flagA || null,
      team_b_flag: flagB || null,
      stage,
      group_name: group || null,
      stadium: stadium || null,
      city: city || null,
      kickoff_at: new Date(kickoff).toISOString(),
    });
    setTeamA(''); setTeamB(''); setFlagA(''); setFlagB(''); setGroup(''); setStadium(''); setCity(''); setKickoff('');
  };

  return (
    <div className={cn('p-5 border', predTheme.border, predTheme.radius, predTheme.surface)}>
      <h3 className={cn('text-2xl mb-3', predTheme.heading)}>Create match</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Team A"><Input value={teamA} onChange={(e) => setTeamA(e.target.value)} className={inputCls} /></Field>
        <Field label="Team B"><Input value={teamB} onChange={(e) => setTeamB(e.target.value)} className={inputCls} /></Field>
        <Field label="Team A flag (emoji)"><Input value={flagA} onChange={(e) => setFlagA(e.target.value)} className={inputCls} /></Field>
        <Field label="Team B flag (emoji)"><Input value={flagB} onChange={(e) => setFlagB(e.target.value)} className={inputCls} /></Field>
        <Field label="Stage">
          <Select value={stage} onValueChange={(v) => setStage(v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(stages).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Group (if applicable)"><Input value={group} onChange={(e) => setGroup(e.target.value)} className={inputCls} /></Field>
        <Field label="Stadium"><Input value={stadium} onChange={(e) => setStadium(e.target.value)} className={inputCls} /></Field>
        <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} /></Field>
        <Field label="Kickoff (local)"><Input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className={inputCls} /></Field>
      </div>
      <div className="mt-4">
        <Button onClick={submit} disabled={create.isPending} className={predTheme.primary}>Create match</Button>
      </div>
    </div>
  );
};

const ResultsTab: React.FC = () => {
  const { data: matches = [] } = useMatches();
  const save = useAdminSaveResult();

  const sorted = useMemo(() => [...matches].sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()), [matches]);

  return (
    <div className="grid gap-3">
      {sorted.map((m) => <ResultRow key={m.id} match={m} onSave={(p) => save.mutate(p)} />)}
      {sorted.length === 0 && <div className={cn('p-4', predTheme.textMuted)}>No matches yet.</div>}
    </div>
  );
};

const ResultRow: React.FC<{ match: any; onSave: (p: { id: string; score_a: number; score_b: number; pen_a?: number | null; pen_b?: number | null }) => void }> = ({ match, onSave }) => {
  const [sa, setSa] = useState<string>(match.score_a?.toString() ?? '');
  const [sb, setSb] = useState<string>(match.score_b?.toString() ?? '');
  const [pa, setPa] = useState<string>(match.pen_a?.toString() ?? '');
  const [pb, setPb] = useState<string>(match.pen_b?.toString() ?? '');
  const drawn = sa !== '' && sb !== '' && Number(sa) === Number(sb);
  const knockout = match.stage !== 'group';
  return (
    <div className={cn('p-4 border grid gap-3 sm:grid-cols-[1fr_auto]', predTheme.border, predTheme.radius, predTheme.surface)}>
      <div>
        <div className="font-semibold">{match.team_a} vs {match.team_b}</div>
        <div className={cn('text-xs', predTheme.textMuted)}>
          {stages[match.stage]} · {new Date(match.kickoff_at).toLocaleString()} · {match.status}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-xs">A</Label>
          <Input value={sa} onChange={(e) => setSa(e.target.value)} type="number" min={0} max={20} className={cn(inputCls, 'w-20')} />
        </div>
        <div>
          <Label className="text-xs">B</Label>
          <Input value={sb} onChange={(e) => setSb(e.target.value)} type="number" min={0} max={20} className={cn(inputCls, 'w-20')} />
        </div>
        {knockout && drawn && (
          <>
            <div>
              <Label className="text-xs">Pen A</Label>
              <Input value={pa} onChange={(e) => setPa(e.target.value)} type="number" min={0} max={20} className={cn(inputCls, 'w-20')} />
            </div>
            <div>
              <Label className="text-xs">Pen B</Label>
              <Input value={pb} onChange={(e) => setPb(e.target.value)} type="number" min={0} max={20} className={cn(inputCls, 'w-20')} />
            </div>
          </>
        )}
        <Button
          onClick={() => onSave({ id: match.id, score_a: Number(sa), score_b: Number(sb), pen_a: pa === '' ? null : Number(pa), pen_b: pb === '' ? null : Number(pb) })}
          disabled={sa === '' || sb === ''}
          className={predTheme.primary}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <Label className="mb-1 block">{label}</Label>
    {children}
  </div>
);

const inputCls = cn(predTheme.surface, predTheme.border, 'border text-white');
