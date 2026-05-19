
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Eye, Clock, Star, Heart, Globe, TrendingUp } from 'lucide-react';
import { useMovies } from '@/hooks/useMovies';
import { useMovieUniverses } from '@/hooks/useMovieUniverses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const MovieDashboard: React.FC = () => {
  const { data: movies = [] } = useMovies();
  const { universes } = useMovieUniverses();

  const totalMovies = movies.length;
  const watchedMovies = movies.filter(m => m.status === 'watched').length;
  const watchlistMovies = movies.filter(m => m.status === 'want_to_watch').length;
  const favorites = movies.filter(m => m.is_favorite).length;
  const avgRating = movies.filter(m => m.user_rating).length > 0
    ? (movies.filter(m => m.user_rating).reduce((sum, m) => sum + (m.user_rating || 0), 0) / movies.filter(m => m.user_rating).length).toFixed(1)
    : '—';

  const recentlyAdded = movies.slice(0, 5);
  const recentlyWatched = movies.filter(m => m.watched_at).sort((a, b) => new Date(b.watched_at!).getTime() - new Date(a.watched_at!).getTime()).slice(0, 5);

  // Genre distribution
  const genreCounts: Record<string, number> = {};
  movies.forEach(m => { if (m.genre) genreCounts[m.genre] = (genreCounts[m.genre] || 0) + 1; });
  const genreData = Object.entries(genreCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Status distribution
  const statusData = [
    { name: 'Watched', value: watchedMovies },
    { name: 'Watchlist', value: watchlistMovies },
    { name: 'Watching', value: movies.filter(m => m.status === 'watching').length },
    { name: 'Dropped', value: movies.filter(m => m.status === 'dropped').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">Movie Dashboard</h1>
        <p className="text-muted-foreground">Overview of your movie collection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Movies', value: totalMovies, icon: Film, color: 'text-blue-500' },
          { label: 'Watched', value: watchedMovies, icon: Eye, color: 'text-green-500' },
          { label: 'Watchlist', value: watchlistMovies, icon: Clock, color: 'text-amber-500' },
          { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-yellow-500' },
          { label: 'Favorites', value: favorites, icon: Heart, color: 'text-red-500' },
          { label: 'Universes', value: universes.length, icon: Globe, color: 'text-purple-500' },
        ].map(stat => (
          <Card key={stat.label} className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {genreData.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader><CardTitle className="text-lg">Movies by Genre</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={genreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {statusData.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader><CardTitle className="text-lg">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                    {statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader><CardTitle className="text-lg">Recently Added</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentlyAdded.length === 0 ? (
              <p className="text-muted-foreground text-sm">No movies yet</p>
            ) : recentlyAdded.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.release_year} {m.genre && `• ${m.genre}`}</p>
                </div>
                {m.user_rating && <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs">{m.user_rating}</span></div>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader><CardTitle className="text-lg">Recently Watched</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentlyWatched.length === 0 ? (
              <p className="text-muted-foreground text-sm">No watched movies yet</p>
            ) : recentlyWatched.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.watched_at ? new Date(m.watched_at).toLocaleDateString() : ''}</p>
                </div>
                {m.user_rating && <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs">{m.user_rating}</span></div>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MovieDashboard;
