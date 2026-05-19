import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Play, Eye, Globe, Lock, Calendar, ArrowLeft, ArrowUpDown, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUniverseShows } from '@/hooks/useUniverseShows';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { UniverseEpisodes } from '@/apps/tv-shows/components/UniverseEpisodes';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Universe } from '@/hooks/useUniverses';

export const UniverseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'newer' | 'older'>('all');

  // Fetch universe by slug or ID with improved logic
  const { data: universe, isLoading: universeLoading, error } = useQuery({
    queryKey: ['universe', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      console.log('Fetching universe with slug/id:', slug);
      
      // Try multiple approaches to find the universe
      const queries = [];
      
      // 1. Try by exact slug match
      queries.push(
        supabase
          .from('universes')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()
      );
      
      // 2. Try by ID if slug looks like a UUID
      if (slug.includes('-') && slug.length > 30) {
        queries.push(
          supabase
            .from('universes')
            .select('*')
            .eq('id', slug)
            .maybeSingle()
        );
      }
      
      // 3. Try by partial slug match (in case of slug variations)
      const baseSlug = slug.split('-').slice(0, -1).join('-'); // Remove the UUID part
      if (baseSlug && baseSlug !== slug) {
        queries.push(
          supabase
            .from('universes')
            .select('*')
            .ilike('slug', `${baseSlug}%`)
            .maybeSingle()
        );
      }
      
      // 4. Try to find by name that could generate this slug
      const nameFromSlug = slug.split('-').slice(0, -1).join(' ').replace(/-/g, ' ');
      if (nameFromSlug) {
        queries.push(
          supabase
            .from('universes')
            .select('*')
            .ilike('name', `%${nameFromSlug}%`)
            .maybeSingle()
        );
      }
      
      // Execute queries in sequence until we find a match
      for (const query of queries) {
        try {
          const { data, error } = await query;
          if (error) {
            console.error('Query error:', error);
            continue;
          }
          if (data) {
            console.log('Found universe:', data);
            return data as Universe;
          }
        } catch (err) {
          console.error('Query execution error:', err);
          continue;
        }
      }
      
      // If we still haven't found it, try to get all universes and find a match
      console.log('Trying fallback: fetching all universes for user');
      if (user) {
        const { data: allUniverses, error: allError } = await supabase
          .from('universes')
          .select('*')
          .or(`creator_id.eq.${user.id},is_public.eq.true`);
          
        if (!allError && allUniverses) {
          console.log('All available universes:', allUniverses);
          // Try to find by various matching criteria
          const foundUniverse = allUniverses.find(u => 
            u.slug === slug || 
            u.id === slug ||
            u.slug?.includes(baseSlug) ||
            (u.name && slug.toLowerCase().includes(u.name.toLowerCase().replace(/\s+/g, '-')))
          );
          
          if (foundUniverse) {
            console.log('Found universe via fallback:', foundUniverse);
            return foundUniverse as Universe;
          }
        }
      }
      
      console.log('Universe not found with any method');
      return null;
    },
    enabled: !!slug
  });

  const { universeShows, availableShows, addShowToUniverse, removeShowFromUniverse } = useUniverseShows(universe?.id || '');

  // Fetch episode progress for each show
  const { data: showProgress = [] } = useQuery({
    queryKey: ['show-progress', universe?.id, user?.id],
    queryFn: async () => {
      if (!universe?.id || !user?.id) return [];

      const showIds = universeShows.map(us => us.show_id);
      if (showIds.length === 0) return [];

      const progressData = await Promise.all(
        showIds.map(async (showId) => {
          // Get total episodes for the show
          const { count: totalEpisodes } = await supabase
            .from('episodes')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', showId);

          // Get watched episodes using batched queries to handle 1000+ episodes
          const { data: episodes } = await supabase
            .from('episodes')
            .select('id')
            .eq('show_id', showId);

          const episodeIds = episodes?.map(ep => ep.id) || [];
          
          let watchedCount = 0;
          if (episodeIds.length > 0) {
            // Batch in groups of 200 to avoid URL length limits
            const batchSize = 200;
            for (let i = 0; i < episodeIds.length; i += batchSize) {
              const batch = episodeIds.slice(i, i + batchSize);
              const { count } = await supabase
                .from('user_episode_status')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'watched')
                .in('episode_id', batch);
              
              watchedCount += count || 0;
            }
          }

          return {
            showId,
            totalEpisodes: totalEpisodes || 0,
            watchedEpisodes: watchedCount,
            progress: totalEpisodes ? Math.round((watchedCount / totalEpisodes) * 100) : 0
          };
        })
      );

      return progressData;
    },
    enabled: !!universe?.id && !!user?.id && universeShows.length > 0
  });
  
  const isOwner = user?.id === universe?.creator_id;

  // Determine back path based on where user came from
  const getBackPath = () => {
    const from = location.state?.from;
    if (from === 'private') return '/tv-shows/universes';
    if (from === 'public') return '/tv-shows/public-universes';
    return '/tv-shows/universes';
  };

  if (universeLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link to={getBackPath()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Universes
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
          <Card className="border-blue-200">
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading universe...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !universe) {
    return (
      <div className="min-h-screen bg-background">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link to={getBackPath()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Universes
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
          <Card className="border-red-200">
            <CardContent className="text-center py-8 sm:py-12">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Universe Not Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4 mb-4">
                The universe you're looking for doesn't exist or you don't have access to it.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Searched for: {slug}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => navigate('/tv-shows/universes')} variant="outline">
                  View Your Universes
                </Button>
                <Button onClick={() => navigate('/tv-shows/public-universes')} variant="outline">
                  Browse Public Universes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAddShows = () => {
    if (selectedShows.length === 0) return;
    selectedShows.forEach(showId => {
      addShowToUniverse.mutate(showId);
    });
    setSelectedShows([]);
    setIsDialogOpen(false);
  };

  const toggleShowSelection = (showId: string) => {
    setSelectedShows(prev =>
      prev.includes(showId) ? prev.filter(id => id !== showId) : [...prev, showId]
    );
  };

  const handleRemoveShow = (showUniverseId: string) => {
    if (confirm('Are you sure you want to remove this show from the universe?')) {
      removeShowFromUniverse.mutate(showUniverseId);
    }
  };

  const availableShowsToAdd = availableShows.filter(
    show => !universeShows.some(us => us.show_id === show.id)
  );

  const getShowProgress = (showId: string) => {
    return showProgress.find(p => p.showId === showId) || { totalEpisodes: 0, watchedEpisodes: 0, progress: 0 };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={getBackPath()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Universes
            </Link>
            
            {isOwner && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Show</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-3 sm:mx-4">
                  <DialogHeader>
                    <DialogTitle>Add Shows to Universe</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {availableShowsToAdd.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">All available shows have been added.</p>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                          {availableShowsToAdd.map((show) => (
                            <label
                              key={show.id}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedShows.includes(show.id)}
                                onCheckedChange={() => toggleShowSelection(show.id)}
                              />
                              <span className="text-sm">{show.title}</span>
                            </label>
                          ))}
                        </div>
                        {selectedShows.length > 0 && (
                          <p className="text-xs text-muted-foreground">{selectedShows.length} show(s) selected</p>
                        )}
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handleAddShows} disabled={selectedShows.length === 0} className="flex-1">
                        Add {selectedShows.length > 0 ? `${selectedShows.length} Show(s)` : 'Shows'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Universe Header */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0 lg:space-x-4">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-col space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700 break-words">
                  {universe.name}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge 
                    variant="outline" 
                    className={`${universe.is_public ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"} text-xs sm:text-sm`}
                  >
                    {universe.is_public ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm border-blue-200 text-blue-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    Created {new Date(universe.created_at).getFullYear()}
                  </Badge>
                </div>
              </div>
              {universe.description && (
                <p className="text-muted-foreground text-sm sm:text-base break-words">
                  {universe.description}
                </p>
              )}
            </div>
          </div>

          {/* Universe Statistics */}
          {(() => {
            const totalEpisodesAll = showProgress.reduce((sum, p) => sum + p.totalEpisodes, 0);
            const totalWatchedAll = showProgress.reduce((sum, p) => sum + p.watchedEpisodes, 0);
            const overallProgress = totalEpisodesAll > 0 ? Math.round((totalWatchedAll / totalEpisodesAll) * 100) : 0;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-blue-200">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{universeShows.length}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Shows</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                        {totalEpisodesAll}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Episodes</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700">
                        {totalWatchedAll}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Watched</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-700">
                        {overallProgress}%
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Complete</p>
                    </CardContent>
                  </Card>
                </div>
                {user && totalEpisodesAll > 0 && (
                  <Progress value={overallProgress} className="h-2" />
                )}
              </div>
            );
          })()}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="shows" className="text-xs sm:text-sm">Shows</TabsTrigger>
            <TabsTrigger value="episodes" className="text-xs sm:text-sm">Episodes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shows" className="space-y-4 mt-4 sm:mt-6">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-700 mb-4">Shows in this Universe</h2>
              
              {universeShows.length === 0 ? (
                <Card className="border-blue-200">
                  <CardContent className="text-center py-8 sm:py-12">
                    <Play className="h-12 sm:h-16 w-12 sm:w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No Shows Yet</h3>
                    <p className="text-muted-foreground text-sm sm:text-base px-4">
                      {isOwner ? 'Add some shows to get started!' : 'No shows have been added to this universe yet.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {universeShows.map((universeShow) => {
                    const progress = getShowProgress(universeShow.show_id);
                    return (
                      <Card key={universeShow.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-blue-700 text-sm sm:text-base lg:text-lg line-clamp-2 leading-tight break-words">
                              {universeShow.show?.title || 'Unknown Show'}
                            </CardTitle>
                            {isOwner && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveShow(universeShow.id)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3 pt-0">
                          {universeShow.show?.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 break-words">
                              {universeShow.show.description}
                            </p>
                          )}
                          
                          {/* Progress Section */}
                          {user && progress.totalEpisodes > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{progress.watchedEpisodes}/{progress.totalEpisodes} episodes</span>
                              </div>
                              <Progress value={progress.progress} className="h-2" />
                              <p className="text-xs text-center text-muted-foreground">
                                {progress.progress}% Complete
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${universeShow.show?.is_public ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"} text-xs`}
                            >
                              {universeShow.show?.is_public ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 mr-1" />
                                  Private
                                </>
                              )}
                            </Badge>
                            
                            <Button size="sm" variant="outline" className="text-xs" asChild>
                              <Link to={`/tv-shows/show/${universeShow.show_id}`}>
                                <Play className="w-3 h-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="episodes" className="space-y-4 mt-4 sm:mt-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-700">Episodes in this Universe</h2>
                
                {/* Episode Filter */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Select value={episodeFilter} onValueChange={(value: 'all' | 'newer' | 'older') => setEpisodeFilter(value)}>
                    <SelectTrigger className="w-36 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Filter episodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Episodes</SelectItem>
                      <SelectItem value="newer">Newest First</SelectItem>
                      <SelectItem value="older">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <UniverseEpisodes universeId={universe?.id || ''} episodeFilter={episodeFilter} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UniverseDetail;
