
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, Hash, Tv } from 'lucide-react';
import { UniverseEpisode } from '@/hooks/useUniverseEpisodes';
import { useEpisodeStatus } from '@/hooks/useEpisodeStatus';

interface EpisodeCardProps {
  episode: UniverseEpisode;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode }) => {
  const { toggleWatchStatus, isUpdating } = useEpisodeStatus();

  const handleWatchToggle = () => {
    toggleWatchStatus({
      episodeId: episode.id,
      currentStatus: episode.watched
    });
  };

  return (
    <Card className={`${episode.watched ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/30 border-gray-200'} hover:shadow-md transition-all duration-200`}>
      <CardContent className="p-4 space-y-3">
        {/* Header with show name and status icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Tv className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h3 className="font-medium text-blue-600 truncate">
              {episode.show?.title || 'Unknown Show'}
            </h3>
          </div>
          <div className="flex-shrink-0">
            {episode.watched ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Episode title */}
        <h4 className="font-semibold text-gray-900 line-clamp-2">
          {episode.title}
        </h4>

        {/* Episode details */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-xs">
            <Hash className="w-3 h-3 mr-1" />
            S{episode.season_number}E{episode.episode_number}
          </Badge>
          
          {episode.air_date && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(episode.air_date).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Button
            size="sm"
            variant={episode.watched ? "outline" : "default"}
            onClick={handleWatchToggle}
            disabled={isUpdating}
            className={`w-full text-sm transition-colors ${
              episode.watched 
                ? "border-red-200 text-red-600 hover:bg-red-50" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {episode.watched ? 'Mark Unwatched' : 'Mark Watched'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
