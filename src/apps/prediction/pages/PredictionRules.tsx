import React from 'react';
import { PredictionLayout } from '../components/PredictionLayout';
import { predTheme } from '../lib/predictionTheme';
import { cn } from '@/lib/utils';

export default function PredictionRules() {
  return (
    <PredictionLayout>
      <h1 className={cn('text-4xl mb-6', predTheme.heading)}>How scoring works</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Global scoring">
          <ul className="space-y-2 text-sm">
            <li><b className={predTheme.gold}>+3</b> for the correct outcome (win / draw / loss)</li>
            <li><b className={predTheme.gold}>+2</b> bonus for the exact score</li>
            <li>Knockout matches: outcome based on the actual winner (using penalty shootout if drawn).</li>
            <li>Predict a penalty shootout winner correctly to earn a small bonus on drawn knockouts.</li>
          </ul>
        </Card>
        <Card title="Private room scoring">
          <ul className="space-y-2 text-sm">
            <li>Each room owner sets the points for outcome, exact-score bonus and goal-difference bonus.</li>
            <li>Owners can also set a knockout multiplier — e.g. 1.5× knockout points.</li>
            <li>Room scoring is fully independent of the global leaderboard.</li>
          </ul>
        </Card>
        <Card title="Submitting picks">
          <ul className="space-y-2 text-sm">
            <li>Group stage matches allow a draw pick.</li>
            <li>Knockout matches require a winner — pick a team and, if you predict a draw in regulation, the penalty winner.</li>
            <li>Exact-score inputs clamp between <b>0</b> and <b>20</b>.</li>
            <li>Predictions lock automatically at kickoff. You can edit a pick any time before that.</li>
          </ul>
        </Card>
        <Card title="Access">
          <ul className="space-y-2 text-sm">
            <li>This is an admin-provisioned league — accounts are created for you.</li>
            <li>Deactivated accounts cannot submit predictions or create rooms.</li>
            <li>Contact the league admin if you need to be added or reactivated.</li>
          </ul>
        </Card>
      </div>
    </PredictionLayout>
  );
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className={cn('p-5 border', predTheme.border, predTheme.radius, predTheme.surface)}>
    <h3 className={cn('text-2xl mb-2', predTheme.heading)}>{title}</h3>
    <div className={predTheme.textMuted}>{children}</div>
  </div>
);
