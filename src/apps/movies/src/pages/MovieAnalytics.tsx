
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMovies } from '@/hooks/useMovies';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const MovieAnalytics: React.FC = () => {
  const { data: movies = [] } = useMovies();

  // Movies watched per year
  const watchedByYear: Record<string, number> = {};
  movies.filter(m => m.watched_at).forEach(m => {
    const year = new Date(m.watched_at!).getFullYear().toString();
    watchedByYear[year] = (watchedByYear[year] || 0) + 1;
  });
  const yearData = Object.entries(watchedByYear).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value }));

  // By genre
  const genreCounts: Record<string, number> = {};
  movies.forEach(m => { if (m.genre) genreCounts[m.genre] = (genreCounts[m.genre] || 0) + 1; });
  const genreData = Object.entries(genreCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Rating distribution
  const ratingCounts: Record<string, number> = {};
  movies.filter(m => m.user_rating).forEach(m => {
    const r = m.user_rating!.toString();
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
  });
  const ratingData = Array.from({ length: 10 }, (_, i) => ({ name: (i + 1).toString(), value: ratingCounts[(i + 1).toString()] || 0 }));

  // By release decade
  const decadeCounts: Record<string, number> = {};
  movies.filter(m => m.release_year).forEach(m => {
    const decade = Math.floor(m.release_year! / 10) * 10 + 's';
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  });
  const decadeData = Object.entries(decadeCounts).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value }));

  // Status pie
  const statusData = [
    { name: 'Watched', value: movies.filter(m => m.status === 'watched').length },
    { name: 'Watchlist', value: movies.filter(m => m.status === 'want_to_watch').length },
    { name: 'Watching', value: movies.filter(m => m.status === 'watching').length },
    { name: 'Dropped', value: movies.filter(m => m.status === 'dropped').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">Movie Analytics</h1>
        <p className="text-muted-foreground">Insights about your movie collection</p>
      </div>

      {movies.length === 0 ? (
        <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">Add some movies to see analytics</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {yearData.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader><CardTitle>Movies Watched Per Year</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={yearData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} /></LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {genreData.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader><CardTitle>Movies by Genre</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={genreData.slice(0, 8)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader><CardTitle>Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {statusData.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {decadeData.length > 0 && (
            <Card className="col-span-1 lg:col-span-2 border-blue-200 dark:border-blue-800">
              <CardHeader><CardTitle>Movies by Release Decade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={decadeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieAnalytics;
