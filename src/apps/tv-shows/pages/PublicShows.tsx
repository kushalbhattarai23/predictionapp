
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Tv as TvIcon, Globe, Heart, HeartOff, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Show } from '@/types';
import { adaptDbShowToShow } from '@/utils/type-adapters';
import { useAuth } from '@/hooks/useAuth';

export const TVShowPublicShows: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPublicShows = async () => {
    try {
      let query = supabase
        .from('shows')
        .select('*')
        .eq('is_public', true)
        .order('title', { ascending: true });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data ? data.map(adaptDbShowToShow) : [];
    } catch (error: any) {
      toast({
        title: 'Error fetching shows',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  const { data: shows = [], isLoading, refetch } = useQuery({
    queryKey: ['publicShows', searchTerm],
    queryFn: fetchPublicShows
  });

  // Fetch user's tracked shows only if user is authenticated
  const { data: trackedShows = [] } = useQuery({
    queryKey: ['trackedShows', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_show_tracking')
        .select('show_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data.map(item => item.show_id);
    },
    enabled: !!user
  });

  // Track/untrack show mutation
  const { mutate: toggleTracking } = useMutation({
    mutationFn: async (showId: string) => {
      if (!user) {
        throw new Error('You must be logged in to track shows');
      }
      
      const isTracked = trackedShows.includes(showId);
      
      if (isTracked) {
        const { error } = await supabase
          .from('user_show_tracking')
          .delete()
          .eq('user_id', user.id)
          .eq('show_id', showId);
          
        if (error) throw error;
        return { showId, isTracking: false };
      } else {
        const { error } = await supabase
          .from('user_show_tracking')
          .insert({ user_id: user.id, show_id: showId });
          
        if (error) throw error;
        
        // After successful tracking, calculate episode counts
        console.log('Show tracked successfully, calculating episode counts...');
        
        // Call the database function to update episode counts
        const { error: updateError } = await supabase.rpc('update_user_show_episode_counts', {
          p_user_id: user.id,
          p_show_id: showId
        });
        
        if (updateError) {
          console.error('Error updating episode counts:', updateError);
        } else {
          console.log('Episode counts updated successfully');
        }
        
        return { showId, isTracking: true };
      }
    },
    onSuccess: (data) => {
      // Invalidate both queries to ensure immediate updates
      queryClient.invalidateQueries({ queryKey: ['trackedShows'] });
      queryClient.invalidateQueries({ queryKey: ['user-shows'] });
      
      console.log(`Show ${data.showId} ${data.isTracking ? 'tracked' : 'untracked'} successfully`);
      console.log('Invalidated trackedShows and user-shows queries');
      
      toast({
        title: data.isTracking ? 'Show added to your list' : 'Show removed from your list',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating tracking:', error);
      toast({
        title: 'Error updating tracking',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Separate shows into tracked and untracked
  const untrackedShows = shows.filter(show => !trackedShows.includes(show.id));
  const userTrackedShows = shows.filter(show => trackedShows.includes(show.id));

  const renderShowCard = (show: Show) => {
    const isTracked = trackedShows.includes(show.id);
    
    return (
      <Card key={show.id} className="h-full transition-all hover:shadow-md overflow-hidden border-purple-200">
        <Link to={`/tv-shows/show/${show.id}`}>
          {show.poster ? (
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={show.poster} 
                alt={show.name} 
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
          <CardTitle className="text-purple-700 break-words">{show.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">
              {show.genres?.length ? show.genres.join(', ') : 'No genres'}
            </div>
            <div className="flex gap-2">
              {user ? (
                <Button 
                  size="sm" 
                  variant={isTracked ? "default" : "outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleTracking(show.id);
                  }}
                  className={isTracked ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-700 hover:bg-purple-50"}
                >
                  {isTracked ? (
                    <>
                      <HeartOff className="h-3 w-3 mr-1" />
                      Untrack
                    </>
                  ) : (
                    <>
                      <Heart className="h-3 w-3 mr-1" />
                      Track
                    </>
                  )}
                </Button>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    <LogIn className="h-3 w-3 mr-1" />
                    Sign in to Track
                  </Button>
                </Link>
              )}
              <Link to={`/tv-shows/show/${show.id}`}>
                <Button size="sm" variant="secondary" className="border-purple-200">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Public Shows</h1>
          <p className="text-muted-foreground">Discover popular shows from the community</p>
          {!user && (
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/login" className="text-purple-700 hover:underline">
                Sign in
              </Link> to track shows and access more features
            </p>
          )}
        </div>

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
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shows.length === 0 ? (
        <Card className="border-purple-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No public shows found</p>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Untracked Shows Section */}
          {untrackedShows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-purple-700">Untracked Shows</h2>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                  {untrackedShows.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {untrackedShows.map(renderShowCard)}
              </div>
            </div>
          )}

          {/* Tracked Shows Section */}
          {user && userTrackedShows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-purple-700">Your Tracked Shows</h2>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                  {userTrackedShows.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTrackedShows.map(renderShowCard)}
              </div>
            </div>
          )}

          {/* Show message when all shows are tracked */}
          {user && untrackedShows.length === 0 && userTrackedShows.length > 0 && (
            <div className="text-center py-8">
              <p className="text-purple-600">🎉 You're tracking all available shows!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TVShowPublicShows;
