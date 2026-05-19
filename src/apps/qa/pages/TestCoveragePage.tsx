import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTestCases } from '../hooks/useTestCases';
import { useQAWorkspaces } from '../hooks/useQAData';
import { BarChart3, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Clock, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TestCoveragePage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: workspaces = [] } = useQAWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const { data: testCases = [], isLoading } = useTestCases(workspaceId);

  // Group by module
  const modules = Array.from(new Set(testCases.map((tc) => tc.module).filter(Boolean)));
  if (modules.length === 0 && testCases.length > 0) modules.push('Uncategorized');

  const getModuleStats = (mod: string) => {
    const cases = testCases.filter((tc) => (mod === 'Uncategorized' ? !tc.module : tc.module === mod));
    const total = cases.length;
    const pass = cases.filter((c) => c.status === 'Pass').length;
    const fail = cases.filter((c) => c.status === 'Fail').length;
    const blocked = cases.filter((c) => c.status === 'Blocked').length;
    const inProgress = cases.filter((c) => c.status === 'In Progress').length;
    const notRun = cases.filter((c) => c.status === 'Not Run' || c.status === 'Skipped').length;
    const executed = pass + fail;
    const coveragePct = total > 0 ? Math.round((pass / total) * 100) : 0;
    const passRate = executed > 0 ? Math.round((pass / executed) * 100) : 0;
    return { total, pass, fail, blocked, inProgress, notRun, coveragePct, passRate };
  };

  // Overall stats
  const overall = {
    total: testCases.length,
    pass: testCases.filter((c) => c.status === 'Pass').length,
    fail: testCases.filter((c) => c.status === 'Fail').length,
    blocked: testCases.filter((c) => c.status === 'Blocked').length,
    inProgress: testCases.filter((c) => c.status === 'In Progress').length,
    notRun: testCases.filter((c) => c.status === 'Not Run' || c.status === 'Skipped').length,
  };
  const overallExecuted = overall.pass + overall.fail;
  const overallCoverage = overall.total > 0 ? Math.round((overall.pass / overall.total) * 100) : 0;
  const overallPassRate = overallExecuted > 0 ? Math.round((overall.pass / overallExecuted) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Test Coverage
        </h1>
        <p className="text-sm text-muted-foreground">{workspace?.name || 'Workspace'} — Module-wise test execution coverage</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : testCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No test cases yet.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to={`/qa/workspaces/${workspaceId}/test-cases`}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Go to Test Cases
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{overall.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overall.pass}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-destructive">{overall.fail}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{overall.blocked}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-primary">{overallCoverage}%</p>
                <p className="text-xs text-muted-foreground">Coverage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overallPassRate}%</p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Overall progress bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overall Execution Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${overall.total > 0 ? (overall.pass / overall.total) * 100 : 0}%` }} />
                    <div className="bg-destructive h-full transition-all" style={{ width: `${overall.total > 0 ? (overall.fail / overall.total) * 100 : 0}%` }} />
                    <div className="bg-yellow-500 h-full transition-all" style={{ width: `${overall.total > 0 ? (overall.blocked / overall.total) * 100 : 0}%` }} />
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${overall.total > 0 ? (overall.inProgress / overall.total) * 100 : 0}%` }} />
                  </div>
                </div>
                <span className="text-sm font-medium">{overallCoverage}%</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs flex-wrap">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Pass: {overall.pass}</span>
                <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Fail: {overall.fail}</span>
                <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" /> Blocked: {overall.blocked}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> In Progress: {overall.inProgress}</span>
                <span className="flex items-center gap-1"><MinusCircle className="h-3 w-3 text-muted-foreground" /> Not Run: {overall.notRun}</span>
              </div>
            </CardContent>
          </Card>

          {/* Per-module breakdown */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Module Breakdown</h2>
            <div className="grid gap-3">
              {modules.map((mod) => {
                const stats = getModuleStats(mod);
                return (
                  <Card key={mod}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{mod}</h3>
                          <Badge variant="secondary" className="text-[10px]">{stats.total} cases</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium">Coverage: {stats.coveragePct}%</span>
                          <span className={cn('font-medium', stats.passRate >= 80 ? 'text-green-600 dark:text-green-400' : stats.passRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive')}>
                            Pass Rate: {stats.passRate}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div className="h-full flex">
                          <div className="bg-green-500 h-full" style={{ width: `${stats.total > 0 ? (stats.pass / stats.total) * 100 : 0}%` }} />
                          <div className="bg-destructive h-full" style={{ width: `${stats.total > 0 ? (stats.fail / stats.total) * 100 : 0}%` }} />
                          <div className="bg-yellow-500 h-full" style={{ width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%` }} />
                          <div className="bg-blue-500 h-full" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="text-green-600 dark:text-green-400">✓ {stats.pass}</span>
                        <span className="text-destructive">✗ {stats.fail}</span>
                        <span className="text-yellow-600 dark:text-yellow-400">⊘ {stats.blocked}</span>
                        <span className="text-blue-600 dark:text-blue-400">◎ {stats.inProgress}</span>
                        <span>○ {stats.notRun}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestCoveragePage;
