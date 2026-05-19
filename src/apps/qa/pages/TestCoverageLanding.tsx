import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQAWorkspaces } from '../hooks/useQAData';
import { BarChart3, FolderKanban } from 'lucide-react';

const TestCoverageLanding: React.FC = () => {
  const { data: workspaces = [], isLoading } = useQAWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Test Coverage
        </h1>
        <p className="text-sm text-muted-foreground">Select a workspace to view test coverage</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : workspaces.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No workspaces yet. Create one from the Workspaces page.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/qa/workspaces/${ws.id}/test-coverage`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {ws.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ws.description || 'No description'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestCoverageLanding;
