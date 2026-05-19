import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQAWorkspaces, useQABoards } from '../hooks/useQAData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bug, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

const QADashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: workspaces = [] } = useQAWorkspaces();

  // Get all cards across all boards the user has access to
  const { data: allCards = [] } = useQuery({
    queryKey: ['qa-all-cards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('qa_cards').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const totalBugs = allCards.length;
  const openBugs = allCards.filter((c) => c.status === 'open').length;
  const criticalBugs = allCards.filter((c) => c.severity === 'Critical').length;
  const resolvedBugs = allCards.filter((c) => c.status === 'resolved').length;

  // Bugs by severity
  const severityData = ['Critical', 'High', 'Medium', 'Low'].map((s) => ({
    name: s,
    count: allCards.filter((c) => c.severity === s).length,
  }));

  // Bugs by module
  const moduleMap = new Map<string, number>();
  allCards.forEach((c) => {
    const mod = c.module || 'Unassigned';
    moduleMap.set(mod, (moduleMap.get(mod) || 0) + 1);
  });
  const moduleData = Array.from(moduleMap.entries()).map(([name, value]) => ({ name, value }));

  // Bugs by priority
  const priorityData = ['P1', 'P2', 'P3', 'P4'].map((p) => ({
    name: p,
    count: allCards.filter((c) => c.priority === p).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QA Dashboard</h1>
        <p className="text-muted-foreground">Bug tracking overview across all workspaces</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bug className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalBugs}</p>
                <p className="text-xs text-muted-foreground">Total Bugs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{openBugs}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{criticalBugs}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedBugs}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Bugs by Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bugs by Module</CardTitle></CardHeader>
          <CardContent>
            {moduleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={moduleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {moduleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bugs by Priority</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Workspaces</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <Link key={ws.id} to={`/qa/workspaces/${ws.id}`} className="block p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                  <p className="font-medium text-sm">{ws.name}</p>
                  {ws.description && <p className="text-xs text-muted-foreground">{ws.description}</p>}
                </Link>
              ))}
              {workspaces.length === 0 && (
                <p className="text-sm text-muted-foreground">No workspaces yet. <Link to="/qa/workspaces" className="text-primary underline">Create one</Link></p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QADashboard;
