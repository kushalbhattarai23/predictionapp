import React, { useMemo, useState } from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MatchCard } from '../components/MatchCard';
import { PredictionDialog } from '../components/PredictionDialog';
import { useMatches, useMyPredictions, useSubmitPrediction, type MatchRow } from '../hooks/usePrediction';
import { cn } from '@/lib/utils';
import { predTheme } from '../lib/predictionTheme';

export default function PredictionMatches() {
  const { data: matches = [], isLoading } = useMatches();
  const { data: myPreds = [] } = useMyPredictions();
  const submit = useSubmitPrediction();
  const [selected, setSelected] = useState<MatchRow | null>(null);

  const predByMatch = useMemo(() => {
    const m = new Map<string, any>();
    myPreds.forEach((p: any) => m.set(p.match_id, p));
    return m;
  }, [myPreds]);

  const now = Date.now();
  const upcoming = matches.filter((m) => m.status === 'scheduled' && new Date(m.kickoff_at).getTime() > now);
  const live = matches.filter((m) => m.status === 'live' || (m.status === 'scheduled' && new Date(m.kickoff_at).getTime() <= now));
  const finished = matches.filter((m) => m.status === 'finished');

  const renderList = (rows: MatchRow[], canPredict: boolean) =>
    rows.length === 0 ? (
      <div className={cn('p-6 border text-center', predTheme.border, predTheme.radius, predTheme.surface, predTheme.textMuted)}>
        Nothing here yet.
      </div>
    ) : (
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predByMatch.get(m.id) ?? null}
            canPredict={canPredict}
            onPredict={() => setSelected(m)}
          />
        ))}
      </div>
    );

  return (
    <PredictionLayout>
      <h1 className={cn('text-4xl mb-4', predTheme.heading)}>Matches</h1>
      {isLoading ? (
        <div className={predTheme.textMuted}>Loading…</div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className={cn('bg-white/5 border', predTheme.border)}>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
            <TabsTrigger value="finished">Finished ({finished.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">{renderList(upcoming, true)}</TabsContent>
          <TabsContent value="live" className="mt-4">{renderList(live, false)}</TabsContent>
          <TabsContent value="finished" className="mt-4">{renderList(finished, false)}</TabsContent>
        </Tabs>
      )}

      {selected && (
        <PredictionDialog
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          match={selected}
          initial={predByMatch.get(selected.id) ?? undefined}
          onSubmit={async (p) => {
            await submit.mutateAsync({ match_id: selected.id, ...p });
          }}
        />
      )}
    </PredictionLayout>
  );
}
