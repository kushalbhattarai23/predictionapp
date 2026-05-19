
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Globe, Search, Tv, Filter } from 'lucide-react';
import { useShowUniverseData } from '@/hooks/useShowUniverseData';

export const PublicUniverses: React.FC = () => {
  const { data, isLoading } = useShowUniverseData();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading universes...</p>
      </div>
    );
  }

  // Get unique universes
  const universes = [...new Set(data.map(item => item.universe_id))].map(universeId => {
    const universeItem = data.find(item => item.universe_id === universeId);
    const universeEpisodes = data.filter(item => item.universe_id === universeId);
    const uniqueShows = [...new Set(universeEpisodes.map(item => item.show_id))];
    
    return {
      ...universeItem,
      episodeCount: universeEpisodes.length,
      showCount: uniqueShows.length
    };
  }).filter(Boolean);

  // Filter universes based on search term
  const filteredUniverses = universes.filter(universe =>
    universe?.universe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    universe?.universe_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Globe className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-blue-700">All Universes</h1>
        <p className="text-muted-foreground">
          Explore different universes and discover the shows and episodes within each one
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
          <Input
            placeholder="Search universes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
        </div>
      </div>

      {filteredUniverses.length === 0 ? (
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Globe className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-blue-700">No Universes Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No universes are available at the moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniverses.map((universe) => (
            <Card key={universe?.universe_id} className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-xl">
                  <Link 
                    to={`/public/universe/${universe?.universe_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {universe?.universe_name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {universe?.universe_description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {universe.universe_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-blue-50">
                  <div className="flex items-center">
                    <Tv className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{universe?.showCount} shows</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600"># {universe?.episodeCount} episodes</span>
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

export default PublicUniverses;
