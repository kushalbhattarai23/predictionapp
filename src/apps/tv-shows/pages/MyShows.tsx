
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Clock, CheckCircle, Plus, Search, Tv as TvIcon, HeartOff, Loader2, Globe, RefreshCw } from 'lucide-react';
import { useUserShows } from '@/hooks/useUserShows';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const TVShowMyShows: React.FC = () => {
  const { userShows, isLoading } = useUserShows();
  const [filter, setFilter] = useState<'all' | 'watching' | 'not_started' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const itemsPerPage = 9;

  // Debug logging
  useEffect(() => {
    console.log('MyShows: Component rendered with:', {
      userShowsCount: userShows.length,
      isLoading,
      user: user?.email
    });
  }, [userShows, isLoading, user]);

  const filteredShows = userShows.filter(show => {
    const matchesFilter = filter === 'all' || show.status === filter;
    const matchesSearch = !searchTerm || show.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredShows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShows = filteredShows.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'not_started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watching': return <Eye className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'not_started': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleViewShows = () => {
    navigate('/tv-shows/public-shows');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilter: 'all' | 'watching' | 'not_started' | 'completed') => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Refresh episode counts manually
  const handleRefreshCounts = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      // Get all tracked shows for this user
      const { data: trackedShows } = await supabase
        .from('user_show_tracking')
        .select('show_id')
        .eq('user_id', user.id);

      if (trackedShows) {
        // Update episode counts for each show
        for (const track of trackedShows) {
          await supabase.rpc('update_user_show_episode_counts', {
            p_user_id: user.id,
            p_show_id: track.show_id
          });
        }
      }

      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['user-shows'] });
      
      toast({
        title: 'Episode counts refreshed',
        description: 'All episode counts have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error refreshing counts:', error);
      toast({
        title: 'Error refreshing counts',
        description: 'Failed to update episode counts.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Untrack show mutation
  const { mutate: untrackShow } = useMutation({
    mutationFn: async (showId: string) => {
      if (!user) {
        throw new Error('You must be logged in to untrack shows');
      }
      
      console.log('MyShows: Untracking show:', showId);
      
      const { error } = await supabase
        .from('user_show_tracking')
        .delete()
        .eq('user_id', user.id)
        .eq('show_id', showId);
        
      if (error) throw error;
      return { showId };
    },
    onSuccess: (data) => {
      console.log('MyShows: Show untracked successfully:', data.showId);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-shows'] });
      queryClient.invalidateQueries({ queryKey: ['trackedShows'] });
      
      toast({
        title: 'Show removed from your list',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('MyShows: Error removing show:', error);
      toast({
        title: 'Error removing show',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">My Shows</h1>
          <p className="text-muted-foreground">Track your personal TV show collection</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Search shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" className="border-purple-200">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleRefreshCounts}
              disabled={isRefreshing}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleViewShows}
            >
              <Plus className="mr-2 h-4 w-4" />
              Browse Shows
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: 'all', label: 'All Shows', count: userShows.length },
          { key: 'watching', label: 'Watching', count: userShows.filter(s => s.status === 'watching').length },
          { key: 'not_started', label: 'Not Started', count: userShows.filter(s => s.status === 'not_started').length },
          { key: 'completed', label: 'Completed', count: userShows.filter(s => s.status === 'completed').length }
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => handleFilterChange(key as any)}
            className={
              filter === key 
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                : 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800'
            }
            size="sm"
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredShows.length === 0 ? (
        <Card className="border-purple-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No shows found</p>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' && !searchTerm 
                ? 'Start tracking shows to see them here' 
                : searchTerm 
                ? 'Try adjusting your search criteria'
                : `No ${filter.replace('_', ' ')} shows found`}
            </p>
            <Button onClick={handleViewShows} className="bg-purple-600 hover:bg-purple-700 text-white">
              Browse Shows
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentShows.map((show) => {
              // Better handling of episode counts with fallbacks
              const totalEpisodes = show.totalEpisodes || 0;
              const watchedEpisodes = Math.min(show.watchedEpisodes || 0, totalEpisodes);
              const progressPercentage = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
              
              console.log(`MyShows: Rendering show "${show.title}" - Total: ${totalEpisodes}, Watched: ${watchedEpisodes}, Progress: ${progressPercentage}%`);
              
              return (
                <Card key={show.id} className="h-full transition-all hover:shadow-md overflow-hidden border-purple-200">
                  <Link to={`/tv-shows/show/${show.id}`}>
                    {show.poster_url ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={show.poster_url} 
                          alt={show.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <TvIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-700 break-words">{show.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Status Badge */}
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={`${getStatusColor(show.status)} text-white border-0 flex items-center gap-1`}>
                          {getStatusIcon(show.status)}
                          {show.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      
                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {watchedEpisodes} / {totalEpisodes} episodes
                          {totalEpisodes === 0 && (
                            <span className="text-xs text-orange-600 ml-1">(updating...)</span>
                          )}
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      
                      {/* Progress tracking text */}
                      <div className="text-sm text-muted-foreground">
                        Progress tracking
                      </div>
                      
                      {/* Action Buttons - Now on separate line */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            untrackShow(show.id);
                          }}
                          className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <HeartOff className="h-3 w-3 mr-1" />
                          Untrack
                        </Button>
                        <Link to={`/tv-shows/show/${show.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full border-purple-200">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TVShowMyShows;
