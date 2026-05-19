import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, Calendar, Play, Clock, X, Search, Grid, List } from 'lucide-react';
import { useUniverseEpisodes } from '@/hooks/useUniverseEpisodes';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UniverseEpisodesProps {
  universeId: string;
  episodeFilter?: 'all' | 'newer' | 'older';
}

export const UniverseEpisodes: React.FC<UniverseEpisodesProps> = ({ 
  universeId, 
  episodeFilter = 'all' 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { episodes, isLoading } = useUniverseEpisodes(universeId);
  const [expandedShow, setExpandedShow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShow, setSelectedShow] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newerEpisodesFilter, setNewerEpisodesFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique shows for filter dropdown
  const uniqueShows = React.useMemo(() => {
    const showsMap = new Map();
    episodes.forEach(episode => {
      if (episode.show && !showsMap.has(episode.show.id)) {
        showsMap.set(episode.show.id, episode.show);
      }
    });
    return Array.from(showsMap.values());
  }, [episodes]);

  // Apply all filters
  const filteredEpisodes = React.useMemo(() => {
    let filtered = [...episodes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(episode => 
        episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (episode.show?.title && episode.show.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Show filter
    if (selectedShow !== 'all') {
      filtered = filtered.filter(episode => episode.show?.id === selectedShow);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(episode => {
        if (statusFilter === 'watched') return episode.watched;
        if (statusFilter === 'unwatched') return !episode.watched;
        return true;
      });
    }

    // Newer episodes filter
    if (newerEpisodesFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (newerEpisodesFilter === 'last-week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (newerEpisodesFilter === 'last-month') {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (newerEpisodesFilter === 'last-3-months') {
        cutoffDate.setMonth(now.getMonth() - 3);
      }

      filtered = filtered.filter(episode => {
        if (!episode.air_date) return false;
        return new Date(episode.air_date) >= cutoffDate;
      });
    }

    // Apply original episode filter from props
    if (episodeFilter !== 'all') {
      const sortedEpisodes = [...filtered].sort((a, b) => {
        if (a.air_date && b.air_date) {
          const dateA = new Date(a.air_date).getTime();
          const dateB = new Date(b.air_date).getTime();
          return episodeFilter === 'newer' ? dateB - dateA : dateA - dateB;
        }
        
        if (a.air_date && !b.air_date) return episodeFilter === 'newer' ? -1 : 1;
        if (!a.air_date && b.air_date) return episodeFilter === 'newer' ? 1 : -1;
        
        if (a.season_number !== b.season_number) {
          return episodeFilter === 'newer' ? b.season_number - a.season_number : a.season_number - b.season_number;
        }
        
        return episodeFilter === 'newer' ? b.episode_number - a.episode_number : a.episode_number - b.episode_number;
      });
      
      return sortedEpisodes;
    }
    
    return filtered;
  }, [episodes, searchTerm, selectedShow, statusFilter, newerEpisodesFilter, episodeFilter]);

  const toggleWatched = useMutation({
    mutationFn: async ({ episodeId, currentStatus }: { episodeId: string; currentStatus: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      if (currentStatus) {
        const { error } = await supabase
          .from('user_episode_status')
          .delete()
          .eq('user_id', user.id)
          .eq('episode_id', episodeId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_episode_status')
          .upsert({
            user_id: user.id,
            episode_id: episodeId,
            status: 'watched',
            watched_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,episode_id',
            ignoreDuplicates: false
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universe-episodes', universeId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['show-progress', universeId, user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating episode status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleToggleWatched = (episodeId: string, currentStatus: boolean) => {
    toggleWatched.mutate({ episodeId, currentStatus });
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading episodes...</p>
        </CardContent>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card className="border-blue-200">
        <CardContent className="text-center py-8">
          <Play className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Episodes Found</h3>
          <p className="text-muted-foreground">
            No episodes are available for the shows in this universe yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="border-blue-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Episodes</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
            <Input
              placeholder="Search episodes or shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Show Filter */}
            <Select value={selectedShow} onValueChange={setSelectedShow}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All Shows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shows</SelectItem>
                {uniqueShows.map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="watched">Watched</SelectItem>
                <SelectItem value="unwatched">Unwatched</SelectItem>
              </SelectContent>
            </Select>

            {/* Newer Episodes Filter */}
            <Select value={newerEpisodesFilter} onValueChange={setNewerEpisodesFilter}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All Episodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Episodes</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-muted-foreground">
              Showing {filteredEpisodes.length} of {episodes.length} episodes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episodes Display */}
      {filteredEpisodes.length === 0 ? (
        <Card className="border-blue-200">
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Episodes Found</h3>
            <p className="text-muted-foreground">
              No episodes match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {filteredEpisodes.map((episode) => (
            <Card key={episode.id} className={`border-blue-200 hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'p-3' : ''}`}>
              <CardContent className={viewMode === 'grid' ? "p-4" : "p-0"}>
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View - keep existing layout */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                          <Play className="w-2 h-2 text-white fill-current" />
                        </div>
                        <span className="text-blue-600 font-medium text-sm">
                          {episode.show?.title || 'Unknown Show'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
                      {episode.title}
                    </h3>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          # S{episode.season_number}E{episode.episode_number}
                        </span>
                      </div>
                      {episode.air_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {user && (
                      <Button
                        onClick={() => handleToggleWatched(episode.id, episode.watched)}
                        disabled={toggleWatched.isPending}
                        className={`w-full font-medium ${
                          episode.watched 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {episode.watched ? 'Watched' : 'Mark Watched'}
                      </Button>
                    )}
                  </>
                ) : (
                  /* List View */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {episode.watched ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600 font-medium text-sm">
                            {episode.show?.title || 'Unknown Show'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            S{episode.season_number}E{episode.episode_number}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {episode.title}
                        </h4>
                        {episode.air_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {user && (
                      <Button
                        onClick={() => handleToggleWatched(episode.id, episode.watched)}
                        disabled={toggleWatched.isPending}
                        size="sm"
                        variant={episode.watched ? "default" : "outline"}
                        className={episode.watched ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {episode.watched ? 'Watched' : 'Mark Watched'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
