
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft, Globe } from 'lucide-react';
import { useShowUniverseData } from '@/hooks/useShowUniverseData';

export const PublicShowDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useShowUniverseData();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Find the show by slug
  const showData = data.find(item => 
    item.slug === slug || 
    item.show_title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') === slug
  );

  if (!showData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
          <Link to="/public/shows" className="text-blue-600 hover:underline">
            Back to Shows
          </Link>
        </div>
      </div>
    );
  }

  // Get unique episodes for this show only
  const uniqueEpisodes = data
    .filter(item => item.show_id === showData.show_id)
    .reduce((acc, current) => {
      // Check if we already have this episode
      const existingEpisode = acc.find(ep => ep.episode_id === current.episode_id);
      if (!existingEpisode) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof data)
    .sort((a, b) => {
      if (a.season_number !== b.season_number) {
        return a.season_number - b.season_number;
      }
      return a.episode_number - b.episode_number;
    });

  // Get unique universes this show belongs to
  const uniqueUniverses = data
    .filter(item => item.show_id === showData.show_id)
    .reduce((acc, current) => {
      // Check if we already have this universe
      const existingUniverse = acc.find(univ => univ.universe_id === current.universe_id);
      if (!existingUniverse) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof data);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/public/shows" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Shows
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{showData.show_title}</h1>
        {showData.show_description && (
          <p className="text-muted-foreground">{showData.show_description}</p>
        )}
        <div className="mt-4">
          <Badge variant="outline" className="text-sm">
            {uniqueEpisodes.length} episodes across {[...new Set(uniqueEpisodes.map(ep => ep.season_number))].length} seasons
          </Badge>
        </div>
      </div>

      {uniqueUniverses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Part of Universes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueUniverses.map((universe) => (
              <Card key={universe.universe_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <Link 
                      to={`/public/universe/${universe.universe_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                      className="text-blue-600 hover:underline"
                    >
                      {universe.universe_name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {universe.universe_description && (
                    <p className="text-sm text-muted-foreground">
                      {universe.universe_description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Episodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueEpisodes.map((episode) => (
            <Card key={episode.episode_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-blue-600">
                    {episode.episode_title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    S{episode.season_number}E{episode.episode_number}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {episode.air_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(episode.air_date).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicShowDetail;
