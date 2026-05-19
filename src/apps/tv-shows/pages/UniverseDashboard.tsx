
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tv, Play, CheckCircle, Clock, Globe, TrendingUp, Star, Calendar } from 'lucide-react';
import { useUniverses } from '@/hooks/useUniverses';
import { useUniverseShows } from '@/hooks/useUniverseShows';

export const UniverseDashboard: React.FC = () => {
  const { universeId } = useParams<{ universeId: string }>();
  const { universes } = useUniverses();
  const { universeShows } = useUniverseShows(universeId || '');

  const universe = universes.find(u => u.id === universeId);

  if (!universe) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Universe Not Found</h3>
            <p className="text-muted-foreground">The universe you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for demonstration
  const dashboardData = {
    totalShows: universeShows.length,
    totalEpisodes: universeShows.length * 20, // Mock calculation
    watchedEpisodes: Math.floor(universeShows.length * 12), // Mock calculation
    completedShows: Math.floor(universeShows.length * 0.3),
    watchingShows: Math.floor(universeShows.length * 0.5),
    notStartedShows: universeShows.length - Math.floor(universeShows.length * 0.8)
  };

  const progressPercentage = dashboardData.totalEpisodes > 0 ? 
    Math.round((dashboardData.watchedEpisodes / dashboardData.totalEpisodes) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Universe Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 flex items-center gap-2">
            <Globe className="h-8 w-8" />
            {universe.name} Dashboard
          </h1>
          <p className="text-muted-foreground">Analytics and insights for your universe</p>
          {universe.description && (
            <p className="text-sm text-muted-foreground mt-1">{universe.description}</p>
          )}
        </div>
        <Badge variant="outline" className={universe.is_public ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"}>
          {universe.is_public ? 'Public' : 'Private'}
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
            <Tv className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{dashboardData.totalShows}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <Play className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{dashboardData.totalEpisodes.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watched Episodes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{dashboardData.watchedEpisodes.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{progressPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">Universe Progress</CardTitle>
          <CardDescription>
            {dashboardData.watchedEpisodes} of {dashboardData.totalEpisodes} episodes watched across all shows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground gap-2">
            <span>{progressPercentage}% complete</span>
            <span>{(dashboardData.totalEpisodes - dashboardData.watchedEpisodes).toLocaleString()} episodes remaining</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Show Status Distribution */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">Show Status Distribution</CardTitle>
            <CardDescription>Shows organized by viewing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">{dashboardData.completedShows}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed
                </div>
              </div>
              <div className="p-4 border rounded-lg text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.watchingShows}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Play className="h-4 w-4 text-blue-500" />
                  Watching
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg text-center space-y-2">
              <div className="text-2xl font-bold text-gray-600">{dashboardData.notStartedShows}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                Not Started
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">Recent Activity</CardTitle>
            <CardDescription>Latest updates in this universe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Added new show to universe</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Completed watching a series</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Universe made public</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Updated universe description</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Universe Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">8.5/10</div>
            <p className="text-xs text-muted-foreground">Based on tracked shows</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {new Date(universe.created_at).getFullYear()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(universe.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(dashboardData.totalEpisodes * 0.75)}h
            </div>
            <p className="text-xs text-muted-foreground">Total watch time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UniverseDashboard;
