
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tv, Search, Calendar, Globe, Filter } from 'lucide-react';
import { useShowUniverseData } from '@/hooks/useShowUniverseData';

export const PublicShows: React.FC = () => {
  const { data, isLoading } = useShowUniverseData();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading shows...</p>
      </div>
    );
  }

  // Get unique shows
  const shows = [...new Set(data.map(item => item.show_id))].map(showId => {
    const showItem = data.find(item => item.show_id === showId);
    const showEpisodes = data.filter(item => item.show_id === showId);
    const uniqueUniverses = [...new Set(showEpisodes.map(item => item.universe_id))];
    const seasons = [...new Set(showEpisodes.map(item => item.season_number))];
    
    return {
      ...showItem,
      episodeCount: showEpisodes.length,
      universeCount: uniqueUniverses.length,
      seasonCount: seasons.length
    };
  }).filter(Boolean);

  // Filter shows based on search term
  const filteredShows = shows.filter(show =>
    show?.show_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show?.show_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Tv className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-blue-700">All Shows</h1>
        <p className="text-muted-foreground">
          Explore all TV shows across different universes and track your viewing progress
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
          <Input
            placeholder="Search shows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
        </div>
      </div>

      {filteredShows.length === 0 ? (
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Tv className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-blue-700">No Shows Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No shows are available at the moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <Card key={show?.show_id} className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
              <CardHeader className="border-b border-blue-100">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">
                    <Link 
                      to={`/public/show/${show?.slug || show?.show_title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {show?.show_title}
                    </Link>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                    {show?.universeCount} universe{show?.universeCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {show?.show_description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {show.show_description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground pt-2 border-t border-blue-50">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{show?.seasonCount} seasons</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600"># {show?.episodeCount} episodes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicShows;
